import { HashSet, Option, Schema, Array, pipe, Predicate, Equal, Duration } from "effect"
import * as unfoldObject from "./unfoldObject"

export const AdjacencyListItem = Schema.Tuple([unfoldObject.ObjectPath, unfoldObject.ObjectPath])
export const AdjacencyList = Schema.HashSet(AdjacencyListItem)
export type AdjacencyListItem = typeof AdjacencyListItem.Type
export type AdjacencyList = typeof AdjacencyList.Type

export function pointerToAdjancencyList(pointer: unfoldObject.ObjectPath): AdjacencyList {
  return pipe(
    Array.Array(pointer.length).fill(undefined),
    Array.map((_, index) => Array.take(pointer, index + 1)),
    Array.window(2),
    HashSet.fromIterable
  )
}
export function objectAsAdjacencyList(object: unknown): { union: AdjacencyList, refConnections: AdjacencyList, directChildren: AdjacencyList } {

  let time: null | number = null;
  function recordTime(name?: string) {
    const oldTime = time;
    time = performance.now();
    if (oldTime != null) {
      console.log(name + " took: " + Duration.format(Duration.fromInputUnsafe(time - oldTime)))
    }
  }
  recordTime()
  const paths = unfoldObject.getAllPathsRecursive(object)
  recordTime("getAllPathsRecursive")
  const filteredPaths = unfoldObject.filterPathsWithRef(object, paths);
  recordTime("filterPathsWithRef")
  const toAdjacencyList: (self: typeof paths) => AdjacencyList = HashSet.reduce(
      HashSet.empty(),
      (acc, pointer) =>
        HashSet.union(acc, pointerToAdjancencyList(pointer))
    );
  const directChildrenAdjacencyList = toAdjacencyList(paths);
  recordTime("directChildrenAdjacencyList")
  const refConnections: AdjacencyList = filteredPaths.pipe(HashSet.map((i) => [i, unfoldObject.refToObjectPath(object, unfoldObject.extract$ref(object, i))]));
  recordTime("refConnections")
  const union = HashSet.union(refConnections, directChildrenAdjacencyList);
  recordTime("union")
  return {union, directChildren: directChildrenAdjacencyList, refConnections }
}
