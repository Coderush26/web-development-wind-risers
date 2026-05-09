import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import shipRoutes from './routes/shipRoutes.js'
import zoneRoutes from './routes/zoneRoutes.js'
import alertRoutes from './routes/alertRoutes.js'
import distressRoutes from './routes/distressRoutes.js'
import directiveRoutes from './routes/directiveRoutes.js'
import historyRoutes from './routes/historyRoutes.js'
import { seedFleet } from './utils/seedFleet.js'
import { seedUsers } from './utils/seedUsers.js'
import { initRouter } from './routing/router.js'
import { startSimulator } from './simulator/shipSimulator.js'
import { startSnapshotScheduler } from './simulator/snapshotScheduler.js'

const app = express()
const PORT = process.env.PORT || 5000

connectDB().then(async () => {
  await seedFleet()
  await seedUsers()
  initRouter()
  await startSimulator()
  startSnapshotScheduler()
})

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/ships', shipRoutes)
app.use('/api/zones', zoneRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/distress', distressRoutes)
app.use('/api/directives', directiveRoutes)
app.use('/api/history', historyRoutes)

app.get('/', (req, res) => res.json({ message: 'CodeRush API running' }))

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
