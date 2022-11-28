import { UUID } from "io-ts-types/UUID"
import { ITask } from "pg-promise"
import { TokenPair } from "./oauth"

export async function insertAuthorizationCode(
  tx: ITask<unknown>,
  code: Buffer,
  username: UUID,
  auroraAIServiceId: UUID,
  redirectUri: string | null,
  scopes: string[],
  authTime: Date
): Promise<void> {
  await tx.none(
    `
      INSERT INTO oauth_authorization_code (code, username, aurora_ai_service_id, redirect_uri, scopes, auth_time)
      VALUES ($/code/, $/username/, $/auroraAIServiceId/, $/redirectUri/, $/scopes/, $/authTime/)
    `,
    {
      code,
      username,
      auroraAIServiceId,
      redirectUri,
      scopes,
      authTime,
    }
  )
}

export async function selectAuthorizationByCode(
  tx: ITask<unknown>,
  code: Buffer
): Promise<{
  username: UUID
  auroraAIServiceId: UUID
  redirectUri: string | null
  scopes: string[]
  authTime: Date
} | null> {
  return await tx.oneOrNone(
    `
      SELECT username, aurora_ai_service_id as "auroraAIServiceId", redirect_uri as "redirectUri", scopes, auth_time as "authTime"
      FROM oauth_authorization_code
      WHERE code = $/code/
      AND expiration_time >= NOW()
    `,
    {
      code,
    }
  )
}

export async function insertTokenPair(
  tx: ITask<unknown>,
  refreshToken: Buffer,
  accessToken: Buffer,
  username: UUID,
  auroraAIServiceId: UUID,
  refreshTokenScopes: string[],
  accessTokenScopes: string[],
  authTime: Date
): Promise<void> {
  await tx.none(
    `
      INSERT INTO oauth_token_pair
        (refresh_token, access_token, username, aurora_ai_service_id, refresh_token_scopes, access_token_scopes, auth_time)
      VALUES
        ($/refreshToken/, $/accessToken/, $/username/, $/auroraAIServiceId/, $/refreshTokenScopes/, $/accessTokenScopes/, $/authTime/)
    `,
    {
      refreshToken,
      accessToken,
      username,
      auroraAIServiceId,
      refreshTokenScopes,
      accessTokenScopes,
      authTime,
    }
  )
}

export async function restoreTokenPairs(
  tx: ITask<unknown>,
  tokens: TokenPair[]
): Promise<void> {
  await tx.batch(
    tokens.map((token) =>
      tx.none(
        `
          INSERT INTO oauth_token_pair
            (refresh_token, access_token, username, aurora_ai_service_id, 
             refresh_token_scopes, access_token_scopes, auth_time, created_at,
             refresh_expiration_time, access_expiration_time)
          VALUES
            ($/refreshToken/, $/accessToken/, $/username/, $/auroraAIServiceId/,
            $/refreshTokenScopes/, $/accessTokenScopes/, $/authTime/, $/createdAt/, 
            $/refreshExpirationTime/, $/accessExpirationTime/)
          ON CONFLICT DO NOTHING
        `,
        {
          refreshToken: token.refreshToken,
          accessToken: token.accessToken,
          username: token.username,
          auroraAIServiceId: token.auroraAIServiceId,
          refreshTokenScopes: token.refreshTokenScopes,
          accessTokenScopes: token.accessTokenScopes,
          authTime: token.authTime,
          createdAt: token.createdAt,
          refreshExpirationTime: token.refreshExpirationTime,
          accessExpirationTime: token.accessExpirationTime,
        }
      )
    )
  )
}

export async function selectRefreshToken(
  tx: ITask<unknown>,
  refreshToken: Buffer
): Promise<{
  token: Buffer
  username: UUID
  auroraAIServiceId: UUID
  expirationTime: Date
  scopes: string[]
  authTime: Date
} | null> {
  return await tx.oneOrNone(
    `
      SELECT 
             refresh_token as "token", 
             username, 
             aurora_ai_service_id as "auroraAIServiceId", 
             refresh_expiration_time as "expirationTime", 
             refresh_token_scopes as scopes, 
             auth_time as "authTime"
      FROM oauth_token_pair
      WHERE refresh_token = $/refreshToken/
        AND refresh_expiration_time >= NOW()
    `,
    {
      refreshToken,
    }
  )
}

export async function selectRefreshTokenByAnyToken(
  tx: ITask<unknown>,
  token: Buffer
): Promise<{
  refreshToken: Buffer
  auroraAIServiceId: UUID
  username: UUID
} | null> {
  return await tx.oneOrNone(
    `
      SELECT refresh_token as "refreshToken", aurora_ai_service_id as "auroraAIServiceId", username
      FROM oauth_token_pair
      WHERE (access_token = $/token/ OR refresh_token = $/token/)
    `,
    {
      token,
    }
  )
}

export async function selectUserTokensByServiceId(
  tx: ITask<unknown>,
  username: UUID,
  auroraAIServiceId: UUID
): Promise<TokenPair[] | null> {
  return await tx.manyOrNone(
    `
      SELECT refresh_token as "refreshToken", access_token as "accessToken", 
        created_at as "createdAt", auth_time as "authTime", 
        refresh_expiration_time as "refreshExpirationTime", 
        access_expiration_time as "accessExpirationTime", username, 
        aurora_ai_service_id as "auroraAIServiceId", 
        refresh_token_scopes as "refreshTokenScopes",
        access_token_scopes as "accessTokenScopes"
      FROM oauth_token_pair
      WHERE (username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/)
    `,
    {
      username,
      auroraAIServiceId,
    }
  )
}

export async function selectAccessToken(
  tx: ITask<unknown>,
  accessToken: Buffer
): Promise<{
  username: UUID
  auroraAIServiceId: UUID
  scopes: string[]
} | null> {
  return await tx.oneOrNone(
    `
      SELECT username, aurora_ai_service_id as "auroraAIServiceId", access_token_scopes as scopes
      FROM oauth_token_pair
      WHERE access_token = $/accessToken/
      AND access_expiration_time >= NOW()
    `,
    {
      accessToken,
    }
  )
}

export async function updateExpirationTimesToNow(
  tx: ITask<unknown>,
  refreshToken: Buffer
): Promise<void> {
  await tx.none(
    `
      UPDATE oauth_token_pair 
      SET access_expiration_time = NOW(), refresh_expiration_time = NOW()
      WHERE refresh_token = $/refreshToken/
    `,
    { refreshToken }
  )
}

export async function deleteExpiredAuthorizationCodes(
  tx: ITask<unknown>
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_authorization_code
      WHERE expiration_time < NOW()
    `
  )
}

export async function deleteAuthorizationCode(
  tx: ITask<unknown>,
  code: Buffer
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_authorization_code
      WHERE code = $/code/
    `,
    {
      code,
    }
  )
}

export async function deleteAuthorizationCodes(
  tx: ITask<unknown>,
  username: UUID,
  auroraAIServiceId: UUID
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_authorization_code
      WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/
    `,
    {
      username,
      auroraAIServiceId,
    }
  )
}

export async function deleteAllAuthorizationCodes(
  tx: ITask<unknown>,
  username: UUID
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_authorization_code
      WHERE username = $/username/
    `,
    {
      username,
    }
  )
}

export async function deleteExpiredTokenPairs(
  tx: ITask<unknown>
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_token_pair
      WHERE refresh_expiration_time < NOW()
    `
  )
}

export async function deleteTokenPairByRefreshToken(
  tx: ITask<unknown>,
  refreshToken: Buffer
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_token_pair
      WHERE refresh_token = $/refreshToken/
    `,
    {
      refreshToken,
    }
  )
}

export async function deleteTokenPairsByUserAndService(
  tx: ITask<unknown>,
  username: UUID,
  auroraAIServiceId: UUID
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_token_pair
      WHERE username = $/username/ AND aurora_ai_service_id = $/auroraAIServiceId/
    `,
    {
      username,
      auroraAIServiceId,
    }
  )
}

export async function deleteTokenPairsByUser(
  tx: ITask<unknown>,
  username: UUID
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_token_pair
      WHERE username = $/username/
    `,
    {
      username,
    }
  )
}

export async function deleteTokenPairByAccessToken(
  tx: ITask<unknown>,
  accessToken: Buffer
): Promise<void> {
  await tx.none(
    `
      DELETE FROM oauth_token_pair
      WHERE access_token = $/accessToken/
    `,
    {
      accessToken,
    }
  )
}

export async function selectServicesWithRefreshTokensByUsername(
  tx: ITask<unknown>,
  username: string
): Promise<
  {
    id: UUID
    attributes: string[]
  }[]
> {
  return tx.manyOrNone(
    `
    SELECT
      aurora_ai_service_id AS "id",
      uniq(array_concat_agg(refresh_token_scopes)) as "attributes"
    FROM oauth_token_pair
    WHERE username = $/username/ AND refresh_expiration_time >= NOW()
    GROUP BY aurora_ai_service_id
  `,
    {
      username,
    }
  )
}

export async function selectServicesWithAccessTokensByUsername(
  tx: ITask<unknown>,
  username: string
): Promise<
  {
    id: UUID
    attributes: string[]
  }[]
> {
  return tx.manyOrNone(
    `
    SELECT
      aurora_ai_service_id AS "id",
      uniq(array_concat_agg(access_token_scopes)) as "attributes"
    FROM oauth_token_pair
    WHERE username = $/username/ AND access_expiration_time >= NOW()
    GROUP BY aurora_ai_service_id
  `,
    {
      username,
    }
  )
}

export async function selectServicesWithAuthorizationCodesByUsername(
  tx: ITask<unknown>,
  username: string
): Promise<
  {
    id: UUID
    attributes: string[]
  }[]
> {
  return tx.manyOrNone(
    `
    SELECT
      aurora_ai_service_id AS "id",
      uniq(array_concat_agg(scopes)) as "attributes"
    FROM oauth_authorization_code
    WHERE username = $/username/ AND expiration_time >= NOW()
    GROUP BY aurora_ai_service_id
  `,
    {
      username,
    }
  )
}

export async function selectRefreshTokenScopesForUserService(
  tx: ITask<unknown>,
  username: string,
  auroraAIServiceId: string,
  maxAge?: number
): Promise<string[]> {
  const byRefreshToken = await tx.oneOrNone<{ attributes: string[] }>(
    `
    SELECT uniq(array_concat_agg(refresh_token_scopes)) as "attributes"
    FROM oauth_token_pair
    WHERE
      username = $/username/
      AND refresh_expiration_time >= NOW()
      AND aurora_ai_service_id = $/auroraAIServiceId/
      ${typeof maxAge === "number" ? "AND NOW() - created_at < $/maxAge/" : ""}
  `,
    {
      username,
      auroraAIServiceId,
      maxAge,
    }
  )

  return byRefreshToken?.attributes ?? []
}

export async function selectAccessTokenScopesForUserService(
  tx: ITask<unknown>,
  username: string,
  auroraAIServiceId: string,
  maxAge?: number
): Promise<string[]> {
  const byAccessToken = await tx.oneOrNone<{ attributes: string[] }>(
    `
    SELECT uniq(array_concat_agg(access_token_scopes)) as "attributes"
    FROM oauth_token_pair
    WHERE
      username = $/username/
      AND access_expiration_time >= NOW()
      AND aurora_ai_service_id = $/auroraAIServiceId/
      ${typeof maxAge === "number" ? "AND NOW() - created_at < $/maxAge/" : ""}
  `,
    {
      username,
      auroraAIServiceId,
      maxAge,
    }
  )

  return byAccessToken?.attributes ?? []
}
