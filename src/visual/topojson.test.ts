import { describe, expect, it } from 'vitest'
import { geometryToOutline, type TopoGeometry, type Topology } from './topojson'

// Identity transform: scale 1, translate 0 (highly simplified for tests).
const identityTopology: Topology = {
  transform: { scale: [1, 1], translate: [0, 0] },
  arcs: [
    // Arc 1: 4-unit square from (0,0) to (10,0) to (10,10) to (0,10) to (0,0).
    [
      [0, 0],
      [10, 0],
      [0, 10],
      [-10, 0],
      [0, -10],
    ],
    // Arc 2: continues from (10,10) to (0,10) to (0,0).
    [
      [10, 10],
      [-10, 0],
      [0, -10],
    ],
  ],
}

function topoGeometry(
  type: TopoGeometry['type'],
  arcs: TopoGeometry['arcs'],
): TopoGeometry {
  return { type, arcs }
}

describe('geometryToOutline', () => {
  it('decodes a single-ring polygon into an SVG path', () => {
    const outline = geometryToOutline(
      identityTopology,
      'TEST',
      topoGeometry('Polygon', [[1]]),
    )

    expect(outline?.path).toBe('M0,0L10,0L10,10L0,10L0,0Z')
    expect(outline?.viewBox).toBe('0 0 10 10')
    expect(outline?.bounds).toEqual({
      minX: 0,
      minY: 0,
      maxX: 10,
      maxY: 10,
    })
  })

  it('stitches multiple arcs into one closed ring', () => {
    const stitchingTopology: Topology = {
      transform: { scale: [1, 1], translate: [0, 0] },
      arcs: [
        [
          [0, 0],
          [10, 0],
          [0, 10],
        ],
        [
          [10, 10],
          [-10, 0],
          [0, -10],
        ],
      ],
    }
    const outline = geometryToOutline(
      stitchingTopology,
      'TEST',
      topoGeometry('Polygon', [[1, 2]]),
    )

    expect(outline?.path).toBe('M0,0L10,0L10,10L0,10L0,0Z')
  })

  it('walks reverse references backward', () => {
    const outline = geometryToOutline(
      identityTopology,
      'TEST',
      topoGeometry('Polygon', [[-1]]),
    )

    expect(outline?.path).toBe('M0,0L0,10L10,10L10,0L0,0Z')
  })

  it('emits one subpath per polygon in a MultiPolygon', () => {
    const outline = geometryToOutline(
      identityTopology,
      'TEST',
      topoGeometry('MultiPolygon', [[[1], [2]]]),
    )

    const subpaths = outline?.path.match(/M/g) ?? []
    expect(subpaths).toHaveLength(2)
    expect(outline?.path).toContain('Z')
  })

  it('applies the transform scale and translate to every coordinate', () => {
    const topology: Topology = {
      transform: { scale: [0.5, 2], translate: [1, 3] },
      arcs: identityTopology.arcs,
    }
    const outline = geometryToOutline(
      topology,
      'TEST',
      topoGeometry('Polygon', [[1]]),
    )

    expect(outline?.path).toBe('M1,3L6,3L6,23L1,23L1,3Z')
    expect(outline?.viewBox).toBe('1 3 5 20')
  })

  it('returns null for a missing geometry', () => {
    expect(geometryToOutline(identityTopology, 'NOPE', undefined)).toBeNull()
  })

  it('returns null when a geometry has no usable rings', () => {
    const outline = geometryToOutline(
      identityTopology,
      'TEST',
      topoGeometry('Polygon', []),
    )

    expect(outline).toBeNull()
  })
})
