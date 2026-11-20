import { Effect, HashSet } from "effect"
import type { RawDocument, ResolvedDocument } from "../.."
import * as errors from "./errors"
import { checkForCircularReferences } from "./circularReferenceChecker"

export const resolveReferences = Effect.fn(
  "typesafer.openapiJsonParser.schema.internal.referenceResolver.internal.resolveReferences"
)(function* (rawDocument: RawDocument): Effect.gen.Return<ResolvedDocument, errors.InvalidReference> {
  const circularReferences = checkForCircularReferences(rawDocument);
  if (circularReferences.pipe(HashSet.size) > 0) {
    return yield* new errors.InvalidReference({data: {reason: "CircularReferences", circularReferences, ref: "#/"}})
  }
  return yield* Effect.die("TODO " + JSON.stringify(rawDocument))
})

export const rollbackResolution = Effect.fn(
  "typesafer.openapiJsonParser.schema.internal.referenceResolver.internal.resolveReferences"
)(function*(resolvedDocument: ResolvedDocument): Effect.gen.Return<RawDocument, never> {
  return yield* Effect.die("TODO " + JSON.stringify(resolvedDocument))
})
