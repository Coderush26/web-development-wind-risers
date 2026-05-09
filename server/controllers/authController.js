import crypto from 'crypto'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import sendEmail from '../utils/sendEmail.js'

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, assignedShipId } = req.body

    const existing = await User.findOne({ email })
    if (existing) {
      if (existing.isVerified)
        return res.status(400).json({ message: 'An account with this email already exists.' })

      // Account exists but was never verified — regenerate token and resend
      const verificationToken = crypto.randomBytes(32).toString('hex')
      await User.findOneAndUpdate(
        { email },
        { verificationToken, verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 }
      )

      const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
      await sendEmail({
        to: email,
        subject: 'Verify your CodeRush account',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
            <h2 style="color:#1e3a5f;margin-bottom:8px;">Verify your email</h2>
            <p style="color:#374151;">Hi ${existing.firstName},</p>
            <p style="color:#374151;">Here's a fresh verification link for your CodeRush account:</p>
            <a href="${verifyUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
              Verify Email
            </a>
            <p style="color:#9ca3af;font-size:13px;">Link expires in 24 hours.</p>
          </div>
        `,
      })
      return res.status(200).json({ message: 'Account created! Check your email to verify your account.' })
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')

    await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role === 'captain' ? 'captain' : 'command',
      assignedShipId: role === 'captain' ? (assignedShipId || null) : null,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
    })

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`

    await sendEmail({
      to: email,
      subject: 'Verify your CodeRush account',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#4f46e5;margin-bottom:8px;">Welcome to CodeRush!</h2>
          <p style="color:#374151;">Hi ${firstName},</p>
          <p style="color:#374151;">Thanks for signing up. Verify your email to get started:</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
            Verify Email
          </a>
          <p style="color:#9ca3af;font-size:13px;">Link expires in 24 hours. Didn't sign up? Ignore this email.</p>
        </div>
      `,
    })

    res.status(201).json({ message: 'Account created! Check your email to verify your account.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Verify Email ──────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() },
    })

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired verification link.' })

    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    res.json({ message: 'Email verified! You can now log in.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' })

    if (!user.password)
      return res.status(400).json({ message: 'Invalid email or password.' })

    if (!user.isVerified)
      return res.status(403).json({ message: 'Please verify your email before logging in.' })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' })

    const token = generateToken({ id: user._id })

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        assignedShipId: user.assignedShipId,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })

    // Always return 200 to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' })

    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    await user.save()

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

    await sendEmail({
      to: user.email,
      subject: 'Reset your CodeRush password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#4f46e5;margin-bottom:8px;">Password Reset</h2>
          <p style="color:#374151;">Hi ${user.firstName},</p>
          <p style="color:#374151;">You requested a password reset. Click below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:13px;">Link expires in 1 hour. Didn't request this? Ignore this email.</p>
        </div>
      `,
    })

    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired reset link.' })

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    await sendEmail({
      to: user.email,
      subject: 'Your CodeRush password was reset',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#4f46e5;">Password Reset Successful</h2>
          <p style="color:#374151;">Hi ${user.firstName}, your password has been updated.</p>
          <p style="color:#9ca3af;font-size:13px;">If you didn't do this, contact support immediately.</p>
        </div>
      `,
    })

    res.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

