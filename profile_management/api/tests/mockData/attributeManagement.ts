import {mockAgeSchema} from './mockAgeSchema'
import {mockLifeSituationMetersSchema} from './mockLifeSituationMetersSchema'
import {mockTampereDemoFlagSchema} from './mockTampereDemoFlagSchema'
import {mockMunicipalityCodeSchema} from './mockMunicipalityCodeSchema'

export {mockAgeSchema} from './mockAgeSchema'
export {mockLifeSituationMetersSchema} from './mockLifeSituationMetersSchema'
export {mockTampereDemoFlagSchema} from './mockTampereDemoFlagSchema'
export {mockMunicipalityCodeSchema} from './mockMunicipalityCodeSchema'
export {mockScopes} from './mockScopes'
export {mockLocalisation} from './mockLocalisation'

export const mockAttributeSchema = {
  description: "Kuvaus AuroraAI-attribuuteista",
  "@id": "http://uri.suomi.fi/datamodel/ns/aurora-att#",
  title: "AuroraAI-attribuutit",
  modified: "Tue, 06 Sep 2022 08:43:05 GMT",
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  definitions: {
    AuroraAIAttributes: {
      title: "AuroraAI-attribuutit",
      type: "object",
      "@id": "http://uri.suomi.fi/datamodel/ns/aurora-att#AuroraAIAttributes",
      description:
        "Attribuutti, jota AuroraAI-suosittelijamoottori hyödyntää palvelusuositusten muodostamiseksi. Näitä ovat esimerkiksi 3x10d-elämäntilanneluokat.",
      properties: {
        age: mockAgeSchema,
        life_situation_meters: {
          "@id":
            "http://uri.suomi.fi/datamodel/ns/aurora-att#life_situation_meters",
          title: "life_situation_meters",
          "@type": "@id",
          type: "object",
          "$ref": "/#/definitions/LifeSituationMeters"
        },
        municipality_code: mockMunicipalityCodeSchema,
        tampere_demo_flag: mockTampereDemoFlagSchema,
      },
    },
    LifeSituationMeters: mockLifeSituationMetersSchema,
    langString: {
      type: "object",
      title: "Multilingual string",
      description: "Object type for localized strings",
      additionalProperties: { type: "string" },
    },
  },
}
