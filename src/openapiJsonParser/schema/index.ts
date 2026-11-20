import { Schema } from "effect"
import * as internal from "./internal"

export const Document = internal.WithReferences.Document.pipe(
  Schema.annotate({ identifier: "OpenAPI.Document" })
)
export const DocumentFromJson: Schema.Codec<
  typeof Document.Type,
  string
> = Document.pipe(Schema.fromJsonString)
export {Reference} from "./internal"
