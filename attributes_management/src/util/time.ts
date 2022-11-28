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
