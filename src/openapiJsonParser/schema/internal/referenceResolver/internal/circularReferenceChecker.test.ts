import { describe, expect, it } from "bun:test"
import { Effect, Equal, HashSet, Schema } from "effect"
import * as resolver from "./circularReferenceChecker"
import { formatHashSetWithTag } from "./formatHashSet"
import { ObjectPathCyclicSequence } from "./cyclicReference"

export class ResolverTestCase extends Schema.Class<ResolverTestCase>("ResolverTestCase")(
  {
    expectedResult: Schema.HashSet(resolver.CircularReference).pipe(
      Schema.withConstructorDefault(Effect.sync(HashSet.empty))
    ),
    guineaPig: Schema.Unknown
  }
) {
  get expectedResultDisplay() {
    return formatHashSetWithTag(this.expectedResult)
  }
}
const resolverTestCases = [
  new ResolverTestCase({
    guineaPig: { a: 50, b: 10 }
  }),
  new ResolverTestCase({
    guineaPig: {
      a: { $ref: "#/b" },
      b: { num: 10 }
    }
  }),
  new ResolverTestCase({
    guineaPig: {
      a: { $ref: "#/b" },
      b: { $ref: "#/c" },
      c: { num: 340 }
    }
  }),
  new ResolverTestCase({
    guineaPig: {
      a: { $ref: "#/b" },
      b: { $ref: "#/c/b" },
      c: {
        b: { num: 340 }
      }
    }
  }),
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(["a"], ["b"], ["c", "b"])
      })
    ),
    guineaPig: {
      a: { $ref: "#/b" },
      b: { $ref: "#/c/b" },
      c: {
        b: { $ref: "#/a" }
      }
    }
  }),
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.DirectCircularReference({
        culpritRefKey: ["a", "b"],
        pointedParent: ["a"]
      })
    ),
    guineaPig: {
      a: {
        b: { $ref: "#/a" }
      }
    }
  }),
  // Deeply nested circular reference
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.DirectCircularReference({
        culpritRefKey: ["a", "b", "c", "d"],
        pointedParent: ["a"]
      })
    ),
    guineaPig: {
      a: {
        b: {
          c: {
            d: { $ref: "#/a" }
          }
        }
      }
    }
  }),

  // Deeply nested indirect circular reference
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(["a", "b"], ["c", "d"], ["e", "f", "g"])
      })
    ),
    guineaPig: {
      a: {
        b: { $ref: "#/c/d" }
      },
      c: {
        d: { $ref: "#/e/f/g" }
      },
      e: {
        f: {
          g: { $ref: "#/a/b" }
        }
      }
    }
  }),

  // Jumping across unrelated branches
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(["a", "x"], ["b", "y"], ["c", "z"])
      })
    ),
    guineaPig: {
      a: {
        x: { $ref: "#/b/y" }
      },
      b: {
        y: { $ref: "#/c/z" }
      },
      c: {
        z: { $ref: "#/a/x" }
      }
    }
  }),

  // Two independent circular references
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(["a"], ["b"])
      }),
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(["c"], ["d"])
      })
    ),
    guineaPig: {
      a: { $ref: "#/b" },
      b: { $ref: "#/a" },
      c: { $ref: "#/d" },
      d: { $ref: "#/c" }
    }
  }),

  // Multiple references to the same target, without a cycle
  new ResolverTestCase({
    guineaPig: {
      a: { $ref: "#/target" },
      b: { $ref: "#/target" },
      c: {
        d: { $ref: "#/target" }
      },
      target: {
        value: 42
      }
    }
  }),

  // Self-reference at the root level
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.DirectCircularReference({
        culpritRefKey: ["a"],
        pointedParent: []
      })
    ),
    guineaPig: {
      a: { $ref: "#/" }
    }
  }),

  // Self-reference inside a nested object
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.DirectCircularReference({
        culpritRefKey: ["a", "b", "c"],
        pointedParent: ["a", "b"]
      })
    ),
    guineaPig: {
      a: {
        b: {
          c: { $ref: "#/a/b" }
        }
      }
    }
  }),

  // Cycle involving an array index
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(["a", 0], ["b", 1])
      })
    ),
    guineaPig: {
      a: [{ $ref: "#/b/1" }],
      b: [
        null,
        { $ref: "#/a/0" }
      ]
    }
  }),

  // Longer cycle with five references
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(["a"], ["b"], ["c"], ["d"], ["e"])
      })
    ),
    guineaPig: {
      a: { $ref: "#/b" },
      b: { $ref: "#/c" },
      c: { $ref: "#/d" },
      d: { $ref: "#/e" },
      e: { $ref: "#/a" }
    }
  }),

  // Two branches converge, then one points back to an ancestor
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.DirectCircularReference({
        culpritRefKey: ["a", "shared", "back"],
        pointedParent: ["a"]
      })
    ),
    guineaPig: {
      a: {
        shared: {
          back: { $ref: "#/a" }
        },
        left: { $ref: "#/a/shared" },
        right: { $ref: "#/a/shared" }
      }
    }
  }),

  // Nested references with a cycle that jumps several levels up
  new ResolverTestCase({
    expectedResult: HashSet.make(
      new resolver.IndirectCircularReference({
        keysRing: ObjectPathCyclicSequence.from(
          ["a", "b", "c"],
          ["x", "y"],
          ["p", "q", "r"]
        )
      })
    ),
    guineaPig: {
      a: {
        b: {
          c: { $ref: "#/x/y" }
        }
      },
      x: {
        y: { $ref: "#/p/q/r" }
      },
      p: {
        q: {
          r: { $ref: "#/a/b/c" }
        }
      }
    }
  }),

  // Empty object
  new ResolverTestCase({
    guineaPig: {}
  }),

  // Empty array
  new ResolverTestCase({
    guineaPig: []
  }),

  // Primitive root values
  new ResolverTestCase({
    guineaPig: null
  }),

  new ResolverTestCase({
    guineaPig: 42
  }),

  new ResolverTestCase({
    guineaPig: "hello"
  }),

  // A reference to an ancestor, but not a cycle through a reference
  new ResolverTestCase({
    guineaPig: {
      a: {
        b: {
          c: { value: 123 }
        },
        d: { $ref: "#/a/b" }
      }
    }
  })
]

describe("resolver.checkForCircularReferences", () => {
  it.each(resolverTestCases)(
    "resolver.checkForCircularReferences($guineaPig) returns $expectedResultDisplay",
    ({ expectedResult, guineaPig }) => {
      expect(
        resolver.checkForCircularReferences(guineaPig)
      ).toSatisfy(Equal.equals(expectedResult))
    }
  )
})
