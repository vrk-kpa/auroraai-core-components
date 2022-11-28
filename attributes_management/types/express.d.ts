declare namespace Express {
  export interface Request {
    attributesSchema?: import("./AttributesSchema").AttributesSchema
    attributesDatamodel?: import("./AttributesDatamodel").AttributesDatamodel
    attributesLocalisation?: Record<string, any>
  }
}
