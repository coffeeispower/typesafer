/* eslint-disable @effect/dprint */
import { describe, expect, it } from "bun:test"
import { Effect, HashSet, Option, pipe, Schema } from "effect"
import { accessPointer, getAllPathsRecursive, isImmediateParent, isParent, ObjectPath } from "./objectPaths"

describe("getAllPathsRecursive", () => {
  class GetAllPathsRecursiveTestCase extends Schema.Class<GetAllPathsRecursiveTestCase>("GetAllPathsRecursiveTestCase")(
    {
      expectedResult: Schema.HashSet(ObjectPath).pipe(
        Schema.withConstructorDefault(Effect.sync(HashSet.empty))
      ),
      guineaPig: Schema.Unknown
    }
  ) {
    get expectedResultDisplay() {
      return new Set(this.expectedResult)
    }
  }
  const testCases: ReadonlyArray<GetAllPathsRecursiveTestCase> = [
    new GetAllPathsRecursiveTestCase({
      guineaPig: { a: { b: { c: "Test", n: 29 } } },
      expectedResult: HashSet.make(["a"], ["a", "b"])
    }),

    new GetAllPathsRecursiveTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 }
          ]
        }
      },
      expectedResult: HashSet.make(["a"], ["a", "b", 0], ["a", "b", 1])
    }),
    new GetAllPathsRecursiveTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 }
          ]
        },
        hfegkjgf: {
          eurhewkf: {}
        }
      },
      expectedResult: HashSet.make(["a"], ["a", "b", 0], ["a", "b", 1], ["hfegkjgf"], ["hfegkjgf", "eurhewkf"])
    })
  ]

  it.each(testCases)(
    "getAllPathsRecursive($guineaPig) returns $expectedResultDisplay",
    ({ expectedResult, guineaPig }) => {
      expect(
        new Set(getAllPathsRecursive(guineaPig))
      ).toEqual(new Set(expectedResult))
    }
  )
})
describe("accessPointer", () => {
  const formatOption: (option: Option.Option<unknown>) => string = (opt) =>
    pipe(opt, Option.map((v) => `Some(${JSON.stringify(v, null, 2)})`), Option.getOrElse(() => "None"))
  class AccessPointerTestCase extends Schema.Class<AccessPointerTestCase>("AccessPointerTestCase")(
    {
      guineaPig: Schema.Unknown,
      pointer: ObjectPath,
      expected: Schema.Unknown.pipe(Schema.Option)
    }
  ) {
    get expectedResultDisplay() {
      return this.expected.pipe(formatOption)
    }
  }
  const testCases: ReadonlyArray<AccessPointerTestCase> = [
    new AccessPointerTestCase({
      guineaPig: { a: { b: { c: "Test", n: 29 } } },
      pointer: ["a", "b"],
      expected: Option.some({ c: "Test", n: 29 })
    }),

    new AccessPointerTestCase({
      guineaPig: { a: { b: { c: "Test", n: 29 } } },
      pointer: ["a", "no"],
      expected: Option.none()
    }),

    new AccessPointerTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 }
          ]
        }
      },
      pointer: ["a", "b", 0],
      expected: Option.some({ c: "Test", n: 29 })
    }),
    new AccessPointerTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 }
          ]
        }
      },
      pointer: ["a", "b", 1],
      expected: Option.some({ c: "Test 2", n: 10 })
    }),

    new AccessPointerTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 }
          ]
        }
      },
      pointer: ["a", "b", 2],
      expected: Option.none()
    }),

    new AccessPointerTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 }
          ]
        }
      },
      pointer: ["a", "b", 1, "n"],
      expected: Option.some(10)
    }),
    new AccessPointerTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 }
          ]
        },
        hfegkjgf: {
          eurhewkf: {}
        }
      },

      pointer: ["hfegkjgf", "eurhewkf"],
      expected: Option.some({})
    }),

    new AccessPointerTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 },
            null
          ]
        }
      },
      pointer: ["a", "b", 2],
      expected: Option.some(null)
    }),

    new AccessPointerTestCase({
      guineaPig: {
        a: {
          b: [
            { c: "Test", n: 29 },
            { c: "Test 2", n: 10 },
            undefined
          ]
        }
      },
      pointer: ["a", "b", 2],
      expected: Option.some(undefined)
    })
  ]

  it.each(testCases)(
    "accessPointer(/* object = */ $guineaPig, /* path = */ $pointer) returns $expectedResultDisplay",
    ({ expected, guineaPig, pointer }) => {
      const result = accessPointer(guineaPig, pointer)
      expect(result._tag, "full value: " + result.pipe(formatOption)).toBe(expected._tag)
      if (Option.isSome(result) && Option.isSome(expected)) {
        expect(result.value).toEqual(expected.value)
      }
    }
  )
})

describe("objectPaths.isParent", () => {
  class IsParentTestCase extends Schema.Class<IsParentTestCase>("IsParentTestCase")(
    {
      self: ObjectPath,
      that: ObjectPath,
      expected: Schema.Boolean
    }
  ) {

    get selfDisplay() {
      return new Set(this.self)
    }
    get thatDisplay() {
      return new Set(this.that)
    }
  }
  class YesParentTestCase extends IsParentTestCase {
    constructor(self: ObjectPath, that: ObjectPath) {
      super({ self, that, expected: true })
    }
  }
  class NoParentTestCase extends IsParentTestCase {
    constructor(self: ObjectPath, that: ObjectPath) {
      super({ self, that, expected: false })
    }
  }
  const testCases: ReadonlyArray<IsParentTestCase> = [
    new YesParentTestCase(["a", "b"],              ["a"]                ),
    new NoParentTestCase (["a", "b"],              ["a", "b"]           ),
    new NoParentTestCase (["c", "b"],              ["a", "b"]           ),
    new NoParentTestCase (["a"],                   ["a", "b"]           ),
    new NoParentTestCase ([],                      ["a", "b"]           ),
    new YesParentTestCase(["a", "b", "c"],         ["a"]                ),
    new YesParentTestCase(["a", "b", "c", "d"],    ["a", "b"]           ),
    new YesParentTestCase(["a", "b", 6, "d"],      ["a", "b"]           ),
    new YesParentTestCase(["a", "b", 6, "d"],      ["a", "b", 6]        ),
    new YesParentTestCase(["a", "b", 6, "d", "e"], ["a", "b", 6, "d"]   ),
    new YesParentTestCase(["a", "b", 6, "d", "e"], ["a", "b", 6]        ),
    new YesParentTestCase(["a", "b", "c", "d"],    ["a"]                )
  ]

  const immediateParentTestCases: ReadonlyArray<IsParentTestCase> = [
    new YesParentTestCase(["a", "b"],           ["a"]          ),
    new NoParentTestCase (["a", "b"],           ["a", "b"]     ),
    new YesParentTestCase(["a", "b", 6, "d"],   ["a", "b", 6]  ),
    new NoParentTestCase (["a"],                ["a", "b"]     ),
    new NoParentTestCase ([],                   ["a", "b"]     ),
    new NoParentTestCase (["a", "b", "c"],      ["a"]          ),
    new NoParentTestCase (["a", "b", "c", "d"], ["a", "b"]     ),
    new YesParentTestCase(["a", "b", "c", "d"], ["a", "b", "c"]),
    new NoParentTestCase (["a", "b", "c", "d"], ["a"]          )
  ]


  it.each(testCases)(
    "isParent(/* self = */ $self, /* that = */ $that) -> $expected",
    ({ expected, self, that }) => {
      const result = isParent(self, that)
      expect(result).toBe(expected)
    }
  )
  it.each(immediateParentTestCases)(
    "isImmediateParent(/* self = */ $self, /* that = */ $that) -> $expected",
    ({ expected, self, that }) => {
      const result = isImmediateParent(self, that)
      expect(result).toBe(expected)
    }
  )
})
