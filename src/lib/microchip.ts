import prisma from '@/lib/prisma'

/**
 * Generate unique microchip with format: TH{farmId}{timestamp}{random}
 * @param farmId - ID of the farm (shortened to 6 characters)
 * @returns Promise<string> - Unique microchip string
 */
export async function generateMicrochip(farmId: string): Promise<string> {
  const maxAttempts = 10
  let attempt = 0

  while (attempt < maxAttempts) {
    // Shorten farmId to first 6 characters (remove hyphens)
    const shortFarmId = farmId.replace(/-/g, '').substring(0, 6).toUpperCase()

    // Get current timestamp (last 8 digits)
    const timestamp = Date.now().toString().slice(-8)

    // Generate 4-digit random number
    const random = Math.floor(1000 + Math.random() * 9000).toString()

    // Create microchip: TH + farmId(6) + timestamp(8) + random(4) = 20 characters
    const microchip = `TH${shortFarmId}${timestamp}${random}`

    try {
      // Check if microchip already exists
      const existing = await prisma.animal.findFirst({
        where: { microchip },
      })

      if (!existing) {
        return microchip
      }

      // If exists, try again
      attempt++
    } catch (error) {
      console.error('Error checking microchip uniqueness:', error)
      throw new Error('Failed to generate unique microchip')
    }
  }

  throw new Error(
    `Failed to generate unique microchip after ${maxAttempts} attempts`,
  )
}

/**
 * Validate microchip format
 * @param microchip - Microchip string to validate
 * @returns boolean - True if valid format
 */
export function validateMicrochipFormat(microchip: string): boolean {
  // Format: TH + 6 chars + 8 digits + 4 digits = 20 characters total
  const microchipRegex = /^TH[A-Z0-9]{6}\d{8}\d{4}$/
  return microchipRegex.test(microchip)
}

/**
 * Parse microchip to extract components
 * @param microchip - Microchip string to parse
 * @returns Object with parsed components or null if invalid
 */
export function parseMicrochip(microchip: string): {
  farmId: string
  timestamp: string
  random: string
  generatedAt: Date
} | null {
  if (!validateMicrochipFormat(microchip)) {
    return null
  }

  // Extract components: TH[farmId:6][timestamp:8][random:4]
  const farmId = microchip.substring(2, 8)
  const timestamp = microchip.substring(8, 16)
  const random = microchip.substring(16, 20)

  // Convert timestamp back to date
  const timestampMs = parseInt(timestamp)
  const generatedAt = new Date(timestampMs)

  return {
    farmId,
    timestamp,
    random,
    generatedAt,
  }
}

/**
 * Check if microchip is already used in the system
 * @param microchip - Microchip to check
 * @returns Promise<boolean> - True if microchip exists
 */
export async function isMicrochipUsed(microchip: string): Promise<boolean> {
  try {
    const existing = await prisma.animal.findFirst({
      where: { microchip },
    })
    return !!existing
  } catch (error) {
    console.error('Error checking microchip usage:', error)
    throw new Error('Failed to check microchip usage')
  }
}

/**
 * Generate multiple unique microchips (useful for batch operations)
 * @param farmId - ID of the farm
 * @param count - Number of microchips to generate
 * @returns Promise<string[]> - Array of unique microchips
 */
export async function generateMultipleMicrochips(
  farmId: string,
  count: number,
): Promise<string[]> {
  if (count <= 0 || count > 100) {
    throw new Error('Count must be between 1 and 100')
  }

  const microchips: string[] = []

  for (let i = 0; i < count; i++) {
    const microchip = await generateMicrochip(farmId)
    microchips.push(microchip)

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  return microchips
}
