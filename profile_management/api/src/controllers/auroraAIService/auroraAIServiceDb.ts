import {
  composeTranslatableSelect,
  RawTranslatableObject,
} from "../../util/helper"
import { UUID } from "io-ts-types/UUID"
import { ITask } from "pg-promise"
import { Scope, TranslatableString } from "../../../../shared/schemas"

export async function selectAuroraAIServicesByPTVServiceChannelIds(
  tx: ITask<unknown>,
  ptvServiceChannelIds: UUID[]
): Promise<{ auroraAIServiceId: UUID; ptvServiceChannelId: UUID }[]> {
  return tx.manyOrNone(
    `
    SELECT
      id AS "auroraAIServiceId",
      ptv_service_channel_id AS "ptvServiceChannelId"
    FROM aurora_ai_service
    WHERE ptv_service_channel_id IN ($/ptvServiceChannelIds:csv/)
  `,
    {
      ptvServiceChannelIds,
    }
  )
}

export async function selectReceivableSessionAttributesByAuroraAIServiceId(
  tx: ITask<unknown>,
  auroraAIServiceId: UUID
): Promise<string[]> {
  const { receivableAttributes } = await tx.one(
    `
    SELECT session_transfer_receivable_attributes AS "receivableAttributes"
    FROM aurora_ai_service
    WHERE id = ($/auroraAIServiceId/)
  `,
    {
      auroraAIServiceId,
    }
  )

  return receivableAttributes
}

export async function selectServiceInformationById(
  tx: ITask<unknown>,
  auroraAIServiceId: UUID
): Promise<
  RawTranslatableObject<
    ["provider", "name", "type", "location", "description", "link"]
  >
> {
  return tx.one(
    `
      SELECT
        ${composeTranslatableSelect("aurora_ai_service.provider")},
        ${composeTranslatableSelect("aurora_ai_service.name")},
        ${composeTranslatableSelect("aurora_ai_service.description")},
        ${composeTranslatableSelect("aurora_ai_service_type.type")},
        ${composeTranslatableSelect("aurora_ai_service_location.location")},
        ${composeTranslatableSelect("aurora_ai_service.link")}
      FROM
        aurora_ai_service
      INNER JOIN aurora_ai_service_type
        ON aurora_ai_service_type.id = aurora_ai_service.type
      INNER JOIN aurora_ai_service_location
        ON aurora_ai_service_location.code = aurora_ai_service.location
      WHERE
        aurora_ai_service.id = $/auroraAIServiceId/
    `,
    {
      auroraAIServiceId,
    }
  )
}

export async function selectServiceDataProviderUrl(
  tx: ITask<unknown>,
  auroraAIServiceId: UUID
): Promise<string | null> {
  const { dataProviderUrl } = await tx.oneOrNone(
    `
    SELECT data_provider_url as "dataProviderUrl"
    FROM aurora_ai_service
    WHERE id = $/auroraAIServiceId/
  `,
    {
      auroraAIServiceId,
    }
  )

  return dataProviderUrl
}

export async function selectServiceAllowedScopes(
  tx: ITask<unknown>,
  auroraAIServiceId: UUID
): Promise<Scope[] | null> {
  const { allowedScopes } = await tx.oneOrNone(
    `
    SELECT allowed_scopes as "allowedScopes"
    FROM aurora_ai_service
    WHERE id = $/auroraAIServiceId/
  `,
    {
      auroraAIServiceId,
    }
  )

  return allowedScopes
}

interface RawOauthClient extends RawTranslatableObject<["name"]> {
  id: UUID
  allowedScopes: string[]
  allowedRedirectUris: string[]
  defaultRedirectUri?: string
  oauthClientSecret?: string
}

export async function selectOauthClientByID(
  tx: ITask<unknown>,
  auroraAIServiceId: UUID
): Promise<RawOauthClient | null> {
  return tx.oneOrNone(
    `
        SELECT
          id as "id",
          allowed_scopes as "allowedScopes",
          allowed_redirect_uris as "allowedRedirectUris",
          default_redirect_uri as "defaultRedirectUri",
          oauth_client_secret as "oauthClientSecret",
          ${composeTranslatableSelect("name")}
        FROM aurora_ai_service
        WHERE id = ($/auroraAIServiceId/)
      `,
    {
      auroraAIServiceId,
    }
  )
}

export async function selectOauthClientByIDAndSecret(
  tx: ITask<unknown>,
  auroraAIServiceId: UUID,
  oauthClientSecret: string
): Promise<RawOauthClient | null> {
  return tx.oneOrNone(
    `
        SELECT
          id as "id",
          allowed_scopes as "allowedScopes",
          allowed_redirect_uris as "allowedRedirectUris",
          default_redirect_uri as "defaultRedirectUri",
          ${composeTranslatableSelect("name")}
        FROM aurora_ai_service
        WHERE id = ($/auroraAIServiceId/)
        AND oauth_client_secret = crypt($/oauthClientSecret/, oauth_client_secret)
      `,
    {
      auroraAIServiceId,
      oauthClientSecret,
    }
  )
}

export async function selectServiceNameByIds(
  tx: ITask<unknown>,
  auroraAIServiceIds: UUID[]
): Promise<(RawTranslatableObject<["name"]> & { id: UUID })[]> {
  return tx.manyOrNone(
    `
      SELECT
        id, ${composeTranslatableSelect("aurora_ai_service.name")}
      FROM
        aurora_ai_service
      WHERE
        id IN ($/auroraAIServiceIds:csv/)
    `,
    {
      auroraAIServiceIds,
    }
  )
}

export async function selectServiceNameAndLinkByIds(
  tx: ITask<unknown>,
  auroraAIServiceIds: UUID[]
): Promise<(RawTranslatableObject<["name", "link"]> & { id: UUID })[]> {
  return tx.manyOrNone(
    `
      SELECT
        id,
        ${composeTranslatableSelect("aurora_ai_service.name")},
        ${composeTranslatableSelect("aurora_ai_service.link")}
      FROM
        aurora_ai_service
      WHERE
        id IN ($/auroraAIServiceIds:csv/)
    `,
    {
      auroraAIServiceIds,
    }
  )
}

export async function selectAllowedScopes(
  tx: ITask<unknown>
): Promise<string[]> {
  return tx
    .manyOrNone(
      `
        SELECT DISTINCT unnest(allowed_scopes) as scope
        FROM aurora_ai_service
        ORDER BY scope
    `
    )
    .then((rows) => rows.map((row) => row.scope))
}

export async function insertService(
  tx: ITask<unknown>,
  serviceId: UUID,
  ptvServiceChannelId: UUID,
  sessionTransferReceivableAttributes: string[],
  provider: TranslatableString,
  name: TranslatableString,
  link: TranslatableString,
  allowedScopes: Scope[],
  allowedRedirectUris: string[],
  defaultRedirectUri: string,
  dataProviderUrl: string,
  description: TranslatableString,
  secret: string
): Promise<void> {
  await tx.none(
    `
      INSERT into aurora_ai_service (id, ptv_service_channel_id, 
                                    session_transfer_receivable_attributes, 
                                    provider, name, link, allowed_scopes,
                                    allowed_redirect_uris, default_redirect_uri,
                                    data_provider_url,
                                    description, oauth_client_secret) 
      VALUES 
      (
        $/serviceId/,
        $/ptvServiceChannelId/,
        $/sessionTransferReceivableAttributes/,
        ($(provider.fi), $(provider.sv), $(provider.en)),
        ($(name.fi), $(name.sv), $(name.en)),
        ($(link.fi), $(link.sv), $(link.en)),
        $/allowedScopes/,
        $/allowedRedirectUris/,
        $/defaultRedirectUri/,
        $/dataProviderUrl/,
        ($(description.fi), $(description.sv), $(description.en)),
        crypt($/secret/, gen_salt('bf'))
      )
    `,
    {
      serviceId,
      ptvServiceChannelId,
      sessionTransferReceivableAttributes:
        sessionTransferReceivableAttributes || [],
      provider: generateParam(provider),
      name: generateParam(name),
      link: generateParam(link),
      allowedScopes: allowedScopes || [],
      allowedRedirectUris: allowedRedirectUris || [],
      defaultRedirectUri,
      dataProviderUrl,
      description: generateParam(description),
      secret,
    }
  )
}

export async function updateServiceSecret(
  tx: ITask<unknown>,
  serviceId: UUID,
  secret: string
): Promise<{ id: UUID } | null> {
  return await tx.oneOrNone(
    `
      UPDATE aurora_ai_service 
      SET oauth_client_secret = crypt($/secret/, gen_salt('bf')) 
      WHERE id = $/serviceId/
      returning id
    `,
    {
      secret,
      serviceId,
    }
  )
}

const generateParam = (values?: TranslatableString | null) => ({
  fi: values?.fi || "",
  sv: values?.sv || "",
  en: values?.en || "",
})
