import { Effect, Schema, SchemaGetter } from "effect"
import * as ReferenceResolver from "./referenceResolver"
import { WithReferences } from "./withReferences"

export * from "./common"
export { ReferenceResolver }
export * from "./withReferences"

export type Document = typeof WithReferences.Document.Type
