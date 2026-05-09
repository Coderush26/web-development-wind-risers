import Pusher from 'pusher'

let _instance = null

function getPusher() {
  if (!_instance) {
    _instance = new Pusher({
      appId:   process.env.PUSHER_APP_ID,
      key:     process.env.PUSHER_KEY,
      secret:  process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS:  true,
    })
  }
  return _instance
}

// Convenience wrapper — same call signature as pusher.trigger(...)
export async function trigger(channel, event, data) {
  return getPusher().trigger(channel, event, data)
}
