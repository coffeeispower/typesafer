import { Effect } from "effect"
import type { RawDocument, ResolvedDocument } from "../.."
import type * as errors from "./errors"

export const resolveReferences = Effect.fn(
  "typesafer.openapiJsonParser.schema.internal.referenceResolver.internal.resolveReferences"
)(function*(rawDocument: RawDocument): Effect.gen.Return<ResolvedDocument, errors.InvalidReference> {
  return yield* Effect.die("TODO")
})

export const rollbackResolution = Effect.fn(
  "typesafer.openapiJsonParser.schema.internal.referenceResolver.internal.resolveReferences"
)(function*(rawDocument: ResolvedDocument): Effect.gen.Return<RawDocument, never> {
  return yield* Effect.die("TODO")
})
