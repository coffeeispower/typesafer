import { Argument, Command, Flag } from "effect/cli";
import { BunServices, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Logger } from "effect";
import * as OpenApiJsonParser from "./openapiJsonParser";
const openApiDocument = Argument.FileSchema(
	"openapi file",
	OpenApiJsonParser.OpenAPISchema.Document,
).pipe(
	Argument.withDescription(
		"The open api file to convert to effect's HttpApi definitions",
	),
);
const outputDir = Flag.Path("output-dir", {
	mustExist: true,
	pathType: "directory",
}).pipe(
	Flag.withAlias("o"),
	Flag.withDefault("."),
	Flag.withDescription("Where to output the generated code."),
);

const generate = Command.make(
	"generate",
	{ openApiDocument, outputDir },
	Effect.fn("command.generate")(function* ({ openApiDocument, outputDir }) {
		yield* Effect.never
	}),
);
const typesafer = Command.make("typesafer").pipe(Command.withSubcommands([generate]));

const program = Command.run(typesafer, {
	version: "0.1.0-alpha",
});
const prodLayer = Layer.provideMerge(
	BunServices.layer,
	Logger.layer([Logger.consolePrettyTty()]),
);
program.pipe(Effect.provide(prodLayer), BunRuntime.runMain);
