import Directive from '../models/Directive.js'
import Ship from '../models/Ship.js'
import Zone from '../models/Zone.js'
import Alert from '../models/Alert.js'
import User from '../models/User.js'
import { trigger } from '../utils/pusher.js'
import { computePathWithZones } from '../routing/router.js'
import { processDistressMessage } from '../services/aiService.js'

// POST /api/directives — Command issues a directive to a ship
export async function issueDirective(req, res) {
  try {
    const { toShipId, type, payload } = req.body
    if (!toShipId || !type) {
      return res.status(400).json({ message: 'toShipId and type are required' })
    }

    const ship = await Ship.findById(toShipId)
    if (!ship) return res.status(404).json({ message: 'Ship not found' })

    // Resolve the captain assigned to this ship
    const captain = await User.findOne({ assignedShipId: toShipId, role: 'captain' })

    const directive = await Directive.create({
      fromUserId:  req.user.id,
      toShipId:    ship._id,
      toCaptainId: captain?._id ?? null,
      type,
      payload:     payload || {},
      status:      'pending',
    })

    const populated = await directive.populate([
      { path: 'fromUserId',  select: 'firstName lastName' },
      { path: 'toShipId',    select: 'name shipId' },
      { path: 'toCaptainId', select: 'firstName lastName' },
    ])

    await trigger('directives', 'directive', { directive: populated })

    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/directives/ship/:shipId — directives for a specific ship
export async function getDirectivesForShip(req, res) {
  try {
    const directives = await Directive.find({ toShipId: req.params.shipId })
      .populate('fromUserId', 'firstName lastName')
      .populate('toShipId', 'name shipId')
      .sort({ createdAt: -1 })
    res.json(directives)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/directives/mine — pending directives for the logged-in captain's ship
export async function getMyDirectives(req, res) {
  try {
    const captain = await User.findById(req.user.id).select('assignedShipId')
    if (!captain?.assignedShipId) return res.json([])

    const directives = await Directive.find({
      toShipId: captain.assignedShipId,
      status:   'pending',
    })
      .populate('fromUserId', 'firstName lastName')
      .populate('toShipId', 'name shipId')
      .sort({ createdAt: -1 })
    res.json(directives)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/directives/:id/respond — Captain accepts or escalates
export async function respondToDirective(req, res) {
  try {
    const { response, distressMessage } = req.body
    if (!response || !['ACCEPT', 'ESCALATE_DISTRESS'].includes(response)) {
      return res.status(400).json({ message: 'response must be ACCEPT or ESCALATE_DISTRESS' })
    }

    const directive = await Directive.findById(req.params.id).populate('toShipId')
    if (!directive) return res.status(404).json({ message: 'Directive not found' })
    if (directive.status !== 'pending') {
      return res.status(409).json({ message: 'Directive already responded to' })
    }

    // Always fetch assignedShipId from DB — never trust the JWT for this
    const captain = await User.findById(req.user.id).select('assignedShipId')
    if (!captain?.assignedShipId || captain.assignedShipId.toString() !== directive.toShipId._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this ship' })
    }

    const ship = directive.toShipId  // populated

    if (response === 'ACCEPT') {
      directive.status = 'accepted'
      await directive.save()

      await applyDirectiveToShip(ship, directive)

      const populated = await directive.populate([
        { path: 'fromUserId',  select: 'firstName lastName' },
        { path: 'toCaptainId', select: 'firstName lastName' },
      ])

      await trigger('directives', 'directive_update', { directive: populated })
      return res.json(populated)
    }

    // ESCALATE_DISTRESS
    if (!distressMessage?.trim()) {
      return res.status(400).json({ message: 'distressMessage is required for escalation' })
    }

    directive.status = 'escalated'
    directive.distressMessage = distressMessage
    await directive.save()

    // Process via Groq AI
    let aiExtracted
    try {
      aiExtracted = await processDistressMessage(distressMessage, ship)
    } catch (err) {
      console.error('Groq error in directive escalation:', err.message)
      aiExtracted = {
        severity: 'high', issue: distressMessage,
        injuryCount: null, damageEstimate: null, requiresImmediateAction: true,
      }
    }

    const severityMap = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' }
    const severity = severityMap[aiExtracted.severity] || 'high'

    ship.status = 'distressed'
    await ship.save()

    const alert = await Alert.create({
      type:     'distress',
      severity,
      shipIds:  [ship._id],
      message:  `ESCALATED: ${ship.name} — ${aiExtracted.issue}`,
      aiExtracted: {
        severity:       aiExtracted.severity,
        issue:          aiExtracted.issue,
        injuryCount:    aiExtracted.injuryCount,
        damageEstimate: aiExtracted.damageEstimate,
        rawMessage:     distressMessage,
      },
      status: 'active',
    })

    const populated = await directive.populate([
      { path: 'fromUserId',  select: 'firstName lastName' },
      { path: 'toCaptainId', select: 'firstName lastName' },
    ])

    await Promise.all([
      trigger('alerts',     'alert',            { alert }),
      trigger('directives', 'directive_update', { directive: populated }),
    ])

    res.json({ directive: populated, alert, aiExtracted })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function applyDirectiveToShip(ship, directive) {
  const zones = await Zone.find({ isActive: true })

  if (directive.type === 'reroute') {
    const dest = directive.payload?.newDestination
    if (dest?.lat && dest?.lng) {
      ship.destination = { id: dest.id || '', name: dest.name || '', lat: dest.lat, lng: dest.lng }
      const newPath = computePathWithZones(
        { lat: ship.position.lat, lng: ship.position.lng },
        { lat: dest.lat, lng: dest.lng },
        zones
      )
      ship.currentPath = newPath
      ship.pathIndex   = 0
      ship.status      = newPath.length > 0 ? 'rerouting' : 'stranded'
    }

  } else if (directive.type === 'divert_waypoint') {
    const wp = directive.payload?.waypoint
    if (wp?.lat && wp?.lng) {
      // Insert waypoint right after current pathIndex
      const insertAt = Math.min(ship.pathIndex + 1, ship.currentPath.length)
      ship.currentPath.splice(insertAt, 0, { lat: wp.lat, lng: wp.lng })
      ship.status = 'rerouting'
    }

  } else if (directive.type === 'hold_position') {
    ship.status = 'stopped'
  }

  await ship.save()

  const allShips = await Ship.find({})
  await trigger('fleet', 'fleet_update', {
    ts: Date.now(),
    ships: allShips.map(s => {
      const { currentPath, pathIndex, __v, ...rest } = s.toObject()
      return rest
    }),
  })
}
