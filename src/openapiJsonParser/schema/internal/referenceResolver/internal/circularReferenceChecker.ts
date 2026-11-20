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
 * Builds a graph from the adjacency list.
 */
function buildGraph(edges: AdjacencyList.AdjacencyList): Graph {
  return HashSet.reduce(
    edges,
    HashMap.empty<ObjectPath, HashSet.HashSet<ObjectPath>>(),
    (graph, [from, to]) => {
      const neighbors = Option.getOrElse(
        HashMap.get(graph, from),
        HashSet.empty<ObjectPath>
      )

      return HashMap.set(
        graph,
        from,
        HashSet.add(neighbors, to)
      )
    }
  )
}

/**
 * Determines whether a reference is direct.
 *
 * A reference is direct when its target is itself or an ancestor
 * of the reference source.
 */
function isDirectReference(
  source: ObjectPath,
  target: ObjectPath
): boolean {
  return Equal.equals(source, target) ||
    unfoldObject.isParent(source, target)
}
function findCycles(
  graph: Graph
): HashSet.HashSet<ObjectPathCyclicSequence> {
  let cycles = HashSet.empty<ObjectPathCyclicSequence>()

  const dfs = (
    start: ObjectPath,
    current: ObjectPath,
    visited: HashSet.HashSet<ObjectPath>,
    path: ReadonlyArray<ObjectPath>
  ): void => {
    const neighbors = Option.getOrElse(
      HashMap.get(graph, current),
      () => HashSet.empty<ObjectPath>()
    )

    for (const next of neighbors) {
      if (Equal.equals(next, start)) {
        cycles = HashSet.add(
          cycles,
          new ObjectPathCyclicSequence({elements: path})
        )
        continue
      }

      if (HashSet.has(visited, next)) continue

      dfs(
        start,
        next,
        HashSet.add(visited, next),
        [...path, next]
      )
    }
  }

  for (const start of HashMap.keys(graph)) {
    dfs(
      start,
      start,
      HashSet.make(start),
      [start]
    )
  }

  return cycles
}
/**
 * Returns whether a cycle contains a direct reference edge.
 */
function containsDirectReference(
  cycle: ObjectPathCyclicSequence,
  directReferenceEdges: HashSet.HashSet<AdjacencyList.AdjacencyListItem>
): boolean {
  return cycle.elements.some((source, index, cycle) => {
    const target = cycle[(index + 1) % cycle.length]

    return HashSet.has(directReferenceEdges, [source, target])
  })
}


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
  recordTime()
  const { refConnections, union } = AdjacencyList.objectAsAdjacencyList(object)
  recordTime("AdjacencyList.objectAsAdjacencyList")

  const directReferenceEdges = HashSet.filter(
    refConnections,
    ([source, target]) => isDirectReference(source, target)
  )
  recordTime("directReferenceEdges")

  const graph = buildGraph(union)
  recordTime("graph(size="+HashMap.size(graph)+")")
  const cycles = findCycles(graph)
  recordTime("cycles")

  const directCircularReferences = directReferenceEdges.pipe(HashSet.map(([source, target]) =>  new DirectCircularReference({
    culpritRefKey: source,
    pointedParent: target
  })))
  recordTime("directCircularReferences")
  const indirectCircularReferences = cycles.pipe(
    HashSet.filter((cycle) => !containsDirectReference(cycle, directReferenceEdges)),
    HashSet.map((cycle) => new IndirectCircularReference({
      keysRing: cycle
    }))
  )
  recordTime("indirectCircularReferences")

  return HashSet.union(directCircularReferences, indirectCircularReferences)
}
