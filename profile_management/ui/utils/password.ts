export const getPasswordExpiresInDays = (date: string): number => {
  return date !== "n/a"
    ? Math.max(
        0,
        Math.ceil(
          (new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        )
      )
    : 360
}

export const isExpiringSoon = (daysToExpire: number): boolean => {
  return daysToExpire >= 0 && daysToExpire <= 15
}

export const isExpired = (daysToExpire: number): boolean => {
  return daysToExpire < 1
}
