import { Router } from 'express'
import protect from '../middleware/authMiddleware.js'
import HistorySnapshot from '../models/HistorySnapshot.js'

const router = Router()

// GET /api/history — index: all snapshots sorted oldest → newest, id + capturedAt only
router.get('/', protect, async (req, res) => {
  try {
    const snapshots = await HistorySnapshot.find({}, '_id capturedAt')
      .sort({ capturedAt: 1 })
    res.json(snapshots)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/history/:snapshotId — full snapshot (ships + alerts at that moment)
router.get('/:snapshotId', protect, async (req, res) => {
  try {
    const snapshot = await HistorySnapshot.findById(req.params.snapshotId)
    if (!snapshot) return res.status(404).json({ message: 'Snapshot not found' })
    res.json(snapshot)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
