import { createContext, useContext, useEffect, useState } from 'react'
import Pusher from 'pusher-js'
import api from '../utils/api'
import { useAuth } from './AuthContext'

const PusherContext = createContext(null)

export function PusherProvider({ children }) {
  const { user } = useAuth()

  const [fleet,      setFleet]      = useState([])
  const [alerts,     setAlerts]     = useState([])
  const [zones,      setZones]      = useState([])
  const [directives, setDirectives] = useState([])
  const [loading,    setLoading]    = useState(true)

  // Fetch initial state — only when authenticated
  useEffect(() => {
    if (!user) { setLoading(false); return }

    setLoading(true)
    Promise.all([
      api.get('/ships'),
      api.get('/alerts/active'),
      api.get('/zones'),
    ])
      .then(([ships, activeAlerts, zonesRes]) => {
        setFleet(ships.data)
        setAlerts(activeAlerts.data)
        setZones(zonesRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // Pusher real-time subscriptions — only when authenticated
  useEffect(() => {
    if (!user) return

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    })

    const fleetCh      = pusher.subscribe('fleet')
    const alertsCh     = pusher.subscribe('alerts')
    const zonesCh      = pusher.subscribe('zones')
    const directivesCh = pusher.subscribe('directives')

    fleetCh.bind('fleet_update', ({ ships, ts }) => {
      if (ts) console.debug(`[fleet] latency: ${Date.now() - ts} ms`)
      setFleet(ships)
    })

    alertsCh.bind('alert', ({ alert }) =>
      setAlerts(prev => [alert, ...prev])
    )
    alertsCh.bind('alert_updated', ({ alert: updated }) =>
      setAlerts(prev => prev.map(a => a._id === updated._id ? updated : a))
    )

    zonesCh.bind('zone_created', ({ zone }) =>
      setZones(prev => [...prev, zone])
    )
    zonesCh.bind('zone_updated', ({ zone: updated }) =>
      setZones(prev => prev.map(z => z._id === updated._id ? updated : z))
    )
    zonesCh.bind('zone_deleted', ({ zoneId }) =>
      setZones(prev => prev.filter(z => z._id !== zoneId))
    )

    directivesCh.bind('directive', ({ directive }) =>
      setDirectives(prev => [directive, ...prev])
    )
    directivesCh.bind('directive_update', ({ directive: updated }) =>
      setDirectives(prev => prev.map(d => d._id === updated._id ? updated : d))
    )

    return () => pusher.disconnect()
  }, [user])

  return (
    <PusherContext.Provider value={{
      fleet, alerts, zones, directives, loading,
      setAlerts, setZones, setDirectives,
    }}>
      {children}
    </PusherContext.Provider>
  )
}

export const usePusher = () => useContext(PusherContext)
