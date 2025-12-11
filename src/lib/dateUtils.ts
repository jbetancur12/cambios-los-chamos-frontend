export const VENEZUELA_TIMEZONE_OFFSET = -5 // UTC-5

/**
 * Creates a date object that represents the start of the day in UTC-5,
 * but returns it as an ISO string in UTC.
 *
 * Example: Input '2025-12-10' (10th Dec)
 * Target: 10th Dec 00:00:00 UTC-5
 * Result: 2025-12-10T05:00:00.000Z
 */
export const getStartOfDayISO = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number)

  // Create a UTC date for the target day at 00:00:00
  // Then add 5 hours to shift it to "UTC-5 00:00:00" expressed as UTC
  // Wait, if I want 00:00 in UTC-5, that is 05:00 in UTC.

  const date = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0))
  return date.toISOString()
}

/**
 * Creates a date object that represents the end of the day in UTC-5,
 * but returns it as an ISO string in UTC.
 *
 * Example: Input '2025-12-10'
 * Target: 10th Dec 23:59:59.999 UTC-5
 * Result: 11th Dec 04:59:59.999 UTC
 */
export const getEndOfDayISO = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number)

  // Create a UTC date for the target day at 23:59:59.999
  // UTC-5 23:59:59 is next day 04:59:59 UTC

  const date = new Date(Date.UTC(year, month - 1, day, 23 + 5, 59, 59, 999))
  return date.toISOString()
}

/**
 * Helpers for today/yesterday/etc using the fixed timezone
 */
export const getTodayString = (): string => {
  // Get current time in UTC
  const now = new Date()

  // Adjust to UTC-5 to get the "local" date string
  // If it's 03:00 UTC (next day), minus 5 hours = 22:00 (prev day)
  const venezuelaTime = new Date(now.getTime() + VENEZUELA_TIMEZONE_OFFSET * 60 * 60 * 1000)

  return venezuelaTime.toISOString().split('T')[0]
}
