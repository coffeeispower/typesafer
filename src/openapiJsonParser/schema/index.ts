import { Schema } from "effect"
import * as internal from "./internal"

export const RawDocument = internal.WithReferences.Document.pipe(
  Schema.annotate({ identifier: "OpenAPI.RawDocument" })
)
export const Document: Schema.Codec<
  typeof internal.Resolved.Document.Type,
  typeof RawDocument.Type
> = internal.AutoResolvingDocument.pipe(
  Schema.annotate({ identifier: "OpenAPI.Document" })
)

export const DocumentFromJson: Schema.Codec<
  typeof internal.Resolved.Document.Type,
  string
> = Document.pipe(Schema.fromJsonString)
