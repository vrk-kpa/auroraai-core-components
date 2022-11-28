import * as t from "io-ts"

const NullOrUndefined = t.union([t.null, t.undefined])

export const Nullable = <T extends t.Mixed>(
  type: T
): t.UnionC<[T, typeof NullOrUndefined]> => t.union([type, NullOrUndefined])
