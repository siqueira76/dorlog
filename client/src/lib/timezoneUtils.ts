/**
 * Timezone detection and formatting utilities
 * Handles automatic timezone detection for user location awareness
 */

export interface TimezoneInfo {
  timezone: string;
  timezoneOffset: number;
  timezoneAutoDetected: boolean;
}

/**
 * Detects the user's current timezone using browser APIs
 * @returns TimezoneInfo object with timezone string (IANA format), offset in minutes, and detection flag
 */
export function detectUserTimezone(): TimezoneInfo {
  try {
    // Get timezone using Intl API (IANA format: "America/Sao_Paulo")
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get timezone offset in minutes (negative for west of UTC, positive for east)
    // Brazil (BRT): -180 minutes = UTC-3
    const timezoneOffset = new Date().getTimezoneOffset();
    
    console.log('🌍 Timezone detectado:', {
      timezone,
      timezoneOffset,
      offsetHours: -timezoneOffset / 60,
      example: `UTC${timezoneOffset > 0 ? '-' : '+'}${Math.abs(timezoneOffset / 60)}`
    });
    
    return {
      timezone,
      timezoneOffset,
      timezoneAutoDetected: true
    };
  } catch (error) {
    console.error('❌ Erro ao detectar timezone:', error);
    // Fallback to Brazil timezone
    return {
      timezone: 'America/Sao_Paulo',
      timezoneOffset: -180,
      timezoneAutoDetected: false
    };
  }
}

/**
 * Formats a date according to user's timezone
 * @param date - Date to format
 * @param timezone - IANA timezone string (e.g., "America/Sao_Paulo")
 * @param format - Format options
 * @returns Formatted date string
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string = 'America/Sao_Paulo',
  format: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      ...format,
      timeZone: timezone
    }).format(dateObj);
  } catch (error) {
    console.error('❌ Erro ao formatar data com timezone:', error);
    // Fallback to local format
    return new Intl.DateTimeFormat('pt-BR', format).format(dateObj);
  }
}

/**
 * Checks if user's timezone has changed (e.g., traveling)
 * @param storedTimezone - Previously stored timezone
 * @returns true if timezone has changed
 */
export function hasTimezoneChanged(storedTimezone?: string): boolean {
  if (!storedTimezone) return false;
  
  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const changed = currentTimezone !== storedTimezone;
  
  if (changed) {
    console.log('⚠️ Mudança de timezone detectada:', {
      previous: storedTimezone,
      current: currentTimezone
    });
  }
  
  return changed;
}

/**
 * Gets user-friendly timezone name
 * @param timezone - IANA timezone string
 * @returns Human-readable timezone name
 */
export function getTimezoneName(timezone: string): string {
  const timezoneNames: Record<string, string> = {
    'America/Sao_Paulo': 'Horário de Brasília (BRT)',
    'America/New_York': 'Horário da Costa Leste (EST/EDT)',
    'America/Los_Angeles': 'Horário da Costa Oeste (PST/PDT)',
    'Europe/Lisbon': 'Horário de Lisboa (WET/WEST)',
    'Europe/London': 'Horário de Londres (GMT/BST)',
    'Asia/Tokyo': 'Horário de Tóquio (JST)',
  };
  
  return timezoneNames[timezone] || timezone;
}

/**
 * Converts a time string to user's timezone
 * @param timeString - Time in format "HH:mm" (e.g., "08:00")
 * @param sourceTimezone - Source timezone (default: UTC)
 * @param targetTimezone - Target timezone (user's timezone)
 * @returns Converted time string
 */
export function convertTimeToTimezone(
  timeString: string,
  sourceTimezone: string = 'UTC',
  targetTimezone: string = 'America/Sao_Paulo'
): string {
  try {
    // Create date with time in source timezone
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Format in target timezone
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: targetTimezone,
      hour12: false
    }).format(date);
  } catch (error) {
    console.error('❌ Erro ao converter horário:', error);
    return timeString;
  }
}
