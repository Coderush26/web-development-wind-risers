import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['geofence', 'proximity', 'distress', 'fuel', 'stranded'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    shipIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ship' }],
    zoneId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', default: null },
    message: { type: String, required: true },
    aiExtracted: {
      severity:       String,
      issue:          String,
      injuryCount:    Number,
      damageEstimate: String,
      rawMessage:     String,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
    },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

export default mongoose.model('Alert', alertSchema)
