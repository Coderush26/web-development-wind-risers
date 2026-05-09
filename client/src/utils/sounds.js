function beep(ctx, freq, start, dur, vol = 0.18) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(vol, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
  osc.start(start)
  osc.stop(start + dur + 0.01)
}

function ctx() {
  return new (window.AudioContext || window.webkitAudioContext)()
}

// Distress signal — three rapid high-pitched beeps (most urgent)
export function playDistressSound() {
  try {
    const c = ctx(), t = c.currentTime
    beep(c, 1100, t,        0.12, 0.22)
    beep(c, 1100, t + 0.18, 0.12, 0.22)
    beep(c, 1100, t + 0.36, 0.20, 0.25)
  } catch { /* autoplay policy */ }
}

// Geofence / zone violation — two-tone alarm
export function playGeofenceSound() {
  try {
    const c = ctx(), t = c.currentTime
    beep(c, 880, t,        0.18, 0.20)
    beep(c, 660, t + 0.22, 0.18, 0.18)
    beep(c, 880, t + 0.44, 0.18, 0.18)
  } catch { /* autoplay policy */ }
}

// Proximity alert — double pulse
export function playProximitySound() {
  try {
    const c = ctx(), t = c.currentTime
    beep(c, 740, t,        0.14, 0.17)
    beep(c, 740, t + 0.22, 0.18, 0.17)
  } catch { /* autoplay policy */ }
}

// Low fuel / insufficient fuel — slow descending warning
export function playFuelSound() {
  try {
    const c = ctx(), t = c.currentTime
    beep(c, 520, t,        0.25, 0.15)
    beep(c, 440, t + 0.35, 0.30, 0.15)
  } catch { /* autoplay policy */ }
}

// Generic critical — single sharp beep
export function playCriticalSound() {
  try {
    const c = ctx(), t = c.currentTime
    beep(c, 880, t, 0.4, 0.18)
  } catch { /* autoplay policy */ }
}

// Generic high — soft double beep
export function playHighSound() {
  try {
    const c = ctx(), t = c.currentTime
    beep(c, 660, t,        0.15, 0.14)
    beep(c, 660, t + 0.22, 0.20, 0.14)
  } catch { /* autoplay policy */ }
}

// Directive received (captain side) — ascending two-tone notification
export function playDirectiveSound() {
  try {
    const c = ctx(), t = c.currentTime
    beep(c, 440, t,        0.12, 0.14)
    beep(c, 660, t + 0.16, 0.18, 0.14)
  } catch { /* autoplay policy */ }
}

// Route all alert sounds through a single dispatcher
export function playAlertSound(severity, type) {
  if (type === 'distress')               return playDistressSound()
  if (type === 'geofence')               return playGeofenceSound()
  if (type === 'proximity')              return playProximitySound()
  if (type === 'fuel')                   return playFuelSound()
  if (severity === 'critical')           return playCriticalSound()
  if (severity === 'high')               return playHighSound()
  // medium / low — silent (no alert fatigue)
}
