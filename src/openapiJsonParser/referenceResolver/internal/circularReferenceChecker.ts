import {
  Equal,
  HashMap,
  HashSet,
  MutableHashSet,
  Option,
  pipe,
  Schema,
} from "effect"
import * as objectPaths from "./objectPaths"
import { ObjectPathCyclicSequence } from "./cyclicReference"
export {ObjectPathCyclicSequence}
export class DirectCircularReference extends Schema.TaggedClass<DirectCircularReference>()(
  "DirectCircularReference",
  {
    culpritRefKey: objectPaths.ObjectPath,
    pointedParent: objectPaths.ObjectPath
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


export function getForCircularReferences(
  object: unknown,
  allPaths = objectPaths.getAllPathsRecursive(object),
  pathsWithRef = objectPaths.filterPathsWithRef(object, allPaths)
): HashSet.HashSet<CircularReference> {
  const cycles = MutableHashSet.empty<CircularReference>();
  const alreadyScannedPaths: objectPaths.MutablePaths = MutableHashSet.empty()
  const pathsToRef = HashMap.fromIterable(
    HashSet.map(pathsWithRef, (refPath) => {
      const ref = pipe(objectPaths.extract$ref(object, refPath), (ref) => objectPaths.refToObjectPath(object, ref))
      return [refPath, ref] as const
    })
  )
  for (const refPath of pathsWithRef) {
    const ref = HashMap.getUnsafe(pathsToRef, refPath)
    if (objectPaths.isParent(refPath, ref) || Equal.equals(refPath, ref)) {
      MutableHashSet.add(cycles, DirectCircularReference.make({
        culpritRefKey: refPath,
        pointedParent: ref
      }))
      MutableHashSet.add(alreadyScannedPaths, refPath)
    }
  }
  const pathsWithRefWithoutDirectCircularReferences = pathsWithRef.pipe(HashSet.difference(HashSet.fromIterable(alreadyScannedPaths)))
  /**
   * Finds IndirectCircularReferences recursively by traversing the object and following the references until it reaches a dead end
   * or if it goes full round to the originalPath, it adds the historyOfPaths as a IndirectCircularReference to the `cycles` hash set.
   *
   * @param originalPath the original path that the for loop below called this function with
   * @param refPath Current subtree path
   */
  function findCircularReferences(originalPath: objectPaths.ObjectPath, refPath: objectPaths.ObjectPath = originalPath, historyOfPaths: ReadonlyArray<objectPaths.ObjectPath> = []) {
    const refOpt = HashMap.get(pathsToRef, refPath);
    if (Option.isNone(refOpt)) return;
    const { value: ref } = refOpt;
    if ((objectPaths.isParent(refPath, originalPath) || Equal.equals(refPath, originalPath)) && historyOfPaths.length != 0) {
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
