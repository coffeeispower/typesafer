import type { Schema } from "effect"
import * as internal from "./internal"

export const RawDocument = internal.WithReferences.Document
export const Document: Schema.Codec<typeof internal.Resolved.Document.Type, typeof RawDocument.Type> =
  internal.AutoResolvingDocument
