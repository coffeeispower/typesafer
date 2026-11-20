import {
  Array,
  Duration,
  Equal,
  HashMap,
  HashSet,
  Option,
  Ordering,
  Predicate,
  Schema,
  SchemaAST
} from "effect"
import { JsonPointer } from "effect"
import { Reference } from "../../withReferences"
import * as AdjacencyList from "./adjacencyList"
import * as unfoldObject from "./unfoldObject"
import { ObjectPathCyclicSequence } from "./cyclicReference"

export class DirectCircularReference extends Schema.TaggedClass<DirectCircularReference>()(
  "DirectCircularReference",
  {
    culpritRefKey: unfoldObject.ObjectPath,
    pointedParent: unfoldObject.ObjectPath
  }
) {}

export class IndirectCircularReference extends Schema.TaggedClass<IndirectCircularReference>()(
  "IndirectCircularReference",
  {
    keysRing: ObjectPathCyclicSequence
  }
) {}

export const CircularReference = Schema.Union([
  DirectCircularReference,
  IndirectCircularReference
])

export type CircularReference = typeof CircularReference.Type

type ObjectPath = unfoldObject.ObjectPath

type Graph = HashMap.HashMap<
  ObjectPath,
  HashSet.HashSet<ObjectPath>
>


/**
 * Uses a DFS (Depth-First-Search) like algorithm to find circular references inside a object with Reference objects.
 * This function assumes all references are valid and point to existing keys so make sure to check all of those before
 * calling this function otherwise it will throw.
 * This function scans recursively all objects, all arrays, all tables for Reference objects (objects containing a `$ref` key).
 *
 * @param object An object to recursively look for circular references
 * @returns All detected circular references
 */
export function checkForCircularReferences(
  object: unknown
): HashSet.HashSet<CircularReference> {
  let time: null | number = null;
  function recordTime(name?: string) {
    const oldTime = time;
    time = performance.now();
    if (oldTime != null) {
      console.log(name + " took: " + Duration.format(Duration.fromInputUnsafe(time - oldTime)))
    }
  }
  return HashSet.empty()
}
