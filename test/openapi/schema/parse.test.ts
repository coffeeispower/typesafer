import { expect } from "bun:test"
import { Effect, Schema } from "effect"
import { it } from "typesafer/test/bun-test-effect"
import { OpenAPISchema } from "../../../src/openapiJsonParser/index"
import discordOpenApi from "./discord_openapi.json"

it.effect(
  "parses the Discord OpenAPI document using the Document schema and encodes to the same object",
  Effect.fn(function*() {
    const document = yield* Schema.decodeUnknownEffect(OpenAPISchema.Document)(discordOpenApi as unknown)
    expect(document.info.title).toBe("Discord HTTP API (Preview)")
    const reencoded = yield* Schema.encodeUnknownEffect(OpenAPISchema.Document)(document)
    expect(document).toEqual(reencoded)
  })
)
