import { Router } from 'express'
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.js'
import protect from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register',              register)
router.get('/verify-email/:token',    verifyEmail)
router.post('/login',                 login)
router.post('/forgot-password',       forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.get('/me', protect,            getMe)

export default router
