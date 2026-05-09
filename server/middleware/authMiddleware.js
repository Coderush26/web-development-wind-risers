import jwt from 'jsonwebtoken'

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Not authorized' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Token invalid' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' })
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
  next()
}

export default protect
