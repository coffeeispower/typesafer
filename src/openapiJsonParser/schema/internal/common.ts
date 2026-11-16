import { Schema } from "effect"

export namespace Common {
  export const JsonValue = Schema.Unknown.pipe(Schema.annotate({ identifier: "OpenAPI.Common.JsonValue" }))
  export const UriReference = Schema.String.pipe(Schema.annotate({ identifier: "OpenAPI.Common.UriReference" }))
  export const OptionalString = Schema.optional(Schema.String).pipe(
    Schema.annotate({ identifier: "OpenAPI.Common.OptionalString" })
  )
  export const OptionalBoolean = Schema.optional(Schema.Boolean).pipe(
    Schema.annotate({ identifier: "OpenAPI.Common.OptionalBoolean" })
  )

  export const ExternalDocumentation = Schema.Struct({ description: OptionalString, url: UriReference }).pipe(
    Schema.annotate({ identifier: "OpenAPI.Common.ExternalDocumentation" })
  )
  const Contact = Schema.Struct({
    name: OptionalString,
    url: Schema.optional(UriReference),
    email: Schema.optional(Schema.String)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.Contact" }))
  const License = Schema.Struct({
    name: Schema.String,
    url: Schema.optional(UriReference),
    identifier: Schema.optional(Schema.String)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.License" }))
  export const Info = Schema.Struct({
    title: Schema.String,
    description: OptionalString,
    termsOfService: Schema.optional(UriReference),
    contact: Schema.optional(Contact),
    license: Schema.optional(License),
    version: Schema.String
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.Info" }))
  const ServerVariable = Schema.Struct({
    enum: Schema.optional(Schema.Array(Schema.String)),
    default: Schema.String,
    description: OptionalString
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.ServerVariable" }))
  export const Server = Schema.Struct({
    url: Schema.String,
    description: OptionalString,
    variables: Schema.optional(Schema.Record(Schema.String, ServerVariable))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.Server" }))
  export const Example = Schema.Struct({
    summary: OptionalString,
    description: OptionalString,
    value: Schema.optional(JsonValue),
    externalValue: Schema.optional(UriReference)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.Example" }))
  export const Link = Schema.Struct({
    operationId: OptionalString,
    operationRef: Schema.optional(UriReference),
    parameters: Schema.optional(Schema.Record(Schema.String, JsonValue)),
    requestBody: Schema.optional(JsonValue),
    description: OptionalString,
    server: Schema.optional(Server)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.Link" }))
  export const SecurityRequirement = Schema.Record(Schema.String, Schema.Array(Schema.String)).pipe(
    Schema.annotate({ identifier: "OpenAPI.Common.SecurityRequirement" })
  )
  export const Discriminator = Schema.Struct({
    propertyName: Schema.String,
    mapping: Schema.optional(Schema.Record(Schema.String, Schema.String))
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.Discriminator" }))
  export const XML = Schema.Struct({
    name: OptionalString,
    namespace: Schema.optional(UriReference),
    prefix: OptionalString,
    attribute: OptionalBoolean,
    wrapped: OptionalBoolean
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.XML" }))

  export const SchemaFields = {
    title: OptionalString,
    multipleOf: Schema.optional(Schema.Number),
    maximum: Schema.optional(Schema.Number),
    exclusiveMaximum: OptionalBoolean,
    minimum: Schema.optional(Schema.Number),
    contentEncoding: Schema.optional(Schema.NonEmptyString),
    exclusiveMinimum: OptionalBoolean,
    maxLength: Schema.optional(Schema.Int),
    minLength: Schema.optional(Schema.Int),
    pattern: OptionalString,
    maxItems: Schema.optional(Schema.Int),
    minItems: Schema.optional(Schema.Int),
    uniqueItems: OptionalBoolean,
    maxProperties: Schema.optional(Schema.Int),
    minProperties: Schema.optional(Schema.Int),
    required: Schema.optional(Schema.Array(Schema.String)),
    enum: Schema.optional(Schema.Array(JsonValue)),
    type: Schema.optional(
      Schema.Literals(["array", "boolean", "integer", "number", "object", "string", "null"]).pipe((t) =>
        Schema.Union([t, Schema.Array(t)])
      )
    ),
    description: OptionalString,
    format: OptionalString,
    default: Schema.optional(JsonValue),
    nullable: OptionalBoolean,
    discriminator: Schema.optional(Discriminator),
    readOnly: OptionalBoolean,
    writeOnly: OptionalBoolean,
    example: Schema.optional(JsonValue),
    externalDocs: Schema.optional(ExternalDocumentation),
    deprecated: OptionalBoolean,
    xml: Schema.optional(XML)
  }
  export type SchemaCommonFieldsType = Schema.Struct<typeof Common.SchemaFields>["Type"]

  export const ParameterFields = {
    name: Schema.String,
    in: Schema.String,
    description: OptionalString,
    required: OptionalBoolean,
    deprecated: OptionalBoolean,
    allowEmptyValue: OptionalBoolean,
    style: Schema.optional(Schema.String),
    explode: OptionalBoolean,
    allowReserved: OptionalBoolean,
    example: Schema.optional(JsonValue)
  }

  export const HeaderFields = {
    description: OptionalString,
    required: OptionalBoolean,
    deprecated: OptionalBoolean,
    allowEmptyValue: OptionalBoolean,
    style: Schema.optional(Schema.Literal("simple")),
    explode: OptionalBoolean,
    allowReserved: OptionalBoolean,
    example: Schema.optional(JsonValue)
  }

  export const MediaTypeFields = {
    example: Schema.optional(JsonValue)
  }

  export const RequestBodyFields = {
    description: OptionalString,
    required: OptionalBoolean
  }

  export const OperationFields = {
    tags: Schema.optional(Schema.Array(Schema.String)),
    summary: OptionalString,
    description: OptionalString,
    externalDocs: Schema.optional(ExternalDocumentation),
    operationId: OptionalString,
    deprecated: OptionalBoolean,
    security: Schema.optional(Schema.Array(SecurityRequirement)),
    servers: Schema.optional(Schema.Array(Server))
  }

  export const Tag = Schema.Struct({
    name: Schema.String,
    description: OptionalString,
    externalDocs: Schema.optional(ExternalDocumentation)
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.Tag" }))

  export const OpenApiVersion = Schema.String.pipe(
    Schema.check(Schema.isPattern(/^3\.\d\.\d(?:-.+)?$/)),
    Schema.annotate({ identifier: "OpenAPI.Common.OpenApiVersion" })
  )
  export const DocumentFields = {
    openapi: OpenApiVersion,
    info: Info,
    externalDocs: Schema.optional(ExternalDocumentation),
    servers: Schema.optional(Schema.Array(Server)),
    security: Schema.optional(Schema.Array(SecurityRequirement)),
    tags: Schema.optional(Schema.Array(Tag))
  }
  export const PathItemFields = {
    summary: OptionalString,
    description: OptionalString,
    servers: Schema.optional(Schema.Array(Server))
  }
  export const EncodingFields = {
    contentType: OptionalString,
    style: Schema.optional(Schema.Literals(["form", "spaceDelimited", "pipeDelimited", "deepObject"])),
    explode: OptionalBoolean,
    allowReserved: OptionalBoolean
  }
  export const ResponseFields = {
    description: Schema.String
  }

  export type ParameterCommonFieldsType = Schema.Struct<typeof ParameterFields>["Type"]
  export type HeaderCommonFieldsType = Schema.Struct<typeof HeaderFields>["Type"]
  export type MediaTypeCommonFieldsType = Schema.Struct<typeof MediaTypeFields>["Type"]
  export type RequestBodyCommonFieldsType = Schema.Struct<typeof RequestBodyFields>["Type"]
  export type OperationCommonFieldsType = Schema.Struct<typeof OperationFields>["Type"]
  export type DocumentCommonFieldsType = Schema.Struct<typeof DocumentFields>["Type"]
  export type PathItemCommonFieldsType = Schema.Struct<typeof PathItemFields>["Type"]
  export type EncodingCommonFieldsType = Schema.Struct<typeof EncodingFields>["Type"]
  export type ResponseCommonFieldsType = Schema.Struct<typeof ResponseFields>["Type"]

  export const OAuthScope = Schema.Record(Schema.String, Schema.String).pipe(
    Schema.annotate({ identifier: "OpenAPI.Common.OAuthScope" })
  )
  export const OAuthFlows = Schema.Struct({
    implicit: Schema.optional(
      Schema.Struct({ authorizationUrl: UriReference, refreshUrl: Schema.optional(UriReference), scopes: OAuthScope })
    ),
    password: Schema.optional(
      Schema.Struct({ tokenUrl: UriReference, refreshUrl: Schema.optional(UriReference), scopes: OAuthScope })
    ),
    clientCredentials: Schema.optional(
      Schema.Struct({ tokenUrl: UriReference, refreshUrl: Schema.optional(UriReference), scopes: OAuthScope })
    ),
    authorizationCode: Schema.optional(
      Schema.Struct({
        authorizationUrl: UriReference,
        tokenUrl: UriReference,
        refreshUrl: Schema.optional(UriReference),
        scopes: OAuthScope
      })
    )
  }).pipe(Schema.annotate({ identifier: "OpenAPI.Common.OAuthFlows" }))

  export const SecurityScheme = Schema.Union([
    Schema.Struct({
      type: Schema.Literal("apiKey"),
      name: Schema.String,
      in: Schema.Literals(["header", "query", "cookie"]),
      description: OptionalString
    }),
    Schema.Struct({
      type: Schema.Literal("http"),
      scheme: Schema.String,
      bearerFormat: OptionalString,
      description: OptionalString
    }),
    Schema.Struct({ type: Schema.Literal("oauth2"), flows: OAuthFlows, description: OptionalString }),
    Schema.Struct({
      type: Schema.Literal("openIdConnect"),
      openIdConnectUrl: UriReference,
      description: OptionalString
    })
  ]).pipe(Schema.annotate({ identifier: "OpenAPI.Common.SecurityScheme" }))
}
