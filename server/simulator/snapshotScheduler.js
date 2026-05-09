import cron from 'node-cron'
import Ship from '../models/Ship.js'
import Alert from '../models/Alert.js'
import HistorySnapshot from '../models/HistorySnapshot.js'

const RETENTION_MS = 2 * 60 * 60 * 1000  // keep 2 hours (spec: 1hr minimum)

export function startSnapshotScheduler() {
  // Every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const [ships, activeAlerts] = await Promise.all([
        Ship.find({}).lean(),
        Alert.find({ status: 'active' }).lean(),
      ])

      await HistorySnapshot.create({ ships, activeAlerts, capturedAt: new Date() })

      // Ring buffer — delete anything older than retention window
      const cutoff = new Date(Date.now() - RETENTION_MS)
      await HistorySnapshot.deleteMany({ capturedAt: { $lt: cutoff } })
    } catch (err) {
      console.error('Snapshot scheduler error:', err.message)
    }
  })

  console.log('Snapshot scheduler started (30s interval, 2hr retention)')
}
