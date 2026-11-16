import { Data, Match, Result, SchemaAST, SchemaIssue } from "effect"
import type { SchemaError } from "effect/Schema"
import * as refPointer from "./refPointer"

type InvalidReferenceData =
  & { ref: string; refPropertyLocation?: string }
  & (
    {
      reason: "InvalidSchema"
      schemaError: SchemaError
      ast: SchemaAST.AST
    } | { reason: "DanglingPointer" | "InvalidPointer"; schemaError?: undefined; ast?: undefined }
  )
/**
 * Constructs a validation error for a `$ref` key that points nowhere, or points to a value that does not have the expected shape or is malformed.
 */
export class InvalidReference
  extends Data.TaggedError("typesafer/src/openApiJsonParser/schema/internal/referenceResolver/InvalidReference")<
    { data: InvalidReferenceData }
  >
{
  get reason() {
    return this.data.reason
  }
  get ref() {
    return this.data.ref
  }
  get refPropertyLocation() {
    return this.data.refPropertyLocation
  }

  toSchemaIssue(this: InvalidReference): SchemaIssue.Issue {
    /**
     * Wraps a schema issue in a `Composite` error, attaching an issue referencing the `$ref` property
     * saying that it is invalid.
     *
     * **Example:**
     * ```
     * error: Expected a $ref that resolves to a valid value, got "#/non/existent"
     *   at ["somewhere"]["$ref"]
     * Expected number
     *   at ["non"]["existent"]["a"]
     * ```
     *
     * @param issue Core issue
     * @returns Wrapped issue joined with an issue pointing at the ref property
     */
    const atRefPropertyLocation = (issue: SchemaIssue.Issue): SchemaIssue.Issue => {
      if (this.refPropertyLocation === undefined) return issue
      const keyArrayResult = refPointer.refToKeyArray(this.refPropertyLocation)
      return Result.isFailure(keyArrayResult)
        ? issue
        : new SchemaIssue.Pointer(keyArrayResult.success, issue)
    }

    if (this.data.reason === "InvalidSchema") {
      const targetLocation = refPointer.refToKeyArray(this.ref)
      const targetIssue = Result.isFailure(targetLocation)
        ? this.data.schemaError.issue
        : new SchemaIssue.Pointer(targetLocation.success, this.data.schemaError.issue)

      return new SchemaIssue.Composite(
        this.data.ast,
        [
          atRefPropertyLocation(
            new SchemaIssue.InvalidValue(
              {
                expected: "a $ref that resolves to a valid " +
                  (SchemaAST.resolveIdentifier(this.data.ast) ?? SchemaAST.resolveTitle(this.data.ast) ??
                    SchemaAST.resolveDescription(this.data.ast) ?? "value")
              },
              this.ref,
              { reportInput: true }
            )
          ),
          targetIssue
        ]
      )
    }

    const coreError = Match.value(this).pipe(
      Match.discriminatorsExhaustive("reason")({
        DanglingPointer: () =>
          new SchemaIssue.InvalidValue(
            {
              message: `Invalid $ref ${JSON.stringify(this.ref)}: the referenced location does not exist`,
              cause: new SchemaIssue.MissingKey({
                messageMissingKey: `Referenced location does not exist: ${this.ref}`
              })
            },
            this.ref,
            { reportInput: true }
          ),
        InvalidSchema: () => this.data.schemaError!.issue,
        InvalidPointer: () =>
          new SchemaIssue.InvalidValue({ expected: "a valid $ref (format: #/path/to/key)" }, this.ref)
      })
    )
    return atRefPropertyLocation(coreError)
  }
}
