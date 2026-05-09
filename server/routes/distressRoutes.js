import { Router } from 'express'
import protect, { requireRole } from '../middleware/authMiddleware.js'
import Ship from '../models/Ship.js'
import Alert from '../models/Alert.js'
import { processDistressMessage } from '../services/aiService.js'
import { trigger } from '../utils/pusher.js'

const router = Router()

// POST /api/distress — captain submits a free-form distress message
router.post('/', protect, requireRole('captain'), async (req, res) => {
  try {
    const { shipId, message } = req.body
    if (!shipId || !message?.trim()) {
      return res.status(400).json({ message: 'shipId and message are required' })
    }

    const ship = await Ship.findById(shipId)
    if (!ship) return res.status(404).json({ message: 'Ship not found' })

    // Ensure captain owns this ship
    if (req.user.assignedShipId?.toString() !== shipId) {
      return res.status(403).json({ message: 'You are not assigned to this ship' })
    }

    // Process via Groq AI
    let aiExtracted
    try {
      aiExtracted = await processDistressMessage(message, ship)
    } catch (err) {
      console.error('Groq AI error:', err.message)
      aiExtracted = {
        severity:               'high',
        issue:                  message,
        injuryCount:            null,
        damageEstimate:         null,
        requiresImmediateAction: true,
      }
    }

    // Map AI severity to Alert severity enum
    const severityMap = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' }
    const severity = severityMap[aiExtracted.severity] || 'high'

    // Update ship status to distressed
    ship.status = 'distressed'
    await ship.save()

    const alert = await Alert.create({
      type:     'distress',
      severity,
      shipIds:  [ship._id],
      message:  `DISTRESS: ${ship.name} — ${aiExtracted.issue}`,
      aiExtracted: {
        severity:        aiExtracted.severity,
        issue:           aiExtracted.issue,
        injuryCount:     aiExtracted.injuryCount,
        damageEstimate:  aiExtracted.damageEstimate,
        rawMessage:      message,
      },
      status: 'active',
    })

    await trigger('alerts', 'alert', { alert })

    res.status(201).json({ alert, aiExtracted })
  } catch (err) {
    console.error('Distress route error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

export default router
