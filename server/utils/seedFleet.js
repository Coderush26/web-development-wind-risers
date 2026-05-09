import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Ship from '../models/Ship.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fleetData = JSON.parse(
  readFileSync(join(__dirname, '../data/fleet.json'), 'utf-8')
)

export async function seedFleet() {
  const count = await Ship.countDocuments()
  if (count > 0) return

  const portMap = Object.fromEntries(
    fleetData.ports.map(p => [p.id, p])
  )

  const ships = fleetData.fleet.map(s => {
    const port = portMap[s.destination]
    return {
      shipId:        s.shipId,
      name:          s.name,
      position:      { lat: s.position[0], lng: s.position[1] },
      speed:         s.speed,
      heading:       s.heading,
      destination:   { id: port.id, name: port.name, lat: port.position[0], lng: port.position[1] },
      fuelRemaining: s.fuel,
      fuelCapacity:  s.fuel,  // starting fuel = capacity
      cargo:         s.cargo,
      status:        s.status,
      currentPath:   [],
      pathIndex:     0,
    }
  })

  await Ship.insertMany(ships)
  console.log(`Seeded ${ships.length} ships from fleet.json`)
}

export { fleetData }
