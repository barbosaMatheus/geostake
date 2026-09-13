export function randomIndex(
  length: number,
  random: () => number = Math.random,
): number {
  if (length <= 0) {
    throw new Error('Cannot pick a random index from an empty collection')
  }
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)))
}

export function pickRandom<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T {
  if (items.length === 0) {
    throw new Error('Cannot pick a random item from an empty collection')
  }
  return items[randomIndex(items.length, random)]
}
