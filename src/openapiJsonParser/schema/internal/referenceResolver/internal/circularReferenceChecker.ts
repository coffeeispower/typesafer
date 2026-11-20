import {
  Array,
  Duration,
  Equal,
  HashMap,
  HashSet,
  MutableHashSet,
  Option,
  Ordering,
  pipe,
  Predicate,
  Schema,
  SchemaAST
} from "effect"
import { JsonPointer } from "effect"
import { Reference } from "../../withReferences"
import * as AdjacencyList from "./adjacencyList"
import * as unfoldObject from "./unfoldObject"
import { ObjectPathCyclicSequence } from "./cyclicReference"
import { unfold } from "effect/Iterable"

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


/**
 * Finds circular references inside a object with Reference objects.
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
  const cycles = MutableHashSet.empty<CircularReference>();

  recordTime()
  const allPaths = unfoldObject.getAllPathsRecursive(object);
  const alreadyScannedPaths: unfoldObject.MutablePaths = MutableHashSet.empty()
  recordTime("getAllPathsRecursive")
  const pathsWithRef = unfoldObject.filterPathsWithRef(object, allPaths);
  const pathsToRef = HashMap.fromIterable(
    HashSet.map(pathsWithRef, (refPath) => {
      const ref = pipe(unfoldObject.extract$ref(object, refPath), (ref) => unfoldObject.refToObjectPath(object, ref))
      return [refPath, ref] as const
    })
  )
  recordTime("filterPathsWithRef")
  for (const refPath of pathsWithRef) {
    const ref = HashMap.getUnsafe(pathsToRef, refPath)
    if (unfoldObject.isParent(refPath, ref) || Equal.equals(refPath, ref)) {
      MutableHashSet.add(cycles, DirectCircularReference.make({
        culpritRefKey: refPath,
        pointedParent: ref
      }))
      MutableHashSet.add(alreadyScannedPaths, refPath)
    }
  }
  recordTime("get DirectCircularReferences")
  const pathsWithRefWithoutDirectCircularReferences = pathsWithRef.pipe(HashSet.difference(HashSet.fromIterable(alreadyScannedPaths)))
  recordTime("get pathsWithRefWithoutDirectCircularReferences")
  /**
   * Finds IndirectCircularReferences recursively by traversing the object and following the references until it reaches a dead end
   * or if it goes full round to the originalPath, it adds the historyOfPaths as a IndirectCircularReference to the `cycles` hash set.
   *
   * @param originalPath the original path that the for loop below called this function with
   * @param refPath Current subtree path
   */
  function findCircularReferences(originalPath: unfoldObject.ObjectPath, refPath: unfoldObject.ObjectPath = originalPath, historyOfPaths: ReadonlyArray<unfoldObject.ObjectPath> = []) {
    const refOpt = HashMap.get(pathsToRef, refPath);
    if (Option.isNone(refOpt)) return;
    const { value: ref } = refOpt;
    if ((unfoldObject.isParent(refPath, originalPath) || Equal.equals(refPath, originalPath)) && historyOfPaths.length != 0) {
      MutableHashSet.add(cycles, new IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(...historyOfPaths)
      }))
    } else {
      historyOfPaths = [...historyOfPaths, refPath];
      findCircularReferences(originalPath, ref, historyOfPaths)
    }
  }

  for (const refPath of pathsWithRefWithoutDirectCircularReferences) {
    findCircularReferences(refPath)
  }
  return cycles.pipe(HashSet.fromIterable)
}
