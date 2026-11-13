import { expect } from "bun:test"
import { Effect, Schema } from "effect"
import { it } from "typesafer/test/bun-test-effect"
import { OpenAPISchema } from "../../../src/openapiJsonParser/index"
import discordOpenApi from "./discord_openapi.json"

it.effect(
  "parses the Discord OpenAPI document using the RawDocument (doesn't resolve references)",
  Effect.fn(function*() {
    const document = yield* Schema.decodeUnknownEffect(OpenAPISchema.RawDocument)(discordOpenApi as unknown)
    expect(document.info.title).toBe("Discord HTTP API (Preview)")
    const reencoded = yield* Schema.encodeUnknownEffect(OpenAPISchema.RawDocument)(document)
    expect(document).toEqual(reencoded)
  })
)
