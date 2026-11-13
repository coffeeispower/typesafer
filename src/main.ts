import { BunRuntime } from "@effect/platform-bun"
import { Effect } from "effect"

const program = Effect.gen(function*() {
})

BunRuntime.runMain()(program)
