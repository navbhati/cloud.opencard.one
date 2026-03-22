import { toZonedTime, format as formatTz } from "date-fns-tz";

export const COMMON_TIMEZONES = [
  "UTC",
  // Americas
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Santiago",
  "America/Bogota",
  "America/Lima",
  // Pacific
  "Pacific/Honolulu",
  "Pacific/Auckland",
  // Europe
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Moscow",
  "Europe/Istanbul",
  // Asia
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Jakarta",
  "Asia/Manila",
  // Australia
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Brisbane",
  // Africa
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
] as const;

/**
 * Get the user's current timezone from the browser.
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Check if a string is a valid IANA timezone.
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get timezone options list that always includes the user's timezone.
 */
export function getTimezoneOptions(
  ...additionalTimezones: (string | undefined | null)[]
): string[] {
  const userTimezone = getUserTimezone();
  const timezones = new Set<string>(COMMON_TIMEZONES);
  timezones.add(userTimezone);

  for (const tz of additionalTimezones) {
    if (tz && isValidTimezone(tz)) {
      timezones.add(tz);
    }
  }

  return Array.from(timezones).sort((a, b) => {
    if (a === "UTC") return -1;
    if (b === "UTC") return 1;
    return a.localeCompare(b);
  });
}

/**
 * Format a timezone for display, e.g. "America/New_York" -> "America/New York (EST)"
 */
export function formatTimezoneDisplay(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzAbbr =
      parts.find((p) => p.type === "timeZoneName")?.value || "";
    const displayName = timezone.replace(/_/g, " ");
    return tzAbbr ? `${displayName} (${tzAbbr})` : displayName;
  } catch {
    return timezone;
  }
}

/**
 * Format an ISO date string in a specific timezone.
 */
export function formatInTimezone(
  isoString: string,
  formatStr: string,
  timezone: string,
): string {
  try {
    const date = new Date(isoString);
    const zonedDate = toZonedTime(date, timezone);
    return formatTz(zonedDate, formatStr, { timeZone: timezone });
  } catch {
    return new Date(isoString).toLocaleString();
  }
}

export { toZonedTime, formatTz };
