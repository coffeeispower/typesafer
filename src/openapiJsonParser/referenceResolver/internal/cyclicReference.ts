import { Equal, Hash, Schema } from "effect"
import { ObjectPath } from "./objectPaths"

export const makeCyclicSequence = <S extends Schema.Constraint>(s: S) => class CyclicSequence extends Schema.TaggedClass<CyclicSequence>()("CyclicSequence", {
  elements: Schema.Array(s)
}) implements Equal.Equal {

  [Equal.symbol](that: Equal.Equal): boolean {
    if (!((that as any)._tag == this._tag)) return false

    const a = this.elements
    const b = (that as typeof this).elements

    if (a.length !== b.length) return false
    if (a.length === 0) return true

    // Find an occurrence of the first element in the other sequence.
    for (let start = 0; start < b.length; start++) {
      if (!Equal.equals(a[0], b[start])) continue

      let matches = true

      for (let i = 1; i < a.length; i++) {
        if (!Equal.equals(a[i], b[(start + i) % b.length])) {
          matches = false
          break
        }
      }

      if (matches) return true
    }

    return false
  }
  [Hash.symbol](): number {
    let result = Hash.hash(this.elements.length)

    for (const element of this.elements) {
      result = (result + Hash.hash(element)) | 0
    }

    return result
  }
  static from(...a: readonly S["Type"][]): CyclicSequence {
    return new this({elements: a})
  }
}


export class ObjectPathCyclicSequence extends makeCyclicSequence(ObjectPath) {};
