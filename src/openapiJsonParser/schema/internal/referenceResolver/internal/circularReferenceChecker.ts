import { HashSet } from "effect"
import { Schema } from "effect"

export class DirectCircularReference extends Schema.TaggedClass<DirectCircularReference>()(
  "DirectCircularReference",
  {
    culpritRefKey: Schema.Array(Schema.String),
    pointedParent: Schema.Array(Schema.String)
  }
) {}

export class IndirectCircularReference extends Schema.TaggedClass<IndirectCircularReference>()(
  "IndirectCircularReference",
  {
    keysRing: Schema.Array(Schema.Array(Schema.String))
  }
) {}

export const CircularReference = Schema.Union(
  [DirectCircularReference, IndirectCircularReference]
)

export type CircularReference = typeof CircularReference.Type
export function checkForCircularReferences(rawDocument: unknown): HashSet.HashSet<CircularReference> {
  return HashSet.empty()
}
