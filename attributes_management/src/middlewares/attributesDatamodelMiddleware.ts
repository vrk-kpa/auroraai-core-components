import { NextFunction, Request, Response } from "express"
import axios from "axios"
import { config } from "../config"
import NodeCache from "node-cache"
import { NodeObject } from "jsonld"
import { InternalServerError } from "../util/errors/ApiErrors"
import { AttributesDatamodel } from "../../types/AttributesDatamodel"
import { pipe } from "fp-ts/function"
import { fold } from "fp-ts/Either"
import {UnkownRecord} from "../../types/UnknownRecord";

const cache = new NodeCache({ stdTTL: 3600 })
const jsonLdCacheKey = "attributesJsonLd"
const localisationCacheKey = "attributesLocalisations"

export const clearCache = (): void => {
  cache.del(jsonLdCacheKey)
  cache.del(localisationCacheKey)
}

export const attributesDatamodelMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  req.attributesDatamodel = cache.get(jsonLdCacheKey) as
    | AttributesDatamodel
    | undefined
  req.attributesLocalisation = cache.get(localisationCacheKey) as UnkownRecord

  try {
    if (typeof req.attributesDatamodel === "undefined") {
      req.attributesDatamodel = await updateAttributesDatamodelCache()
    }

    if (typeof req.attributesLocalisation === "undefined") {
      req.attributesLocalisation = await updateAttributesLocalisationCache(
        req.attributesDatamodel
      )
    }
  } catch (e) {
    return next(e)
  }

  next()
}

const updateAttributesDatamodelCache = async () => {
  const url = `${config.datamodel_api_url}?${config.json_ld_query}`
  const response = await axios.get(url)

  const model = validateDatamodel(response.data)

  cache.set(jsonLdCacheKey, model)
  return model
}

const validateDatamodel = (model: never): AttributesDatamodel =>
  pipe(
    AttributesDatamodel.decode(model),
    fold(
      () => {
        throw new InternalServerError("Got invalid datamodel from Y-alusta")
      },
      () => model as AttributesDatamodel
    )
  )

const updateAttributesLocalisationCache = (datamodel: UnkownRecord) => {
  const resolvedGraph = resolvePropertyPointers(
    datamodel?.["@graph"] as NodeObject[]
  )
  const auroraAttributesNode = resolvedGraph?.find(
    (it) => it?.["@id"] == "aurora-att:AuroraAIAttributes"
  ) as NodeObject

  const locales = getLocalesFromNodeProperties(
    auroraAttributesNode,
    resolvedGraph
  )

  cache.set(localisationCacheKey, locales)
  return locales
}

const resolvePropertyPointers = (nodes: NodeObject[]): NodeObject[] =>
  nodes.map((node) => {
    const clone = { ...node }

    if (clone?.property) {
      clone.property = nodes.filter((it) =>
        (clone.property as string[]).includes(it["@id"] as string ?? "")
      )
    }
    return clone
  })

type LocalisationData = UnkownRecord | UnkownRecord[] | undefined

const getLocalesFromNodeProperties = (
  rootNode: NodeObject,
  nodeList?: NodeObject[]
): UnkownRecord =>
  (rootNode?.property as NodeObject[]).reduce((result, node) => {
    const localName = (node?.localName ?? node?.["@id"] ?? "") as string

    // If this node is a reference to another node then resolve the reference
    const targetNode = node.node
      ? (nodeList?.find((it) => it?.["@id"] == node.node) as NodeObject)
      : node

    // Recursively get the localisations for all nodes in property array
    const properties = targetNode.property
      ? getLocalesFromNodeProperties(targetNode, nodeList)
      : undefined

    return {
      ...result,
      [localName]:
        {
          name: simplifyLocalisation(targetNode.name as LocalisationData),
          description: simplifyLocalisation(
            targetNode.description as LocalisationData
          ),
          properties,
        } ?? {},
    }
  }, {})

const simplifyLocalisation = (localisation: LocalisationData) => {
  if (typeof localisation === "undefined") {
    return undefined
  }

  if (!Array.isArray(localisation)) {
    return simplifyLocalisationEntry(localisation)
  }

  return localisation.reduce(
    (result, entry) => ({
      ...result,
      ...simplifyLocalisationEntry(entry),
    }),
    {}
  )
}

const simplifyLocalisationEntry = (entry: UnkownRecord) => {
  if (!("@language" in entry)) {
    return {}
  }

  return {
    [entry["@language"] as string]: entry["@value"],
  }
}
