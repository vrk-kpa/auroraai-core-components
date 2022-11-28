import * as t from "io-ts"
import { UUID } from "io-ts-types/lib/UUID"

export const OauthDeactivate = t.type({
  auroraAIServiceId: UUID,
})

export type OauthDeactivate = t.TypeOf<typeof OauthDeactivate>
