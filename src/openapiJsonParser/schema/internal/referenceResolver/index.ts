import type { Effect } from "effect"
import type { RawDocument, ResolvedDocument } from ".."
import * as internal from "./internal"

export const InvalidReference = internal.errors.InvalidReference
export type InvalidReference = internal.errors.InvalidReference
export const resolveReferences: (rawDocument: RawDocument) => Effect.Effect<ResolvedDocument, InvalidReference> =
  internal.resolveReferences
export const rollbackResolution: (rawDocument: ResolvedDocument) => Effect.Effect<RawDocument, never> =
  internal.rollbackResolution
