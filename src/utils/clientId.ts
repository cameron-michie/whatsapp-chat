/**
 * Utilities for parsing and formatting Ably clientId
 * Format: "FirstName_LastName.userId"
 */

export interface ParsedClientId {
  fullName: string;
  displayName: string; // Full name with spaces for display
  userId: string;
}

/**
 * Parse clientId in format "FirstName_LastName.userId" 
 * @param clientId - The clientId to parse
 * @returns Parsed components or null if invalid format
 */
export function parseClientId(clientId: string): ParsedClientId | null {
  const lastDotIndex = clientId.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return null;
  }

  const fullNameWithUnderscores = clientId.substring(0, lastDotIndex);
  const userId = clientId.substring(lastDotIndex + 1);
  
  if (!fullNameWithUnderscores || !userId) {
    return null;
  }

  const displayName = fullNameWithUnderscores.replace(/_/g, ' ');

  return {
    fullName: fullNameWithUnderscores,
    displayName,
    userId
  };
}

/**
 * Create clientId from fullName and userId
 * @param fullName - User's full name (spaces will be converted to underscores)
 * @param userId - User's unique ID
 * @returns Formatted clientId
 */
export function createClientId(fullName: string, userId: string): string {
  const normalizedName = fullName.replace(/\s+/g, '_');
  return `${normalizedName}.${userId}`;
}