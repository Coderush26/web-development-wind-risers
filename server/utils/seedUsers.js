import User from '../models/User.js'
import Ship from '../models/Ship.js'

// Demo credentials — document these in README
const DEMO_ACCOUNTS = [
  {
    firstName: 'Fleet',
    lastName:  'Command',
    email:     'command@fleet.io',
    password:  'command123',
    role:      'command',
    shipId:    null,
  },
  {
    firstName: 'Captain',
    lastName:  'Gharial',
    email:     'gharial@fleet.io',
    password:  'captain123',
    role:      'captain',
    shipId:    'MV-7',   // low-fuel ship — good for demo drama
  },
  {
    firstName: 'Captain',
    lastName:  'Aurora',
    email:     'aurora@fleet.io',
    password:  'captain123',
    role:      'captain',
    shipId:    'MV-1',
  },
  {
    firstName: 'Captain',
    lastName:  'Cygnus',
    email:     'cygnus@fleet.io',
    password:  'captain123',
    role:      'captain',
    shipId:    'MV-3',
  },
]

export async function seedUsers() {
  const count = await User.countDocuments()
  if (count > 0) return

  for (const account of DEMO_ACCOUNTS) {
    let assignedShipId = null

    if (account.shipId) {
      const ship = await Ship.findOne({ shipId: account.shipId })
      if (ship) assignedShipId = ship._id
    }

    await User.create({
      firstName:   account.firstName,
      lastName:    account.lastName,
      email:       account.email,
      password:    account.password,   // hashed by pre-save hook
      role:        account.role,
      assignedShipId,
      isVerified:  true,               // pre-verified — no email step for demo accounts
    })
  }

  console.log('Seeded demo accounts:')
  console.log('  command@fleet.io  / command123  (Fleet Command)')
  console.log('  gharial@fleet.io  / captain123  (MV-7 Gharial)')
  console.log('  aurora@fleet.io   / captain123  (MV-1 Aurora)')
  console.log('  cygnus@fleet.io   / captain123  (MV-3 Cygnus)')
}
