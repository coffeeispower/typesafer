import { Schema } from "effect"
import { Common } from "./common"

export namespace Resolved {
  export interface SchemaObject extends Common.SchemaCommonFieldsType, Record<string, any> {
    readonly not?: SchemaObject | undefined
    readonly allOf?: ReadonlyArray<SchemaObject> | undefined
    readonly oneOf?: ReadonlyArray<SchemaObject> | undefined
    readonly anyOf?: ReadonlyArray<SchemaObject> | undefined
    readonly items?: SchemaObject | undefined
    readonly properties?: Readonly<Record<string, SchemaObject>> | undefined
    readonly additionalProperties?: SchemaObject | boolean | undefined
  }
  const SchemaObjectFn = Schema.suspend((): Schema.Codec<SchemaObject> => SchemaObject).pipe(
    Schema.annotate({ identifier: "OpenAPI.Resolved.SchemaObject" })
  )

  const SchemaObject: Schema.Codec<SchemaObject> = Schema.Struct({
    ...Common.SchemaFields,
    not: Schema.optional(SchemaObjectFn),
    allOf: Schema.optional(Schema.Array(SchemaObjectFn)),
    oneOf: Schema.optional(Schema.Array(SchemaObjectFn)),
    anyOf: Schema.optional(Schema.Array(SchemaObjectFn)),
    items: Schema.optional(SchemaObjectFn),
    properties: Schema.optional(Schema.Record(Schema.String, SchemaObjectFn)),
    additionalProperties: Schema.optional(Schema.Union([SchemaObjectFn, Schema.Boolean]))
  })
    .pipe((s) => Schema.StructWithRest(s, [Schema.Record(Schema.String, Schema.Any)]))
    .pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.SchemaObject" }))

  export interface Encoding extends Common.EncodingCommonFieldsType {
    readonly headers?: Readonly<Record<string, Header>> | undefined
  }
  export interface MediaType extends Common.MediaTypeCommonFieldsType {
    readonly schema?: SchemaObject | undefined
    readonly examples?: Readonly<Record<string, typeof Common.Example.Type>> | undefined
    readonly encoding?: Readonly<Record<string, Encoding>> | undefined
  }
  export interface Header extends Common.HeaderCommonFieldsType {
    readonly schema?: SchemaObject | undefined
    readonly content?: Readonly<Record<string, MediaType>> | undefined
    readonly examples?: Readonly<Record<string, typeof Common.Example.Type>> | undefined
  }
  const EncodingFn = Schema.suspend((): Schema.Codec<Encoding> => Encoding).pipe(
    Schema.annotate({ identifier: "OpenAPI.Resolved.Encoding" })
  )
  const MediaTypeFn = Schema.suspend((): Schema.Codec<MediaType> => MediaType).pipe(
    Schema.annotate({ identifier: "OpenAPI.Resolved.MediaType" })
  )
  const HeaderFn = Schema.suspend((): Schema.Codec<Header> => Header).pipe(
    Schema.annotate({ identifier: "OpenAPI.Resolved.Header" })
  )

  const MediaType: Schema.Codec<MediaType> = Schema.Struct({
    ...Common.MediaTypeFields,
    schema: Schema.optional(SchemaObjectFn),
    examples: Schema.optional(Schema.Record(Schema.String, Common.Example)),
    encoding: Schema.optional(Schema.Record(Schema.String, EncodingFn))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.MediaType" }))

  const Header: Schema.Codec<Header> = Schema.Struct({
    ...Common.HeaderFields,
    schema: Schema.optional(SchemaObjectFn),
    content: Schema.optional(Schema.Record(Schema.String, MediaTypeFn)),
    examples: Schema.optional(Schema.Record(Schema.String, Common.Example))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Header" }))

  const Encoding: Schema.Codec<Encoding> = Schema.Struct({
    ...Common.EncodingFields,
    headers: Schema.optional(Schema.Record(Schema.String, HeaderFn))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Encoding" }))

  export interface Response extends Common.ResponseCommonFieldsType {
    readonly headers?: Readonly<Record<string, Header>> | undefined
    readonly content?: Readonly<Record<string, MediaType>> | undefined
    readonly links?: Readonly<Record<string, typeof Common.Link.Type>> | undefined
  }
  const Response: Schema.Codec<Response> = Schema.Struct({
    ...Common.ResponseFields,
    headers: Schema.optional(Schema.Record(Schema.String, HeaderFn)),
    content: Schema.optional(Schema.Record(Schema.String, MediaTypeFn)),
    links: Schema.optional(Schema.Record(Schema.String, Common.Link))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Response" }))
  const Responses = Schema.Record(Schema.String, Response).pipe(
    Schema.annotate({ identifier: "OpenAPI.Resolved.Responses" })
  )

  export interface Parameter extends Common.ParameterCommonFieldsType {
    readonly schema?: SchemaObject | undefined
    readonly content?: Readonly<Record<string, MediaType>> | undefined
    readonly examples?: Readonly<Record<string, typeof Common.Example.Type>> | undefined
  }
  const ParameterFields = {
    ...Common.ParameterFields,
    schema: Schema.optional(SchemaObjectFn),
    content: Schema.optional(Schema.Record(Schema.String, MediaTypeFn)),
    examples: Schema.optional(Schema.Record(Schema.String, Common.Example))
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
  ]).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Parameter" }))

  export interface RequestBody extends Common.RequestBodyCommonFieldsType {
    readonly content: Readonly<Record<string, MediaType>>
  }
  const RequestBody: Schema.Codec<RequestBody> = Schema.Struct({
    ...Common.RequestBodyFields,
    content: Schema.Record(Schema.String, MediaTypeFn)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.RequestBody" }))
  const SecurityScheme = Common.SecurityScheme.pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.SecurityScheme" }))

  export interface Operation extends Common.OperationCommonFieldsType {
    readonly parameters?: ReadonlyArray<typeof Parameter.Type> | undefined
    readonly requestBody?: typeof RequestBody.Type | undefined
    readonly responses: Readonly<Record<string, typeof Response.Type>>
    readonly callbacks?: Readonly<Record<string, Callback>> | undefined
  }
  export interface PathItem extends Common.PathItemCommonFieldsType {
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
    Schema.StructWithRest(
      Schema.Struct({
        ...Common.OperationFields,
        parameters: Schema.optional(Schema.Array(Parameter)),
        requestBody: Schema.optional(RequestBody),
        responses: Responses,
        callbacks: Schema.optional(Schema.Record(Schema.String, CallbackFn))
      }),
      [Schema.Record(Schema.String, Schema.Any)]
    )
  ).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Operation" }))
  const PathItemFn = Schema.suspend((): Schema.Codec<PathItem> =>
    Schema.Struct({
      ...Common.PathItemFields,
      get: Schema.optional(OperationFn),
      put: Schema.optional(OperationFn),
      post: Schema.optional(OperationFn),
      delete: Schema.optional(OperationFn),
      options: Schema.optional(OperationFn),
      head: Schema.optional(OperationFn),
      patch: Schema.optional(OperationFn),
      trace: Schema.optional(OperationFn),
      parameters: Schema.optional(Schema.Array(Parameter))
    })
  ).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.PathItem" }))
  const CallbackFn = Schema.suspend((): Schema.Codec<Callback> => Schema.Record(Schema.String, PathItemFn)).pipe(
    Schema.annotate({ identifier: "OpenAPI.Resolved.Callback" })
  )
  const Paths = Schema.Record(Schema.String, PathItemFn).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Paths" }))

  const Components = Schema.Struct({
    schemas: Schema.optional(Schema.Record(Schema.String, SchemaObject)),
    responses: Schema.optional(Schema.Record(Schema.String, Response)),
    parameters: Schema.optional(Schema.Record(Schema.String, Parameter)),
    examples: Schema.optional(Schema.Record(Schema.String, Common.Example)),
    requestBodies: Schema.optional(Schema.Record(Schema.String, RequestBody)),
    headers: Schema.optional(Schema.Record(Schema.String, Header)),
    securitySchemes: Schema.optional(Schema.Record(Schema.String, SecurityScheme)),
    links: Schema.optional(Schema.Record(Schema.String, Common.Link)),
    callbacks: Schema.optional(Schema.Record(Schema.String, CallbackFn))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Components" }))

  export const Document = Schema.Struct({
    ...Common.DocumentFields,
    paths: Paths,
    components: Schema.optional(Components)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Resolved.Document" }))
}
