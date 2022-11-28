import { config } from "../config"

export const getTimestamp = (): string => new Date().toISOString()

export const startTimer = (): [number, number] => process.hrtime()

/**
 * Get duration in milliseconds
 */
export const endTimer = (start: [number, number]): number => {
  const diff = process.hrtime(start)

  return (diff[0] * 1e9 + diff[1]) / 1e6
}

export const getShortDate = (date: Date): string =>
  `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`

export const calcPasswordValidUntil = (date: Date): string => {
  const passwordValidDays = Number(config.user_pwd_expiry_days)
  date.setDate(date.getDate() + passwordValidDays)
  return getShortDate(date)
}

export const isIsoDate = (date: string): boolean => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(date)) return false
  return new Date(date).toISOString() === date
}
