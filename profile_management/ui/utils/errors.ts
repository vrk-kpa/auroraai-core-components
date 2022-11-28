import { ApiErrorBody } from "shared/schemas/types/Errors"

export type APIError = ApiErrorBody & { httpStatus?: number }
