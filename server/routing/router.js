import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as turf from '@turf/turf'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fleetData = JSON.parse(readFileSync(join(__dirname, '../data/fleet.json'), 'utf8'))

const BBOX = fleetData.boundingBox  // { north, south, east, west }
const RESOLUTION = 0.05             // degrees per cell
const ROWS = Math.ceil((BBOX.north - BBOX.south) / RESOLUTION)   // 170
const COLS = Math.ceil((BBOX.east  - BBOX.west)  / RESOLUTION)   // 250

// Pre-computed water grid — true = navigable water
let waterGrid = null
let navigablePolygon = null

function latToRow(lat) {
  return Math.floor((BBOX.north - lat) / RESOLUTION)
}
function lngToCol(lng) {
  return Math.floor((lng - BBOX.west) / RESOLUTION)
}
function rowToLat(row) {
  return BBOX.north - (row + 0.5) * RESOLUTION
}
function colToLng(col) {
  return BBOX.west  + (col + 0.5) * RESOLUTION
}

function buildWaterGrid() {
  const raw = fleetData.navigableWater  // [[lat,lng], ...]
  const ring = raw.map(p => [p[1], p[0]])  // → [lng,lat] for GeoJSON
  navigablePolygon = turf.polygon([ring])

  waterGrid = new Uint8Array(ROWS * COLS)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const lat = rowToLat(r)
      const lng = colToLng(c)
      const inside = turf.booleanPointInPolygon(turf.point([lng, lat]), navigablePolygon)
      waterGrid[r * COLS + c] = inside ? 1 : 0
    }
  }
  console.log(`Router: water grid built — ${ROWS}×${COLS} (${waterGrid.reduce((s, v) => s + v, 0)} navigable cells)`)
}

function buildBlockedSet(zones) {
  const blocked = new Set()
  for (const zone of zones) {
    if (!zone.isActive) continue
    const ring = zone.polygon.map(p => [p[1], p[0]])  // [lat,lng] → [lng,lat]
    let zonePoly
    try {
      zonePoly = turf.polygon([ring])
    } catch {
      continue
    }
    const [minLng, minLat, maxLng, maxLat] = turf.bbox(zonePoly)
    const rMin = Math.max(0, latToRow(maxLat) - 1)
    const rMax = Math.min(ROWS - 1, latToRow(minLat) + 1)
    const cMin = Math.max(0, lngToCol(minLng) - 1)
    const cMax = Math.min(COLS - 1, lngToCol(maxLng) + 1)
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        const lat = rowToLat(r)
        const lng = colToLng(c)
        if (turf.booleanPointInPolygon(turf.point([lng, lat]), zonePoly)) {
          blocked.add(r * COLS + c)
        }
      }
    }
  }
  return blocked
}

// Binary min-heap for A*
class MinHeap {
  constructor() { this.data = [] }
  push(node) {
    this.data.push(node)
    this._bubbleUp(this.data.length - 1)
  }
  pop() {
    const top = this.data[0]
    const last = this.data.pop()
    if (this.data.length > 0) {
      this.data[0] = last
      this._sinkDown(0)
    }
    return top
  }
  get size() { return this.data.length }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.data[parent].f <= this.data[i].f) break
      ;[this.data[parent], this.data[i]] = [this.data[i], this.data[parent]]
      i = parent
    }
  }
  _sinkDown(i) {
    const n = this.data.length
    while (true) {
      let smallest = i
      const l = 2 * i + 1, r = 2 * i + 2
      if (l < n && this.data[l].f < this.data[smallest].f) smallest = l
      if (r < n && this.data[r].f < this.data[smallest].f) smallest = r
      if (smallest === i) break
      ;[this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]]
      i = smallest
    }
  }
}

const DIRS = [
  [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
  [-1, -1, 1.414], [-1, 1, 1.414], [1, -1, 1.414], [1, 1, 1.414],
]

function heuristic(r1, c1, r2, c2) {
  return Math.sqrt((r2 - r1) ** 2 + (c2 - c1) ** 2)
}

function astar(fromPos, toPos, blocked) {
  if (!waterGrid) return []

  const sr = latToRow(fromPos.lat), sc = lngToCol(fromPos.lng)
  const er = latToRow(toPos.lat),   ec = lngToCol(toPos.lng)

  if (sr < 0 || sr >= ROWS || sc < 0 || sc >= COLS) return []
  if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) return []

  const gScore = new Float32Array(ROWS * COLS).fill(Infinity)
  const parent = new Int32Array(ROWS * COLS).fill(-1)
  const startIdx = sr * COLS + sc
  const endIdx   = er * COLS + ec

  gScore[startIdx] = 0
  const heap = new MinHeap()
  heap.push({ r: sr, c: sc, f: heuristic(sr, sc, er, ec) })

  const visited = new Uint8Array(ROWS * COLS)

  while (heap.size > 0) {
    const { r, c } = heap.pop()
    const idx = r * COLS + c
    if (visited[idx]) continue
    visited[idx] = 1

    if (idx === endIdx) {
      // Reconstruct path
      const path = []
      let cur = endIdx
      while (cur !== -1) {
        const pr = Math.floor(cur / COLS)
        const pc = cur % COLS
        path.push({ lat: rowToLat(pr), lng: colToLng(pc) })
        cur = parent[cur]
      }
      path.reverse()
      return smoothPath(path)
    }

    for (const [dr, dc, cost] of DIRS) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      const nIdx = nr * COLS + nc
      if (!waterGrid[nIdx]) continue
      if (blocked && blocked.has(nIdx)) continue
      if (visited[nIdx]) continue

      const ng = gScore[idx] + cost
      if (ng < gScore[nIdx]) {
        gScore[nIdx] = ng
        parent[nIdx] = idx
        heap.push({ r: nr, c: nc, f: ng + heuristic(nr, nc, er, ec) })
      }
    }
  }
  return []  // no path found
}

function smoothPath(path) {
  if (path.length <= 2) return path
  const result = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1]
    const curr = path[i]
    const next = path[i + 1]
    const dLat1 = curr.lat - prev.lat, dLng1 = curr.lng - prev.lng
    const dLat2 = next.lat - curr.lat, dLng2 = next.lng - curr.lng
    const cross = Math.abs(dLat1 * dLng2 - dLat2 * dLng1)
    if (cross > 1e-6) result.push(curr)
  }
  result.push(path[path.length - 1])
  return result
}

export function initRouter() {
  buildWaterGrid()
}

export function computePathWithZones(fromPos, toPos, zones) {
  const blocked = zones && zones.length > 0 ? buildBlockedSet(zones) : null
  return astar(fromPos, toPos, blocked)
}

export async function computePath(fromPos, toPos) {
  const { default: Zone } = await import('../models/Zone.js')
  const zones = await Zone.find({ isActive: true })
  return computePathWithZones(fromPos, toPos, zones)
}
