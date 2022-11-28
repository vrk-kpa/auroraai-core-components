import * as t from "io-ts"
import { UUID } from "io-ts-types/lib/UUID"

export const RemoveService = t.type({
  auroraAIServiceId: UUID,
})

export type RemoveService = t.TypeOf<typeof RemoveService>
