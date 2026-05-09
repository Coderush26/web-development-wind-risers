import { Router } from 'express'
import protect, { requireRole } from '../middleware/authMiddleware.js'
import Zone from '../models/Zone.js'
import Ship from '../models/Ship.js'
import { trigger } from '../utils/pusher.js'
import { computePathWithZones } from '../routing/router.js'

const router = Router()

router.get('/', protect, async (req, res) => {
  try {
    const zones = await Zone.find({}).populate('createdBy', 'firstName lastName')
    res.json(zones)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', protect, requireRole('command'), async (req, res) => {
  try {
    const { name, type, polygon } = req.body
    if (!name || !polygon || polygon.length < 3) {
      return res.status(400).json({ message: 'name and polygon (≥3 points) required' })
    }

    const zone = await Zone.create({ name, type: type || 'restricted', polygon, createdBy: req.user.id })

    await trigger('zones', 'zone_created', { zone })

    // Reroute all active ships away from this new zone
    const allZones = await Zone.find({ isActive: true })
    const ships = await Ship.find({ status: { $nin: ['arrived', 'stopped'] } })
    for (const ship of ships) {
      const newPath = computePathWithZones(
        { lat: ship.position.lat, lng: ship.position.lng },
        { lat: ship.destination.lat, lng: ship.destination.lng },
        allZones
      )
      if (newPath.length > 0) {
        ship.currentPath = newPath
        ship.pathIndex   = 0
        if (ship.status === 'normal') ship.status = 'rerouting'
        await ship.save()
      }
    }

    await trigger('fleet', 'fleet_update', {
      ts: Date.now(),
      ships: ships.map(s => {
        const { currentPath, pathIndex, __v, ...rest } = s.toObject()
        return rest
      }),
    })

    res.status(201).json(zone)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id', protect, requireRole('command'), async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!zone) return res.status(404).json({ message: 'Zone not found' })
    await trigger('zones', 'zone_updated', { zone })
    res.json(zone)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', protect, requireRole('command'), async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id)
    if (!zone) return res.status(404).json({ message: 'Zone not found' })

    // Recompute paths for all active ships now that this zone is gone
    const remainingZones = await Zone.find({ isActive: true })
    const ships = await Ship.find({ status: { $nin: ['arrived', 'stopped', 'distressed'] } })
    for (const ship of ships) {
      const newPath = computePathWithZones(
        { lat: ship.position.lat, lng: ship.position.lng },
        { lat: ship.destination.lat, lng: ship.destination.lng },
        remainingZones
      )
      if (newPath.length > 0) {
        ship.currentPath = newPath
        ship.pathIndex   = 0
        if (ship.status === 'rerouting') ship.status = 'normal'
        await ship.save()
      }
    }

    await trigger('zones', 'zone_deleted', { zoneId: req.params.id })
    await trigger('fleet', 'fleet_update', {
      ts: Date.now(),
      ships: ships.map(s => {
        const { currentPath, pathIndex, __v, ...rest } = s.toObject()
        return rest
      }),
    })

    res.json({ message: 'Zone deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
