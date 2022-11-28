import axios, { AxiosResponse } from "axios"
import * as t from "io-ts"
import { Schema, Validator, ValidatorResult } from "jsonschema"
import { config } from "../../config"
import { Scope, Attributes, AttributeLocalisation } from "../../../../shared/schemas"

const attributesManagementApiUrl = `${config.attributes_management_url}:${config.attributes_management_port}/attributes-management`

const fetchData = async (url: string): Promise<AxiosResponse> => axios.get(url)

export const getResponseAsSchema = ({ data }: AxiosResponse): Schema =>
  data as Schema

export const fetchFullAttributesSchema = async (): Promise<Schema> => {
  const response: AxiosResponse = await fetchData(`${attributesManagementApiUrl}/v1/schema`)
  return getResponseAsSchema(response)
}

export const fetchAttributeSchema = async (
  attribute_key: string
): Promise<Schema> => {
  const url = `${attributesManagementApiUrl}/v1/schema/${attribute_key}`
  const response: AxiosResponse = await fetchData(url)
  return getResponseAsSchema(response)
}

export const attributeIsValid = async (
  attributeKey: string,
  attributeValue: unknown
):Promise<boolean> => {
  const schemaValidator = new Validator()
  const schema:Schema = await fetchAttributeSchema(attributeKey)

  schemaValidator.addSchema(schema, "/")

  return schemaValidator.validate(attributeValue, schema).valid
}

export const validateAttributes = async (attributes: Attributes):Promise<ValidatorResult> => {
  const schemaValidator = new Validator()

  const schema:Schema = await fetchFullAttributesSchema()

  const attributesSchema = {
    ...schema?.definitions?.AuroraAIAttributes,
    definitions: schema?.definitions,
    minProperties: 1,
    additionalProperties: false
  }
  
  schemaValidator.addSchema(attributesSchema, "/")

  if (typeof attributesSchema === "undefined") {
    throw new Error("Invalid schema.")
  }

  return schemaValidator.validate(attributes, attributesSchema)
}

export const getValidAttributeNames = async ():Promise<t.KeyofType<{ [key: string]: unknown }>> => {
  const schema:Schema = await fetchFullAttributesSchema()

  const attributesSchema = schema?.definitions?.AuroraAIAttributes

  const properties = attributesSchema?.properties

  if (typeof properties === "undefined") {
    throw new Error("Invalid schema.")
  }

  return t.keyof(properties)
}

export const fetchValidAttributeScopes = async ():Promise<Scope[]> => {
  const url = `${attributesManagementApiUrl}/v1/scopes`
  const response = await fetchData(url)
  return response.data as Scope[]
}

export const fetchAttributeLocalisations = async (): Promise<Record<string, AttributeLocalisation>>=> {
  const response: AxiosResponse = await fetchData(`${attributesManagementApiUrl}/v1/localisation`)
  return response.data
}

export const fetchAttributeLocalisation = async (
  attribute_key: string
): Promise<AttributeLocalisation> => {
  const url = `${attributesManagementApiUrl}/v1/localisation/${attribute_key}`
  const response: AxiosResponse = await fetchData(url)
  return response.data
}