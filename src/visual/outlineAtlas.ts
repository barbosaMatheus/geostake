import isoTopoJson from '@rembish/iso-topojson/iso-a2.json'
import {
  geometryToOutline,
  type OutlineGeometry,
  type TopoGeometry,
  type Topology,
} from './topojson'

/**
 * Bundled country-outline atlas.
 *
 * The country geometry data comes from @rembish/iso-topojson, imported as a
 * static JSON module so it is part of the application bundle and available
 * fully offline. Only the current mystery country's geometry is decoded, on
 * demand, and cached. Lookups are keyed on uppercase ISO 3166-1 alpha-2
 * codes; unresolved codes resolve to `null` so the game can mark the clue
 * unavailable instead of crashing.
 */

interface MergedTopoGeometry extends TopoGeometry {
  properties: { iso_a2: string }
}

interface IsoTopoJson {
  type: string
  arcs: Topology['arcs']
  transform?: Topology['transform']
  objects: {
    merged: {
      type: 'GeometryCollection'
      geometries: MergedTopoGeometry[]
    }
  }
}

const parsed = isoTopoJson as unknown as IsoTopoJson
const topology: Topology = {
  arcs: parsed.arcs,
  transform: parsed.transform,
}

let geometryIndex: Map<string, TopoGeometry | undefined> | null = null

function getGeometryIndex(): Map<string, TopoGeometry | undefined> {
  if (geometryIndex === null) {
    const index = new Map<string, TopoGeometry | undefined>()
    for (const geometry of parsed.objects.merged.geometries) {
      index.set(
        geometry.properties.iso_a2.toUpperCase(),
        geometry as TopoGeometry,
      )
    }
    geometryIndex = index
  }
  return geometryIndex
}

const outlineCache = new Map<string, OutlineGeometry | null>()

/**
 * Resolves the outline geometry for an ISO code, or `null` when the code is
 * missing or does not exist in the bundled atlas.
 */
export function getOutlineGeometry(iso: string | null): OutlineGeometry | null {
  if (iso === null) {
    return null
  }
  const cached = outlineCache.get(iso)
  if (cached !== undefined) {
    return cached
  }
  const geometry = getGeometryIndex().get(iso)
  const outline = geometryToOutline(topology, iso, geometry)
  outlineCache.set(iso, outline)
  return outline
}
