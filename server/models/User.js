import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    firstName:                { type: String, required: true, trim: true },
    lastName:                 { type: String, required: true, trim: true },
    email:                    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:                 { type: String, select: false },
    isVerified:               { type: Boolean, default: false },
    verificationToken:        String,
    verificationTokenExpires: Date,
    resetPasswordToken:       String,
    resetPasswordExpires:     Date,
    role:                     { type: String, enum: ['command', 'captain'], default: 'command' },
    assignedShipId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', default: null },
    googleId:                 String,
    githubId:                 String,
    avatar:                   String,
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model('User', userSchema)
