import { Equal, HashSet, JsonPointer, type MutableHashSet, Option, Schema, SchemaAST } from "effect"
import * as Array from "effect/Array"
import * as Predicate from "effect/Predicate"
import { Reference } from "../../withReferences"

export const ObjectPath = Schema.Array(Schema.Union([Schema.String, Schema.Natural]))
export type ObjectPath = typeof ObjectPath.Type
export type Paths = HashSet.HashSet<ObjectPath>
export type MutablePaths = MutableHashSet.MutableHashSet<ObjectPath>
function getPaths(entries: ReadonlyArray<readonly [string | number, unknown]>, base: ObjectPath = []) {
  return entries.map(([key, value]) => {
    const newBase: ObjectPath = [...base, key]
    if (Predicate.isObject(value)) {
      return getAllPathsRecursive(value, newBase).pipe(HashSet.add(newBase))
    } else if (Array.isArray(value) && Array.isArrayNonEmpty(value)) {
      return getAllPathsRecursive(value, newBase)
    }
    return HashSet.empty()
  }).reduce(HashSet.union<ObjectPath, ObjectPath>, HashSet.empty<ObjectPath>())
}
export function getAllPathsRecursive(obj: unknown, base: ObjectPath = []): Paths {
  if (Predicate.isObject(obj)) {
    const entries: ReadonlyArray<readonly [string, unknown]> = Object.entries(obj)
    return getPaths(entries, base)
  } else if (Array.isArray(obj)) {
    return getPaths(obj.map((item, i) => [i, item]), base)
  } else {
    return HashSet.empty()
  }
}

export function accessPointer(object: unknown, path: ObjectPath): Option.Option<unknown> {
  if (Array.isReadonlyArrayEmpty(path)) {
    return Option.some(object)
  }
  const key = path[0]
  if (!Predicate.isObjectOrArray(object)) {
    return Option.none()
  }
  if ((Predicate.isObject(object) && !(assertStr(key) in object))) return Option.none()
  if ((Array.isArray(object) && object.length <= assertNumber(key))) return Option.none()
  const nextObject = object[key as any]
  const newPath = Array.drop(path, 1)
  return accessPointer(nextObject, newPath)
}
function assertNumber(v: unknown): number {
  if (!Predicate.isNumber(v)) {
    throw new Error(`Expected ${v} to be a number`)
  } else {
    return v
  }
}

function assertStr(v: unknown): string {
  if (!Predicate.isString(v)) {
    throw new Error(`Expected ${v} to be a string`)
  } else {
    return v
  }
}
function assertNotNull<T>(v: T): T & {} {
  if (!Predicate.isNotNullish(v)) {
    throw new Error(`Expected ${v} to be a string`)
  } else {
    return v
  }
}
export function isParent(self: ObjectPath, that: ObjectPath): boolean {
  if (that.length >= self.length) return false
  return Equal.equals(Array.take(self, that.length), that)
}

export function isImmediateParent(self: ObjectPath, that: ObjectPath): boolean {
  if (that.length !== self.length - 1) return false
  return Equal.equals(Array.dropRight(self, 1), that)
}

export function normalizeReferencePath(
  object: unknown,
  path: ObjectPath
): ObjectPath {
  if (Equal.equals(path, [""])) return []; // JsonPointer parses #/ as [ "" ] for some fucking reason, so if we encounter that, we normalize it to [] which is considered to be our "root" pointer
  let current = object

  return path.map((segment) => {
    if (Array.isArray(current)) {
      if (!Predicate.isString(segment)) {
        throw new Error(`Invalid array index: ${segment}`)
      }
      const index = Number.parseInt(segment);
      if (Number.isNaN(index)) {
        throw new Error(`Invalid array index: ${segment}`)
      }

      current = current[index]
      return index
    }

    if (Predicate.isObject(current)) {
      current = current[String(segment)];
      return String(segment)
    }

    return segment
  })
}


export function refToObjectPath(object: unknown, $ref: string): ObjectPath {
  return normalizeReferencePath(object, assertNotNull(JsonPointer.parseUriFragment($ref)))
}


function assertIs<S extends Schema.Constraint>(schema: S, object: unknown): S["Type"] {
  if (!Schema.is(schema)(object)) throw "Expected object to be a valid " + SchemaAST.resolveIdentifier(schema.ast) + " but got " + JSON.stringify(object);
  return object;
}
export function extract$ref(object: unknown, path: ObjectPath): string {
  return Option.getOrThrow(assertIs(Schema.Option(Reference), accessPointer(object, path))).$ref;
}


export function filterPathsWithRef(object: unknown, paths: Paths): Paths {
  const referencesPaths = paths.pipe(
    HashSet.filter((path) => {
      const obj = Option.getOrThrow(accessPointer(object, path));
      if (Predicate.isObject(obj) && "$ref" in obj && Predicate.isString(obj.$ref)) return true
      return false;
    })
  )
  return referencesPaths
}
