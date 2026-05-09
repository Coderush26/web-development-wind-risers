import mongoose from 'mongoose'

const zoneSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true },
    type:      { type: String, enum: ['restricted', 'weather'], default: 'restricted' },
    // polygon: array of [lat, lng] pairs forming a closed ring
    polygon:   { type: [[Number]], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Zone', zoneSchema)
