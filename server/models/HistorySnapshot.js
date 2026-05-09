import mongoose from 'mongoose'

const historySnapshotSchema = new mongoose.Schema(
  {
    capturedAt:   { type: Date, default: Date.now, index: true },
    ships:        [mongoose.Schema.Types.Mixed],
    activeAlerts: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: false }
)

export default mongoose.model('HistorySnapshot', historySnapshotSchema)
