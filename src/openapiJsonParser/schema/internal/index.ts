import { Effect, pipe, Schema, SchemaGetter, SchemaIssue } from "effect"
import * as ReferenceResolver from "./referenceResolver"
import * as internal from "./referenceResolver/internal"
import { Resolved } from "./resolved"
import { WithReferences } from "./withReferences"

export * from "./common"
export { ReferenceResolver }
export * from "./resolved"
export * from "./withReferences"

export type RawDocument = typeof WithReferences.Document.Type
export type ResolvedDocument = typeof Resolved.Document.Type
export const AutoResolvingDocument = WithReferences.Document.pipe(Schema.decodeTo(
  Resolved.Document,
  {
    decode: SchemaGetter.transformEffect((v, _) =>
      Effect.mapError(ReferenceResolver.resolveReferences(v), (e) => e.toSchemaIssue())
    ),
    encode: SchemaGetter.transformEffect((v, _) => ReferenceResolver.rollbackResolution(v))
  }
))
