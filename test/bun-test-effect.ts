import type * as BunTest from "bun:test"
import * as bunTest from "bun:test"
import { Cause, Effect, Exit, Fiber, Layer, Scope } from "effect"
import { TestClock, TestConsole } from "effect/testing"

const runPromise = <E, A>(effect: Effect.Effect<A, E>) =>
  Effect.gen(function*() {
    const exitFiber = yield* Effect.forkChild(Effect.exit(effect))

    const exit = yield* Fiber.join(exitFiber)
    if (Exit.isSuccess(exit)) {
      return () => exit.value
    } else {
      if (Cause.hasInterruptsOnly(exit.cause)) {
        return () => {
          throw new Error("All fibers interrupted without errors.")
        }
      }
      const errors = Cause.prettyErrors(exit.cause)
      for (let i = 1; i < errors.length; i++) {
        yield* Effect.logError(errors[i])
      }
      return () => {
        throw errors[0]
      }
    }
  })
    .pipe((effect) => Effect.runPromise(effect))
    .then((f) => f())

type LayerOptions<EnableTestServices extends boolean> = {
  testServices?: EnableTestServices
  memomap?: Layer.MemoMap
}

type TestServices =
  | Layer.Success<ReturnType<typeof TestClock.layer>>
  | Layer.Success<typeof TestConsole.layer>

type TestEffect<R, E, AdditionalServices = never> = Effect.Effect<void, E, R | AdditionalServices>
type NormalEffectTester<R, AdditionalServices = never> = <E>(
  label: string,
  test: () => TestEffect<R, E, AdditionalServices>,
  options?: BunTest.TestOptions
) => void
type ConditionalEffectTester<R> = (condition: boolean) => <E>(
  label: string,
  test: () => TestEffect<R, E>,
  options?: BunTest.TestOptions
) => void
type BulkEffectTester<R, AdditionalServices = never> = <T>(table: Array<T>) => <E>(
  label: string,
  fn: (row: T) => TestEffect<R, E, AdditionalServices>,
  options?: BunTest.TestOptions
) => void
type Testers<R> =
  & {
    [K in "effect" | "only" | "failing" | "skip"]: NormalEffectTester<R>
  }
  & {
    [K in "if" | "skipIf" | "todoIf"]: ConditionalEffectTester<R>
  }
  & {
    todo: typeof bunTest.it.todo
    each: BulkEffectTester<R>
    eachScoped: BulkEffectTester<R, Scope.Scope>
    layer: <R2, E2, const EnableTestServices extends boolean = true>(
      layer_: Layer.Layer<R2, E2>,
      options?: LayerOptions<EnableTestServices>
    ) => ReturnType<typeof layer<R2 | R, E2, EnableTestServices>>
    scoped: NormalEffectTester<R, Scope.Scope>
    scopedOnly: NormalEffectTester<R, Scope.Scope>
  }

/**
 * Constructs a testers object that injects services into your tests, sharing the services and execution context between them after they are initialized.
 *
 * Usage:
 *
 * ```ts
 * import { expect } from "bun:test"
 * import { Context, Effect, Layer } from "effect"
 * import { layer } from "typesafer/test/bun-test-effect"
 *
 * class HelloService extends Context.Service<HelloService, { hello: string }>()("HelloService", {
 *   make: Effect.succeed({ hello: "world" })
 * }) {
 *   static readonly layer = Layer.effect(this, this.make)
 * }
 * layer(HelloService.layer)((it) => {
 *   it.effect(
 *     "hello is equal to \"world\"",
 *     Effect.fn(function*() {
 *       expect((yield* HelloService).hello).toBe("world")
 *     })
 *   )
 * })
 * ```
 */
export function layer<R, E, const EnableTestServices extends boolean = true>(
  layer_: Layer.Layer<R, E>,
  options?: LayerOptions<EnableTestServices>
): <T>(cb: (testers: Testers<EnableTestServices extends true ? R | TestServices : R>) => T) => T {
  type EffectiveServices = EnableTestServices extends true ? R | TestServices : R
  type LayerMaybeWithTestEnv = Layer.Layer<EffectiveServices, E>
  const enableTestServices = options?.testServices !== false
  const testServices = Layer.mergeAll(TestClock.layer(), TestConsole.layer)
  const withTestEnv = (enableTestServices
    ? Layer.provideMerge(layer_, testServices)
    : layer_) as LayerMaybeWithTestEnv
  const memomap = options?.memomap ?? Effect.runSync(Layer.makeMemoMap)
  const scope = Effect.runSync(Scope.make())
  const runtimeEffect = Layer.buildWithMemoMap(withTestEnv, memomap, scope).pipe(
    Effect.orDie,
    Effect.cached,
    Effect.runSync
  )
  const createNormalTester =
    (rawTester: typeof bunTest.it.only): NormalEffectTester<EffectiveServices> => (label, test, options) => {
      rawTester(
        label,
        () =>
          runPromise(
            Effect.flatMap(runtimeEffect, (runtime) => test().pipe(Effect.provide(runtime)))
          ),
        options
      )
    }
  const createScopedTester =
    (rawTester: typeof bunTest.it.only): NormalEffectTester<EffectiveServices, Scope.Scope> =>
    (
      label,
      test,
      options
    ) => {
      rawTester(
        label,
        () =>
          runPromise(
            Effect.flatMap(runtimeEffect, (runtime) => test().pipe(Effect.scoped, Effect.provide(runtime)))
          ),
        options
      )
    }
  const createConditionalTester =
    (rawTester: typeof bunTest.it.if): ConditionalEffectTester<EffectiveServices> => (condition) => {
      const intermediateFn = rawTester(condition)
      return (label, test, options) => {
        intermediateFn(
          label,
          () =>
            runPromise(
              Effect.flatMap(runtimeEffect, (runtime) => test().pipe(Effect.provide(runtime)))
            ),
          options
        )
      }
    }
  const createScopedBulkTester =
    (rawTester: typeof bunTest.it.each): BulkEffectTester<EffectiveServices, Scope.Scope> => <T>(table: Array<T>) => {
      const intermediateFn = rawTester(table)
      return <E>(
        label: string,
        test: (row: T) => TestEffect<EffectiveServices, E, Scope.Scope>,
        options?: BunTest.TestOptions
      ) => {
        intermediateFn(
          label,
          (row: T) =>
            runPromise(
              Effect.flatMap(runtimeEffect, (runtime) => test(row).pipe(Effect.scoped, Effect.provide(runtime)))
            ),
          options
        )
      }
    }
  const createBulkTester =
    (rawTester: typeof bunTest.it.each): BulkEffectTester<EffectiveServices> => <T>(table: Array<T>) => {
      const intermediateFn = rawTester(table)
      return <E>(
        label: string,
        test: (row: T) => TestEffect<EffectiveServices, E>,
        options?: BunTest.TestOptions
      ) => {
        intermediateFn(
          label,
          (row: T) =>
            runPromise(
              Effect.flatMap(runtimeEffect, (runtime) => test(row).pipe(Effect.provide(runtime)))
            ),
          options
        )
      }
    }
  bunTest.beforeAll(() => runPromise(Effect.asVoid(runtimeEffect)))
  bunTest.afterAll(() => runPromise(Scope.close(scope, Exit.void)))
  const testers: Testers<EffectiveServices> = {
    effect: createNormalTester(bunTest.it.bind(bunTest)),
    scoped: createScopedTester(bunTest.it.bind(bunTest)),
    scopedOnly: createScopedTester(bunTest.it.only.bind(bunTest)),
    get only() {
      return createNormalTester(bunTest.it.only.bind(bunTest.it))
    },
    failing: createNormalTester(bunTest.it.failing.bind(bunTest.it)),
    todo: bunTest.it.todo.bind(bunTest.it),
    skip: createNormalTester(bunTest.it.skip.bind(bunTest.it)),
    if: createConditionalTester(bunTest.it.if.bind(bunTest.it)),
    skipIf: createConditionalTester(bunTest.it.skipIf.bind(bunTest.it)),
    todoIf: createConditionalTester(bunTest.it.todoIf.bind(bunTest.it)),
    each: createBulkTester(bunTest.it.each.bind(bunTest.it)),
    eachScoped: createScopedBulkTester(bunTest.it.each.bind(bunTest.it)),
    layer: (layer_, options) => layer(Layer.provideMerge(layer_, withTestEnv), { ...options, memomap })
  }
  return <T>(cb: (testers: Testers<EffectiveServices>) => T): T => cb(testers)
}
type DefaultTesters = Parameters<Parameters<ReturnType<typeof layer<never, never>>>[0]>[0]
type LiveTesters = Parameters<Parameters<ReturnType<typeof layer<never, never, false>>>[0]>[0]
/**
 * Usage:
 *
 * ```
 * it.effect(Effect.fn(function* () {
 *    expect(Number(yield* DateTime.nowAsDate)).toBe(0)
 * }))
 * ```
 */
export const it: DefaultTesters = layer(Layer.empty)((it) => it)
/**
 * Usage:
 *
 * ```
 * it.effect(Effect.fn(function* () {
 *    expect(Number(yield* DateTime.nowAsDate)).toBeGreaterThan(0)
 * }))
 * ```
 */
export const itLive: LiveTesters = layer(Layer.empty, { testServices: false })((it) => it)
