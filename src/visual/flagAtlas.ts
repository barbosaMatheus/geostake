import * as flagComponents from 'country-flag-icons/react/3x2'
import type { ComponentType, SVGProps } from 'react'

/**
 * Bundled country-flag atlas.
 *
 * country-flag-icons ships one React component per ISO 3166-1 alpha-2 code as
 * named exports. They are imported as a namespace here so a flag can be looked
 * up by a runtime-known ISO code, and the whole module is bundled with the
 * application so flags render offline.
 *
 * Lookups are keyed on uppercase ISO 3166-1 alpha-2 codes; unresolved codes
 * resolve to `null` so the game can mark the flag clue unavailable instead of
 * crashing.
 */

export type FlagIcon = ComponentType<SVGProps<SVGSVGElement>>

const flagComponentMap = flagComponents as unknown as Record<
  string,
  FlagIcon | undefined
>

/**
 * Resolves the React flag component for an ISO code, or `null` when the code
 * is missing or has no flag in the bundle.
 */
export function getFlagComponent(iso: string | null): FlagIcon | null {
  if (iso === null) {
    return null
  }
  return flagComponentMap[iso] ?? null
}
