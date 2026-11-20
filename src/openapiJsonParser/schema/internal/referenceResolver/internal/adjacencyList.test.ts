import { Equal, HashSet, Schema } from "effect";
import { ObjectPath } from "./unfoldObject";
import { AdjacencyList, AdjacencyListItem, objectAsAdjacencyList, pointerToAdjancencyList } from "./adjacencyList";
import { formatHashSet } from "./formatHashSet";
import { it, describe, expect } from "bun:test"

describe("AdjacencyList.pointerToAdjancencyList", () => {

  class PointerToAdjancencyListTestCase extends Schema.Class<PointerToAdjancencyListTestCase>("PointerToAdjancencyListTestCase")({ pointer: ObjectPath, expected: AdjacencyList }) {
    get expectedResultDisplay() {
      return formatHashSet(this.expected)
    }
  }
  const testCases: ReadonlyArray<PointerToAdjancencyListTestCase> = [
    PointerToAdjancencyListTestCase.make({
      pointer: ["a", "b", "c"],
      expected: HashSet.fromIterable([
        [["a"], ["a", "b"]],
        [["a", "b"], ["a", "b", "c"]]
      ])
    })
  ]

  it.each(testCases)("AdjacencyList.pointerToAdjancencyList($pointer) -> $expectedResultDisplay", ({expected, pointer}) => {
    expect(pointerToAdjancencyList(pointer)).toEqual(expected)
  })
})

describe("AdjacencyList.objectAsAdjacencyList", () => {

  class ObjectAsAdjacencyListTestCase extends Schema.Class<ObjectAsAdjacencyListTestCase>("ObjectAsAdjacencyListTestCase")({ obj: Schema.Unknown, expected: AdjacencyList }) {
    get expectedResultDisplay() {
      return formatHashSet(this.expected)
    }
  }
  const testCases: ReadonlyArray<ObjectAsAdjacencyListTestCase> = [
    ObjectAsAdjacencyListTestCase.make({
      obj: {
        a: { b: { c: 10 } },
        b: { $ref: "#/a/b"  },
      },
      expected: HashSet.fromIterable([
        [["a"], ["a", "b"]],
        [["b"], ["a", "b"]]
      ])
    }),

    ObjectAsAdjacencyListTestCase.make({
      obj: {
        a: { b: { c: 10 } },
        b: { $ref: "#/b"  },
      },
      expected: HashSet.fromIterable([
        [["a"], ["a", "b"]],
        [["b"], ["b"]]
      ])
    }),

    ObjectAsAdjacencyListTestCase.make({
      obj: {
        a: { b: { c: 10 } },
        h: { $ref: "#/b"  },
        b: { $ref: "#/h"  },
      },
      expected: HashSet.fromIterable([
        [["a"], ["a", "b"]],
        [["b"], ["h"]],
        [["h"], ["b"]]
      ])
    }),

    ObjectAsAdjacencyListTestCase.make({
      obj: {
        a: { b: { c: 10 } },
        h: { $ref: "#/i"  },
        i: { $ref: "#/b"  },
        b: { $ref: "#/h"  },
      },
      expected: HashSet.fromIterable([
        [["a"], ["a", "b"]],
        [["b"], ["h"]],
        [["h"], ["i"]],
        [["i"], ["b"]],
      ])
    })
  ]

  it.each(testCases)("AdjacencyList.objectAsAdjacencyList($pointer) -> $expectedResultDisplay", ({expected, obj}) => {
    expect(objectAsAdjacencyList(obj).union).toSatisfy(Equal.equals(expected))
  })
})
