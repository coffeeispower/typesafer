import { Result } from "effect"
import { InvalidReference } from "./errors"

export function refToKeyArray($ref: string): Result.Result<ReadonlyArray<string>, InvalidReference> {
  const invalidPointerError = Result.fail(new InvalidReference({ data: { ref: $ref, reason: "InvalidPointer" } }))
  if (!$ref.startsWith("#/")) return invalidPointerError
  const split = $ref.split("/")
  if (split.shift() != "#") return invalidPointerError
  if (split.some((s) => !s)) return invalidPointerError
  return Result.succeed(split)
}
