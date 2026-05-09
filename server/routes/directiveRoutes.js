import { Router } from 'express'
import protect, { requireRole } from '../middleware/authMiddleware.js'
import {
  issueDirective,
  getDirectivesForShip,
  getMyDirectives,
  respondToDirective,
} from '../controllers/directiveController.js'

const router = Router()

// Command issues a directive to a ship
router.post('/', protect, requireRole('command'), issueDirective)

// Captain fetches pending directives for their own ship
router.get('/mine', protect, requireRole('captain'), getMyDirectives)

// Any authenticated user can fetch all directives for a specific ship (for detail panels)
router.get('/ship/:shipId', protect, getDirectivesForShip)

// Captain responds to a directive
router.put('/:id/respond', protect, requireRole('captain'), respondToDirective)

export default router
