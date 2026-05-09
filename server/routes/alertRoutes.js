import { Router } from 'express'
import protect, { requireRole } from '../middleware/authMiddleware.js'
import Alert from '../models/Alert.js'
import { trigger } from '../utils/pusher.js'

const router = Router()

router.get('/', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({})
      .populate('shipIds', 'name shipId')
      .populate('acknowledgedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
    res.json(alerts)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/active', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'active' })
      .populate('shipIds', 'name shipId')
      .sort({ createdAt: -1 })
    res.json(alerts)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id/acknowledge', protect, requireRole('command'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged', acknowledgedBy: req.user.id },
      { new: true }
    ).populate('shipIds', 'name shipId')
    if (!alert) return res.status(404).json({ message: 'Alert not found' })
    await trigger('alerts', 'alert_updated', { alert })
    res.json(alert)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id/resolve', protect, requireRole('command'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', acknowledgedBy: req.user.id },
      { new: true }
    ).populate('shipIds', 'name shipId')
    if (!alert) return res.status(404).json({ message: 'Alert not found' })
    await trigger('alerts', 'alert_updated', { alert })
    res.json(alert)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
