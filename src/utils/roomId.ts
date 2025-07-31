/**
 * Utilities for creating and parsing room IDs
 * Convention: {userId1}:{userId2} (alphabetically sorted)
 */

export interface DMRoomInfo {
  participants: string[];
  roomType: 'dm';
}

/**
 * Create a DM room ID from two user IDs
 * Always sorts alphabetically to ensure consistency
 * @param userId1 - First user ID
 * @param userId2 - Second user ID  
 * @returns Room ID in format "{sortedUserId1}:{sortedUserId2}"
 */
export function createDMRoomId(userId1: string, userId2: string): string {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required');
  }
  
  if (userId1 === userId2) {
    throw new Error('Cannot create DM room with same user');
  }
  
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}:${sortedIds[1]}`;
}

/**
 * Parse a DM room ID to extract participant information
 * @param roomId - Room ID to parse
 * @returns Parsed room info or null if invalid format
 */
export function parseDMRoomId(roomId: string): DMRoomInfo | null {
  // Parse room ID with colon separator: userId1:userId2
  if (!roomId || typeof roomId !== 'string' || !roomId.includes(':')) {
    return null;
  }
  
  // Split by colon separator
  const parts = roomId.split(':');
  if (parts.length !== 2) {
    return null;
  }
  
  const userId1 = parts[0];
  const userId2 = parts[1];
  
  if (!userId1 || !userId2) {
    return null;
  }
  
  return {
    participants: [userId1, userId2],
    roomType: 'dm'
  };
}

/**
 * Check if a room ID is a valid DM room
 * @param roomId - Room ID to check
 * @returns True if valid DM room ID
 */
export function isDMRoom(roomId: string): boolean {
  return parseDMRoomId(roomId) !== null;
}

/**
 * Get the other participant's user ID from a DM room
 * @param roomId - DM room ID
 * @param currentUserId - Current user's ID
 * @returns Other participant's user ID or null
 */
export function getOtherParticipant(roomId: string, currentUserId: string): string | null {
  const roomInfo = parseDMRoomId(roomId);
  if (!roomInfo) {
    return null;
  }
  
  return roomInfo.participants.find(id => id !== currentUserId) || null;
}

/**
 * Start a chat with another user (for UI components)
 * @param currentUserId - Current user's ID
 * @param targetUserId - Target user's ID to chat with
 * @param navigate - React Router navigate function
 */
export function startChatWithUser(
  currentUserId: string, 
  targetUserId: string, 
  navigate: (path: string) => void
): void {
  const roomId = createDMRoomId(currentUserId, targetUserId);
  navigate(`/room/${roomId}`);
}