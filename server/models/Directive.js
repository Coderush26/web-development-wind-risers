import mongoose from 'mongoose'

const directiveSchema = new mongoose.Schema(
  {
    fromUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toShipId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', required: true },
    toCaptainId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: ['reroute', 'divert_waypoint', 'hold_position'],
      required: true,
    },
    payload: {
      newDestination: { id: String, name: String, lat: Number, lng: Number },
      waypoint:       { lat: Number, lng: Number },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'escalated'],
      default: 'pending',
    },
    distressMessage: { type: String, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('Directive', directiveSchema)
