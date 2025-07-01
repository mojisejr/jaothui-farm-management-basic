import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format Thai phone number to international format (+66)
 * @param phone - Thai phone number (e.g., "0812345678" or "+66812345678")
 * @returns Formatted phone number with +66 prefix
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or other formatting
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // If already has +66 prefix, return as is
  if (cleaned.startsWith('+66')) {
    return cleaned
  }

  // If starts with 0, replace with +66
  if (cleaned.startsWith('0')) {
    return `+66${cleaned.substring(1)}`
  }

  // If starts with 66, add +
  if (cleaned.startsWith('66')) {
    return `+${cleaned}`
  }

  // Assume it's a local number and add +66
  return `+66${cleaned}`
}

/**
 * Format phone number for display (Thai format)
 * @param phone - Phone number with or without country code
 * @returns Formatted phone number for display (e.g., "081-234-5678")
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '')

  // Remove country code if present
  let localNumber = cleaned
  if (cleaned.startsWith('66')) {
    localNumber = '0' + cleaned.substring(2)
  }

  // Format as XXX-XXX-XXXX
  if (localNumber.length === 10 && localNumber.startsWith('0')) {
    return `${localNumber.substring(0, 3)}-${localNumber.substring(3, 6)}-${localNumber.substring(6)}`
  }

  return phone // Return original if can't format
}

/**
 * Validate Thai phone number
 * @param phone - Phone number to validate
 * @returns True if valid Thai phone number
 */
export function isValidThaiPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // Check for +66 format
  if (cleaned.startsWith('+66')) {
    const localPart = cleaned.substring(3)
    return /^[0-9]{8,9}$/.test(localPart)
  }

  // Check for 0 format
  if (cleaned.startsWith('0')) {
    return /^0[0-9]{8,9}$/.test(cleaned)
  }

  return false
}

/**
 * Capitalize first letter of each word
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format date for Thai locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateThai(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('th-TH', options).format(dateObj)
}

/**
 * Generate initials from name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Initials (e.g., "JD" for "John Doe")
 */
export function generateInitials(
  firstName?: string,
  lastName?: string,
): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || '?'
}

/**
 * Sleep utility for async operations
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
