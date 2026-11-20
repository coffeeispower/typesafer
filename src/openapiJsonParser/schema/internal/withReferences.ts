import { JsonPointer, Schema } from "effect"
import { Common } from "./common"

export const Reference = Schema.Struct({ $ref: Schema.String.pipe(Schema.check(Schema.makeFilter(($ref) => JsonPointer.parseUriFragment($ref) ? [] : Array.of<Schema.FilterIssue>( {issue: "JsonPointer.parseUriFragment failed", path: []})))) })
  .pipe((s) => Schema.StructWithRest(s, [Schema.Record(Schema.String, Schema.Any)]))
  .pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Reference" }))
export namespace WithReferences {
  const refOr = <S extends Schema.Constraint>(schema: S) =>
    Schema.Union([Reference, schema]).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.ReferenceOr" }))
  type Reference = typeof Reference.Type
  export interface SchemaObject extends Common.SchemaCommonFieldsType, Record<string, any> {
    readonly not?: Reference | SchemaObject | undefined
    readonly allOf?: ReadonlyArray<SchemaObject | Reference> | undefined
    readonly oneOf?: ReadonlyArray<SchemaObject | Reference> | undefined
    readonly anyOf?: ReadonlyArray<SchemaObject | Reference> | undefined
    readonly items?: SchemaObject | Reference | undefined
    readonly properties?: Record<string, Reference | SchemaObject> | undefined
    readonly additionalProperties?: Reference | SchemaObject | boolean | undefined
  }
  const SchemaObjectFn = Schema.suspend((): Schema.Codec<SchemaObject> => SchemaObject).pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.SchemaObject" })
  )

  const SchemaObject: Schema.Codec<SchemaObject> = Schema.Struct({
    ...Common.SchemaFields,
    not: Schema.optional(refOr(SchemaObjectFn)),
    allOf: Schema.optional(Schema.Array(refOr(SchemaObjectFn))),
    oneOf: Schema.optional(Schema.Array(refOr(SchemaObjectFn))),
    anyOf: Schema.optional(Schema.Array(refOr(SchemaObjectFn))),
    items: Schema.optional(refOr(SchemaObjectFn)),
    properties: Schema.optional(Schema.Record(Schema.String, refOr(SchemaObjectFn))),
    additionalProperties: Schema.optional(Schema.Union([refOr(SchemaObjectFn), Schema.Boolean]))
  })
    .pipe((s) => Schema.StructWithRest(s, [Schema.Record(Schema.String, Schema.Any)]))
    .pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.SchemaObject" }))

  export interface Encoding extends Common.EncodingCommonFieldsType {
    readonly headers?: Readonly<Record<string, Reference | Header>> | undefined
  }
  export interface MediaType extends Common.MediaTypeCommonFieldsType {
    readonly schema?: Reference | SchemaObject | undefined
    readonly examples?: Readonly<Record<string, Reference | typeof Common.Example.Type>> | undefined
    readonly encoding?: Readonly<Record<string, Encoding>> | undefined
  }
  export interface Header extends Common.HeaderCommonFieldsType {
    readonly schema?: Reference | SchemaObject | undefined
    readonly content?: Readonly<Record<string, MediaType>> | undefined
    readonly examples?: Readonly<Record<string, Reference | typeof Common.Example.Type>> | undefined
  }
  const EncodingFn = Schema.suspend((): Schema.Codec<Encoding> => Encoding).pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.Encoding" })
  )
  const MediaTypeFn = Schema.suspend((): Schema.Codec<MediaType> => MediaType).pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.MediaType" })
  )
  const HeaderFn = Schema.suspend((): Schema.Codec<Header> => Header).pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.Header" })
  )

  const Encoding: Schema.Codec<Encoding> = Schema.Struct({
    ...Common.EncodingFields,
    headers: Schema.optional(Schema.Record(Schema.String, refOr(HeaderFn)))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Encoding" }))
  const MediaType: Schema.Codec<MediaType> = Schema.Struct({
    ...Common.MediaTypeFields,
    schema: Schema.optional(refOr(SchemaObject)),
    examples: Schema.optional(Schema.Record(Schema.String, refOr(Common.Example))),
    encoding: Schema.optional(Schema.Record(Schema.String, EncodingFn))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.MediaType" }))

  const Header: Schema.Codec<Header> = Schema.Struct({
    ...Common.HeaderFields,
    schema: Schema.optional(refOr(SchemaObject)),
    content: Schema.optional(Schema.Record(Schema.String, MediaTypeFn)),
    examples: Schema.optional(Schema.Record(Schema.String, refOr(Common.Example)))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Header" }))

  export interface Response extends Common.ResponseCommonFieldsType {
    readonly headers?: Readonly<Record<string, Reference | Header>> | undefined
    readonly content?: Readonly<Record<string, MediaType>> | undefined
    readonly links?: Readonly<Record<string, Reference | typeof Common.Link.Type>> | undefined
  }
  const Response: Schema.Codec<Response> = Schema.Struct({
    ...Common.ResponseFields,
    headers: Schema.optional(Schema.Record(Schema.String, refOr(HeaderFn))),
    content: Schema.optional(Schema.Record(Schema.String, MediaTypeFn)),
    links: Schema.optional(Schema.Record(Schema.String, refOr(Common.Link)))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Response" }))
  const Responses = Schema.Record(Schema.String, refOr(Response)).pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.Responses" })
  )

  export interface Parameter extends Common.ParameterCommonFieldsType {
    readonly schema?: Reference | SchemaObject | undefined
    readonly content?: Readonly<Record<string, MediaType>> | undefined
    readonly examples?: Readonly<Record<string, Reference | typeof Common.Example.Type>> | undefined
  }
  const ParameterFields = {
    ...Common.ParameterFields,
    schema: Schema.optional(refOr(SchemaObject)),
    content: Schema.optional(Schema.Record(Schema.String, MediaTypeFn)),
    examples: Schema.optional(Schema.Record(Schema.String, refOr(Common.Example)))
  }
  const Parameter: Schema.Codec<Parameter> = Schema.Union([
    Schema.Struct({
      ...ParameterFields,
      in: Schema.Literal("path"),
      required: Schema.Literal(true),
      style: Schema.optional(Schema.Literals(["matrix", "label", "simple"]))
    }),
    Schema.Struct({
      ...ParameterFields,
      in: Schema.Literal("query"),
      style: Schema.optional(Schema.Literals(["form", "spaceDelimited", "pipeDelimited", "deepObject"]))
    }),
    Schema.Struct({
      ...ParameterFields,
      in: Schema.Literal("header"),
      style: Schema.optional(Schema.Literal("simple"))
    }),
    Schema.Struct({ ...ParameterFields, in: Schema.Literal("cookie"), style: Schema.optional(Schema.Literal("form")) })
  ]).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Parameter" }))

  export interface RequestBody extends Common.RequestBodyCommonFieldsType {
    readonly content: Readonly<Record<string, MediaType>>
  }
  const RequestBody: Schema.Codec<RequestBody> = Schema.Struct({
    ...Common.RequestBodyFields,
    content: Schema.Record(Schema.String, MediaTypeFn)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.RequestBody" }))
  const SecurityScheme = Common.SecurityScheme.pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.SecurityScheme" })
  )

  export interface Operation extends Common.OperationCommonFieldsType {
    readonly parameters?: ReadonlyArray<Reference | typeof Parameter.Type> | undefined
    readonly requestBody?: Reference | typeof RequestBody.Type | undefined
    readonly responses: Readonly<Record<string, Reference | typeof Response.Type>>
    readonly callbacks?: Readonly<Record<string, Reference | Callback>> | undefined
  }
  export interface PathItem extends Common.PathItemCommonFieldsType {
    readonly $ref?: string | undefined
    readonly get?: Operation | undefined
    readonly put?: Operation | undefined
    readonly post?: Operation | undefined
    readonly delete?: Operation | undefined
    readonly options?: Operation | undefined
    readonly head?: Operation | undefined
    readonly patch?: Operation | undefined
    readonly trace?: Operation | undefined
  }
  export type Callback = Readonly<Record<string, PathItem>>
  const OperationFn = Schema.suspend((): Schema.Codec<Operation> =>
    Schema.Struct({
      ...Common.OperationFields,
      parameters: Schema.optional(Schema.Array(refOr(Parameter))),
      requestBody: Schema.optional(refOr(RequestBody)),
      responses: Responses,
      callbacks: Schema.optional(Schema.Record(Schema.String, refOr(CallbackFn)))
    })
  ).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Operation" }))
  const PathItemFn = Schema.suspend((): Schema.Codec<PathItem> =>
    Schema.Struct({
      $ref: Schema.optional(Schema.String),
      ...Common.PathItemFields,
      get: Schema.optional(OperationFn),
      put: Schema.optional(OperationFn),
      post: Schema.optional(OperationFn),
      delete: Schema.optional(OperationFn),
      options: Schema.optional(OperationFn),
      head: Schema.optional(OperationFn),
      patch: Schema.optional(OperationFn),
      trace: Schema.optional(OperationFn),
      parameters: Schema.optional(Schema.Array(refOr(Parameter)))
    })
  ).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.PathItem" }))
  const CallbackFn = Schema.suspend((): Schema.Codec<Callback> => Schema.Record(Schema.String, PathItemFn)).pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.Callback" })
  )
  const Paths = Schema.Record(Schema.String, PathItemFn).pipe(
    Schema.annotate({ identifier: "OpenAPI.WithReferences.Paths" })
  )

  const Components = Schema.Struct({
    schemas: Schema.optional(Schema.Record(Schema.String, refOr(SchemaObject))),
    responses: Schema.optional(Schema.Record(Schema.String, refOr(Response))),
    parameters: Schema.optional(Schema.Record(Schema.String, refOr(Parameter))),
    examples: Schema.optional(Schema.Record(Schema.String, refOr(Common.Example))),
    requestBodies: Schema.optional(Schema.Record(Schema.String, refOr(RequestBody))),
    headers: Schema.optional(Schema.Record(Schema.String, refOr(Header))),
    securitySchemes: Schema.optional(Schema.Record(Schema.String, refOr(SecurityScheme))),
    links: Schema.optional(Schema.Record(Schema.String, refOr(Common.Link))),
    callbacks: Schema.optional(Schema.Record(Schema.String, refOr(CallbackFn)))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Components" }))

  export const Document = Schema.Struct({
    ...Common.DocumentFields,
    paths: Paths,
    components: Schema.optional(Components)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.WithReferences.Document" }))
}
