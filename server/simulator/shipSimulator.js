import * as turf from '@turf/turf'
import Ship from '../models/Ship.js'
import Zone from '../models/Zone.js'
import Alert from '../models/Alert.js'
import { trigger } from '../utils/pusher.js'
import { computePathWithZones } from '../routing/router.js'
import { isAdverseWeather } from '../services/weatherService.js'

// knots → degrees per second (1 knot ≈ 1.852 km/h; 1° lat ≈ 111.32 km)
const KNOTS_TO_DEG_PER_SEC = 1.852 / (111.32 * 3600)
const ARRIVAL_RADIUS_KM = 0.5
const PROXIMITY_THRESHOLD_KM = 2

// Base fuel burn per tick (tonnes/sec). Derived so a 7000t ship at 14kn lasts ~72h.
// 7000 / (72 * 3600) ≈ 0.027 t/s. We scale by speed ratio so faster ships burn more.
const BASE_FUEL_BURN_PER_KNOT_PER_SEC = 0.002

// Track which ship+zone pairs already have an active geofence alert (avoid duplicates)
const activeGeofencePairs = new Set()
// Track which ship pairs already have an active proximity alert
const activeProximityPairs = new Set()

function advancePosition(ship) {
  const speedDegPerSec = ship.speed * KNOTS_TO_DEG_PER_SEC
  const headingRad = (ship.heading * Math.PI) / 180

  if (ship.currentPath.length > 0 && ship.pathIndex < ship.currentPath.length) {
    // Follow computed waypoint path
    const target = ship.currentPath[ship.pathIndex]
    const distToTarget = turf.distance(
      turf.point([ship.position.lng, ship.position.lat]),
      turf.point([target.lng, target.lat]),
      { units: 'kilometers' }
    )
    const stepKm = ship.speed * 1.852 / 3600  // km per tick

    if (distToTarget <= stepKm) {
      // Reached this waypoint — snap to it and advance index
      ship.position.lat = target.lat
      ship.position.lng = target.lng
      ship.pathIndex += 1
    } else {
      // Move toward waypoint
      const bearing = turf.bearing(
        turf.point([ship.position.lng, ship.position.lat]),
        turf.point([target.lng, target.lat])
      )
      ship.heading = (bearing + 360) % 360
      const dest = turf.destination(
        turf.point([ship.position.lng, ship.position.lat]),
        stepKm,
        bearing,
        { units: 'kilometers' }
      )
      ship.position.lng = dest.geometry.coordinates[0]
      ship.position.lat = dest.geometry.coordinates[1]
    }
  } else {
    // No path — move on current heading (straight line)
    ship.position.lat += Math.cos(headingRad) * speedDegPerSec
    ship.position.lng += Math.sin(headingRad) * speedDegPerSec * Math.cos((ship.position.lat * Math.PI) / 180)
  }
}

function applyFuelBurn(ship) {
  const burn = ship.speed * BASE_FUEL_BURN_PER_KNOT_PER_SEC * (ship.inAdverseWeather ? 1.3 : 1.0)
  ship.fuelRemaining = Math.max(0, ship.fuelRemaining - burn)

  if (ship.fuelRemaining === 0 && ship.status !== 'arrived') {
    ship.status = 'stopped'
  }
}

function checkArrival(ship) {
  if (ship.status === 'arrived' || ship.status === 'stopped') return
  const dist = turf.distance(
    turf.point([ship.position.lng, ship.position.lat]),
    turf.point([ship.destination.lng, ship.destination.lat]),
    { units: 'kilometers' }
  )
  if (dist <= ARRIVAL_RADIUS_KM) {
    ship.status = 'arrived'
    ship.currentPath = []
    ship.pathIndex = 0
  }
}

async function checkGeofences(ships, zones) {
  for (const ship of ships) {
    if (ship.status === 'arrived' || ship.status === 'stopped') continue
    for (const zone of zones) {
      const pairKey = `${ship._id}:${zone._id}`
      const turfPolygon = turf.polygon([
        zone.polygon.map(p => [p[1], p[0]])  // [lat,lng] → [lng,lat] for GeoJSON
      ])
      const inside = turf.booleanPointInPolygon(
        turf.point([ship.position.lng, ship.position.lat]),
        turfPolygon
      )

      if (inside && !activeGeofencePairs.has(pairKey)) {
        activeGeofencePairs.add(pairKey)

        const alert = await Alert.create({
          type:     'geofence',
          severity: 'critical',
          shipIds:  [ship._id],
          zoneId:   zone._id,
          message:  `${ship.name} has entered restricted zone "${zone.name}"`,
          status:   'active',
        })

        if (ship.status !== 'distressed') ship.status = 'rerouting'
        await ship.save()

        await trigger('alerts', 'alert', { alert })
      } else if (!inside && activeGeofencePairs.has(pairKey)) {
        activeGeofencePairs.delete(pairKey)
      }
    }
  }
}

async function checkProximity(ships) {
  for (let i = 0; i < ships.length; i++) {
    for (let j = i + 1; j < ships.length; j++) {
      const a = ships[i]
      const b = ships[j]
      const pairKey = [a._id, b._id].sort().join(':')

      const dist = turf.distance(
        turf.point([a.position.lng, a.position.lat]),
        turf.point([b.position.lng, b.position.lat]),
        { units: 'kilometers' }
      )

      if (dist < PROXIMITY_THRESHOLD_KM && !activeProximityPairs.has(pairKey)) {
        activeProximityPairs.add(pairKey)

        const alert = await Alert.create({
          type:     'proximity',
          severity: 'high',
          shipIds:  [a._id, b._id],
          message:  `${a.name} and ${b.name} are within ${dist.toFixed(2)} km of each other`,
          status:   'active',
        })

        await trigger('alerts', 'alert', { alert })
      } else if (dist >= PROXIMITY_THRESHOLD_KM && activeProximityPairs.has(pairKey)) {
        activeProximityPairs.delete(pairKey)
      }
    }
  }
}

async function computeInitialPaths() {
  const ships = await Ship.find({ status: { $nin: ['arrived', 'stopped'] } })
  const zones = await Zone.find({ isActive: true })
  let computed = 0
  for (const ship of ships) {
    const path = computePathWithZones(
      { lat: ship.position.lat, lng: ship.position.lng },
      { lat: ship.destination.lat, lng: ship.destination.lng },
      zones
    )
    if (path.length > 0) {
      ship.currentPath = path
      ship.pathIndex   = 0
      await ship.save()
      computed++
    }
  }
  console.log(`Router: computed initial paths for ${computed} ships`)
}

export async function startSimulator() {
  console.log('Ship simulator started at 1 Hz')
  await computeInitialPaths()

  setInterval(async () => {
    try {
      const ships = await Ship.find({})
      const zones = await Zone.find({ isActive: true })

      // Advance all ships, collect weather checks in parallel
      const weatherChecks = ships
        .filter(s => s.status !== 'stopped' && s.status !== 'arrived')
        .map(s => isAdverseWeather(s.position.lat, s.position.lng).then(v => [s._id.toString(), v]))
      const weatherMap = Object.fromEntries(await Promise.all(weatherChecks))

      const toSave = []
      for (const ship of ships) {
        if (ship.status === 'stopped' || ship.status === 'arrived') continue

        // Recompute path if missing or exhausted (self-healing)
        const pathExhausted = ship.currentPath.length === 0 || ship.pathIndex >= ship.currentPath.length
        if (pathExhausted && ship.status !== 'distressed') {
          const newPath = computePathWithZones(
            { lat: ship.position.lat, lng: ship.position.lng },
            { lat: ship.destination.lat, lng: ship.destination.lng },
            zones
          )
          if (newPath.length > 0) {
            ship.currentPath = newPath
            ship.pathIndex   = 0
          }
        }

        ship.inAdverseWeather = weatherMap[ship._id.toString()] ?? false

        advancePosition(ship)
        applyFuelBurn(ship)
        checkArrival(ship)

        // Flag insufficient fuel (but keep moving)
        if (
          ship.fuelRemaining > 0 &&
          ship.status === 'normal' &&
          ship.fuelRemaining < ship.fuelCapacity * 0.05
        ) {
          ship.status = 'insufficient_fuel'
        }

        toSave.push(ship)
      }

      // Save all ships in parallel instead of sequentially
      await Promise.all(toSave.map(s => s.save()))

      await checkGeofences(ships, zones)
      await checkProximity(ships)

      await trigger('fleet', 'fleet_update', {
        ts: Date.now(),
        ships: ships.map(s => {
          const { currentPath, pathIndex, __v, ...rest } = s.toObject()
          return rest
        }),
      })
    } catch (err) {
      console.error('Simulator tick error:', err.message)
    }
  }, 1000)
}
