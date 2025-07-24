/**
 * Utilities for creating and parsing room IDs
 * Convention: room-{userId1}-{userId2}-dm (alphabetically sorted)
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
 * @returns Room ID in format "room-{sortedUserId1}__{sortedUserId2}-dm"
 */
export function createDMRoomId(userId1: string, userId2: string): string {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required');
  }
  
  if (userId1 === userId2) {
    throw new Error('Cannot create DM room with same user');
  }
  
  const sortedIds = [userId1, userId2].sort();
  // Use double underscore as separator to avoid conflicts with user IDs containing single dashes
  return `room-${sortedIds[0]}__${sortedIds[1]}-dm`;
}

/**
 * Parse a DM room ID to extract participant information
 * @param roomId - Room ID to parse
 * @returns Parsed room info or null if invalid format
 */
export function parseDMRoomId(roomId: string): DMRoomInfo | null {
  // Parse room ID with double underscore separator: room-userId1__userId2-dm
  if (!roomId || typeof roomId !== 'string' || !roomId.startsWith('room-') || !roomId.endsWith('-dm')) {
    return null;
  }
  
  // Remove 'room-' prefix and '-dm' suffix
  const middlePart = roomId.slice(5, -3); // 'room-'.length = 5, '-dm'.length = 3
  
  // Split by double underscore separator
  const parts = middlePart.split('__');
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