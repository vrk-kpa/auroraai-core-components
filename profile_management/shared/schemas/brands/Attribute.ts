import * as t from "io-ts"
import { Validator } from "jsonschema"
import attributesSchema from "../../../../schemas/attributes.json"
import municipalityCodeSchema from "../../../../schemas/municipality_code.json"

const testMunicipalityCodes = ['000']
const testEnvironments = ['local', 'dev', 'qa']
const env = process.env.ENVIRONMENT || '';

if(testEnvironments.includes(env)) {
  municipalityCodeSchema.enum = [...testMunicipalityCodes, ...municipalityCodeSchema.enum]
}

const schemaValidator = new Validator()

schemaValidator.addSchema(municipalityCodeSchema)
schemaValidator.addSchema(attributesSchema)

export const Attributes = t.record(t.string, t.unknown)
export type Attributes = Record<string, unknown>

export type AttributeLocalisation = {
  name: Record<string, string>,
  description: Record<string, string>
  properties?: AttributeLocalisation
}