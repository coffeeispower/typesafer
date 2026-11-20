import {
	Array,
	Data,
	type HashSet,
	JsonPointer,
	Match,
	pipe,
	SchemaAST,
	SchemaIssue,
} from "effect";
import type { NonEmptyReadonlyArray } from "effect/Array";
import type { SchemaError } from "effect/Schema";
import { Document } from "../../..";
import type {
	CircularReference,
	DirectCircularReference,
	IndirectCircularReference,
} from "./circularReferenceChecker";

type InvalidReferenceData = { ref: string; refPropertyLocation?: string } & (
	| {
			reason: "InvalidSchema";
			schemaError: SchemaError;
			ast: SchemaAST.AST;
	  }
	| {
			reason: "DanglingPointer" | "InvalidPointer";
			schemaError?: undefined;
			ast?: undefined;
	  }
	| {
			reason: "CircularReferences";
			circularReferences: HashSet.HashSet<CircularReference>;
			schemaError?: undefined;
			ast?: undefined;
	  }
);
/**
 * Constructs a validation error for a `$ref` key that points nowhere, or points to a value that does not have the expected shape or is malformed.
 */
export class InvalidReference extends Data.TaggedError(
	"typesafer/src/openApiJsonParser/schema/internal/referenceResolver/InvalidReference",
)<{ data: InvalidReferenceData }> {
	get reason() {
		return this.data.reason;
	}
	get ref() {
		return this.data.ref;
	}
	get refPropertyLocation() {
		return this.data.refPropertyLocation;
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
		const atRefPropertyLocation = (
			issue: SchemaIssue.Issue,
		): SchemaIssue.Issue => {
			if (this.refPropertyLocation === undefined) return issue;
			const keyArrayResult = JsonPointer.parseUriFragment(
				this.refPropertyLocation,
			);
			return !keyArrayResult
				? issue
				: new SchemaIssue.Pointer(keyArrayResult, issue);
		};

		if (this.data.reason === "InvalidSchema") {
			const targetLocation = JsonPointer.parseUriFragment(this.ref);
			const targetIssue = !targetLocation
				? this.data.schemaError.issue
				: new SchemaIssue.Pointer(targetLocation, this.data.schemaError.issue);

			return new SchemaIssue.Composite(this.data.ast, [
				atRefPropertyLocation(
					new SchemaIssue.InvalidValue(
						{
							expected:
								"a $ref that resolves to a valid " +
								(SchemaAST.resolveIdentifier(this.data.ast) ??
									SchemaAST.resolveTitle(this.data.ast) ??
									SchemaAST.resolveDescription(this.data.ast) ??
									"value"),
						},
						this.ref,
						{ reportInput: true },
					),
				),
				targetIssue,
			]);
		}

		const coreError = Match.value(this.data).pipe(
			Match.discriminatorsExhaustive("reason")({
				DanglingPointer: () =>
					new SchemaIssue.InvalidValue(
						{
							message: `Invalid $ref ${JSON.stringify(this.ref)}: the referenced location does not exist`,
							cause: new SchemaIssue.MissingKey({
								messageMissingKey: `Referenced location does not exist: ${this.ref}`,
							}),
						},
						this.ref,
						{ reportInput: true },
					),
				InvalidPointer: () =>
					new SchemaIssue.InvalidValue(
						{ expected: "a valid $ref (format: #/path/to/key)" },
						this.ref,
					),
				CircularReferences: (c) =>
					new SchemaIssue.Composite(
						Document.ast,
						c.circularReferences.pipe(
							Array.Array.from<CircularReference>,
							Array.map((r) =>
								Match.value(r).pipe(
									Match.tagsExhaustive({
										DirectCircularReference: (
											direct: DirectCircularReference,
										) =>
											new SchemaIssue.InvalidValue({
												message:
													"Reference is pointing at itself or a parent: " +
													JSON.stringify(
														JsonPointer.formatUriFragment(direct.pointedParent.map(String)),
													) +
													" ← " +
													JSON.stringify(
														JsonPointer.formatUriFragment(direct.culpritRefKey.map(String)),
													),
											}),
										IndirectCircularReference: (
											indirect: IndirectCircularReference,
										) =>
											new SchemaIssue.Forbidden({
												message:
													"Found a circular dependency: " +
                          pipe(
                            indirect.keysRing.elements,
														Array.map((el) =>
															JSON.stringify(JsonPointer.formatUriFragment(el.map(String))),
														),
														Array.join(" → "),
													),
											}),
									}),
								),
							),
						) satisfies ReadonlyArray<SchemaIssue.Issue> as unknown as NonEmptyReadonlyArray<SchemaIssue.Issue>,
					),
			}),
		);
		return atRefPropertyLocation(coreError);
	}
}
