import { Router } from 'express'
import protect from '../middleware/authMiddleware.js'
import Ship from '../models/Ship.js'

const router = Router()

// Public — used by signup form to populate captain ship selector
router.get('/list', async (req, res) => {
  try {
    const ships = await Ship.find({}, 'shipId name cargo').lean()
    res.json(ships)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/', protect, async (req, res) => {
  try {
    const ships = await Ship.find({})
    res.json(ships)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    const ship = await Ship.findById(req.params.id)
    if (!ship) return res.status(404).json({ message: 'Ship not found' })
    res.json(ship)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
