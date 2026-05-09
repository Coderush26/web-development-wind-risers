import mongoose from 'mongoose'

const shipSchema = new mongoose.Schema(
  {
    shipId:   { type: String, required: true, unique: true },
    name:     { type: String, required: true },
    position: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    speed:   { type: Number, required: true },  // knots
    heading: { type: Number, required: true },  // 0-360 degrees from true north
    destination: {
      id:   String,
      name: String,
      lat:  Number,
      lng:  Number,
    },
    fuelRemaining: { type: Number, required: true },  // tonnes
    fuelCapacity:  { type: Number, required: true },
    cargo:         { type: String, required: true },
    status: {
      type: String,
      enum: ['normal', 'rerouting', 'distressed', 'stopped', 'stranded', 'arrived', 'insufficient_fuel'],
      default: 'normal',
    },
    currentPath: [{ lat: Number, lng: Number }],  // computed waypoints to destination
    pathIndex:   { type: Number, default: 0 },    // index into currentPath being followed
    inAdverseWeather: { type: Boolean, default: false },
    captainId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

export default mongoose.model('Ship', shipSchema)
