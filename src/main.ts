import { Argument, Command, Flag } from "effect/cli"
import { BunServices, BunRuntime } from "@effect/platform-bun"
import { Console, Effect } from "effect"

const name = Argument.String("name").pipe(Argument.withDefault("World"))
const shout = Flag.Boolean("shout").pipe(Flag.withAlias("s"), Flag.withDefault(false))

const greet = Command.make("typesafer", { name, shout }, ({ name, shout }) => {
  const message = `Hello, ${name}!`
  return Console.log(shout ? message.toUpperCase() : message)
})

const program = Command.run(greet, {
  version: "0.1.0-alpha"
})

program.pipe(
  Effect.provide(BunServices.layer),
  BunRuntime.runMain
)
