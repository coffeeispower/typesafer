import type { HashSet } from "effect"

export function formatHashSetWithTag<O extends { _tag: string }>(h: HashSet.HashSet<O>): string {
  return "HashSet {" + Array.from(h).map((i) =>
    i._tag + " " + JSON.stringify(
      { ...i, _tag: undefined },
      null,
      2
    )
  ).join(", \n") + "}"
}
export function formatHashSet<O>(h: HashSet.HashSet<O>): string {
  return "HashSet {" + Array.from(h).map((i) => JSON.stringify(i, null, 2)).join(", \n") +
    "}"
}
