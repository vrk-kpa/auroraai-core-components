import { UUID } from "io-ts-types/lib/UUID"
import { filterRetrievableAttributes } from "shared/util/attributes"
import { db } from "../../db"
import { auroraAIServiceController } from "../auroraAIService/auroraAIService"
import {
  deleteAttributeSources,
  deleteAttributeSourcesByServiceId,
  insertAttributeSources,
  removePendingAttributeDeletion,
  selectPendingAttributeDeletions,
  selectAttributeSources,
  selectAllAttributeSources,
} from "./attributeDb"
import { attributeIsValid } from "../attributesManagement/attributesManagement"

export const attributeController = {
  addAttributeSources,
  removeAttributeSources,
  getAttributeSources,
  getAllAttributeSources,
  getAttributes,
  retryPendingAttributeDeletions,
  removeAttributeSourcesByServiceId,
}

async function addAttributeSources(
  username: UUID,
  auroraAIServiceId: UUID,
  attributes: string[]
): Promise<void> {
  await db.task((t) =>
    insertAttributeSources(t, username, auroraAIServiceId, attributes)
  )
}

async function removeAttributeSources(
  username: UUID,
  auroraAIServiceId: UUID,
  attributes: string[]
): Promise<void> {
  await db.task((t) =>
    deleteAttributeSources(t, username, auroraAIServiceId, attributes)
  )
}

async function removeAttributeSourcesByServiceId(
  username: UUID,
  auroraAIServiceId: UUID
): Promise<void> {
  await db.task((t) =>
    deleteAttributeSourcesByServiceId(t, username, auroraAIServiceId)
  )
}

async function retryPendingAttributeDeletions(): Promise<void> {
  const deletions = await db.task((t) => selectPendingAttributeDeletions(t))
  const deletionResults = await Promise.all(
    deletions.map(async (deletion) => {
      const deletionSuccess =
        await auroraAIServiceController.requestServiceToDeleteAttributes(
          deletion.username,
          deletion.auroraAIServiceId,
          false
        )

      const daysToRetry = 3
      const currentTime = new Date()
      const retryUntil = new Date(deletion.initiatedTime)
      retryUntil.setDate(retryUntil.getDate() + daysToRetry)
      return {
        ...deletion,
        retryMore: !deletionSuccess && currentTime < retryUntil,
      }
    })
  )

  const succeededOrExpiredItems = deletionResults.filter(
    (result) => !result.retryMore
  )

  if (succeededOrExpiredItems)
    await db.task((t) =>
      removePendingAttributeDeletion(t, succeededOrExpiredItems)
    )
}

async function getAttributeSources(
  username: UUID,
  attributes: string[]
): Promise<Record<string, UUID[] | null>> {
  const retrievableAttributes = filterRetrievableAttributes(attributes)
  if (retrievableAttributes.length === 0) {
    return {}
  }

  const sources = await db.task((t) =>
    selectAttributeSources(t, username, retrievableAttributes)
  )

  return Object.fromEntries(
    retrievableAttributes.map((attr) => [
      attr,
      sources
        .find((s) => s.attribute === attr)
        ?.auroraAIServiceIds.filter(Boolean) ?? null,
    ])
  )
}

async function getAllAttributeSources(
  username: UUID
): Promise<Record<string, UUID[] | null>> {
  const sources = await db.task((t) => selectAllAttributeSources(t, username))

  const attributeKeys = sources.map(({ attribute }) => attribute)

  return Object.fromEntries(
    attributeKeys.map((attr) => [
      attr,
      sources
        .find((s) => s.attribute === attr)
        ?.auroraAIServiceIds.filter(Boolean) ?? null,
    ])
  )
}

function groupAttributesByOptimalSource(
  attributeSources: Record<string, UUID[]>
) {
  const attributesBySource = new Map<UUID, string[]>()

  const sourceIds = Object.values(attributeSources).flat()
  const attributeSourceEntries = Object.entries(attributeSources)

  let missingAttributes = Object.keys(attributeSources)
  while (missingAttributes.length > 0) {
    const selectedSource = sourceIds.reduce<{
      source: UUID
      matches: [string, UUID[]][]
    } | null>((previousSource, currentSource) => {
      // counts how many attributes this source is capable of
      // producing, and reduces the one with the most matches

      const matches = attributeSourceEntries.filter(
        ([attributeName, sources]) =>
          missingAttributes.includes(attributeName) &&
          sources.includes(currentSource)
      )

      return !previousSource || matches.length > previousSource.matches.length
        ? { source: currentSource, matches }
        : previousSource
    }, null)

    if (!selectedSource || selectedSource.matches.length === 0) {
      // if there are no sources left or the left sources have
      // 0 matches it means we can't get any more of the requested
      // attributes
      break
    }

    const selectedSourceAttrs = selectedSource.matches.map(([attr]) => attr)
    attributesBySource.set(selectedSource.source, selectedSourceAttrs)
    missingAttributes = missingAttributes.filter(
      (attr) => !selectedSourceAttrs.includes(attr)
    )
  }

  return attributesBySource
}

/**
 * Fetches attribute values from sources (data providers).
 * Tries to optimize the amount of requests by picking the
 * source with the highest amount of supported attributes.
 * This process is repeated until all of the requested
 * attributes have an optimal source, at which point the
 * attribute values are fetched from the data provider.
 *
 * If the data provider returns an invalid response, or
 * if any of the data values do not actually exist, the
 * offending attributes go through the process above
 * again, until either all sources are exhausted or
 * all attribute values are known.
 */
async function getAttributes(
  attributeSources: Record<string, UUID[]>,
  username: UUID
): Promise<Record<string, unknown>> {
  const attributesBySource = groupAttributesByOptimalSource(attributeSources)

  const retryableAttributes: Record<string, UUID[]> = {}
  const foundAttributes: Record<string, unknown> = {}

  for (const [source, attributes] of attributesBySource) {
    const attributeValuesFromSource =
      await auroraAIServiceController.contactServiceForAttributes(
        source,
        attributes,
        username
      )

    if (!attributeValuesFromSource) {
      attributes.forEach((attr) => {
        // no attributes received, add all requested attributes
        // back to the retry pool but without this source
        retryableAttributes[attr] = attributeSources[attr].filter(
          (s) => s !== source
        )
      })
      continue
    }

    for (const attributeKey of attributes) {
      const attributeValue = attributeValuesFromSource[attributeKey] || null

      // if the attribute does not exist (undefined) or was null, it's invalid
      // and should be retried from another source
      if (!await attributeIsValid(attributeKey, attributeValue)) {
        retryableAttributes[attributeKey] = attributeSources[
          attributeKey
        ].filter((s) => s !== source)
      } else {
        foundAttributes[attributeKey] = attributeValue
      }
    }
  }

  const retriedAttributes =
    Object.keys(retryableAttributes).length > 0
      ? await getAttributes(retryableAttributes, username)
      : {}

  return {
    ...foundAttributes,
    ...retriedAttributes,
  }
}
