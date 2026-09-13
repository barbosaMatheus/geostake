/**
 * Minimal TopoJSON decoding for country outline geometry.
 *
 * This module contains the only TopoJSON-specific logic in the application so
 * the underlying dataset can be swapped later without touching game code. It
 * is pure: given a topology and one geometry reference it produces an SVG
 * path string plus the geometry's bounds, ready for the outline component.
 *
 * TopoJSON encodes coordinates as delta-coded integers relative to a
 * quantized grid defined by the topology's `transform`; arcs are stitched
 * back into closed rings by following each ring's signed, 1-based arc
 * references (negative = traverse the arc in reverse). Every ring closes onto
 * its first point, so rings can be emitted as a single `M … Z` path.
 */

export interface TopoPoint {
  x: number
  y: number
}

export interface TopoTransform {
  scale: [number, number]
  translate: [number, number]
}

export interface Topology {
  arcs: readonly (readonly (readonly [number, number] | number[])[])[]
  transform?: TopoTransform
}

export type PolygonArcs = readonly (readonly number[])[]
export type MultiPolygonArcs = readonly PolygonArcs[]

export interface TopoGeometry {
  type: 'Polygon' | 'MultiPolygon'
  arcs: PolygonArcs | MultiPolygonArcs
}

export interface OutlineGeometry {
  iso: string
  type: 'Polygon' | 'MultiPolygon'
  /** SVG path data (one closed subpath per polygon ring). */
  path: string
  /** SVG viewBox value: `minX minY width height`. */
  viewBox: string
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

type Ring = readonly TopoPoint[]

const COORDINATE_PRECISION = 1000

function roundCoordinate(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION
}

function decodeArc(topology: Topology, arcIndex: number): TopoPoint[] {
  const raw = topology.arcs[arcIndex]
  const scale = topology.transform?.scale ?? [1, 1]
  const translate = topology.transform?.translate ?? [0, 0]
  const points: TopoPoint[] = []
  let x = 0
  let y = 0
  for (const [dx, dy] of raw) {
    x += dx
    y += dy
    points.push({
      x: x * scale[0] + translate[0],
      y: y * scale[1] + translate[1],
    })
  }
  return points
}

function stitchRing(topology: Topology, loop: readonly number[]): Ring {
  const points: TopoPoint[] = []
  for (let i = 0; i < loop.length; i++) {
    const signedArcIndex = loop[i]
    const arcIndex = Math.abs(signedArcIndex) - 1
    const arcPoints = decodeArc(topology, arcIndex)
    if (signedArcIndex < 0) {
      arcPoints.reverse()
    }
    if (i === 0) {
      points.push(...arcPoints)
    } else {
      // Consecutive arcs share an endpoint; skip it to avoid duplicate points.
      points.push(...arcPoints.slice(1))
    }
  }
  return points
}

function ringsOf(topology: Topology, geometry: TopoGeometry): Ring[] {
  const rings: Ring[] = []
  if (geometry.type === 'Polygon') {
    for (const loop of geometry.arcs as PolygonArcs) {
      rings.push(stitchRing(topology, loop))
    }
  } else {
    for (const polygon of geometry.arcs as MultiPolygonArcs) {
      for (const loop of polygon) {
        rings.push(stitchRing(topology, loop))
      }
    }
  }
  return rings
}

function pathFromRing(ring: Ring): string {
  const commands = ring.map(
    (point) => `${roundCoordinate(point.x)},${roundCoordinate(point.y)}`,
  )
  return `M${commands.join('L')}Z`
}

function boundsFromRings(rings: readonly Ring[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const ring of rings) {
    for (const point of ring) {
      if (point.x < minX) minX = point.x
      if (point.x > maxX) maxX = point.x
      if (point.y < minY) minY = point.y
      if (point.y > maxY) maxY = point.y
    }
  }
  return { minX, minY, maxX, maxY }
}

function viewBoxFromBounds(bounds: {
  minX: number
  minY: number
  maxX: number
  maxY: number
}): string {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  return `${roundCoordinate(bounds.minX)} ${roundCoordinate(bounds.minY)} ${roundCoordinate(width)} ${roundCoordinate(height)}`
}

/**
 * Decodes one topology geometry into an SVG path and bounds.
 *
 * Returns `null` when the geometry has no usable rings.
 */
export function geometryToOutline(
  topology: Topology,
  iso: string,
  geometry: TopoGeometry | undefined,
): OutlineGeometry | null {
  if (geometry === undefined) {
    return null
  }
  const rings = ringsOf(topology, geometry).filter((ring) => ring.length >= 3)
  if (rings.length === 0) {
    return null
  }
  const bounds = boundsFromRings(rings)
  return {
    iso,
    type: geometry.type,
    path: rings.map(pathFromRing).join(''),
    viewBox: viewBoxFromBounds(bounds),
    bounds,
  }
}
