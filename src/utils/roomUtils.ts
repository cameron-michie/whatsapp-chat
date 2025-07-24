/**
 * Utility functions for room management
 */

/**
 * Create a short hash from sorted user IDs for room identification
 */
export function createRoomId(userIds: string[]): string {
  // Sort user IDs to ensure consistent room IDs regardless of order
  const sortedIds = [...userIds].sort();
  const combined = sortedIds.join('|');
  
  // Simple hash function to create shorter IDs
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to positive number and encode as base36 for shorter representation
  const roomId = Math.abs(hash).toString(36);
  return `room-${roomId}`;
}

/**
 * Format participant names for display (exclude current user, format names)
 * If participants field is incomplete, extract from room ID as fallback
 */
export function formatParticipantNames(participants: string, currentUserId: string, currentUserName?: string, roomId?: string): string {
  if (!participants) return 'Unknown';
  
  // Debug logging
  console.log('formatParticipantNames input:', { participants, currentUserId, currentUserName, roomId });
  
  const participantList = participants.split(',').filter(p => p.trim() !== '');
  console.log('participantList after split:', participantList);
  
  // Filter out any room IDs that might have been included accidentally
  // Be more specific about what we consider room IDs
  const cleanParticipantList = participantList.filter(participant => {
    const trimmedParticipant = participant.trim();
    // Only skip if it's clearly a room ID hash (very long alphanumeric strings)
    const isRoomIdHash = trimmedParticipant.length > 25 && /^[a-z0-9]+$/.test(trimmedParticipant);
    const isRoomIdFormat = trimmedParticipant.startsWith('room-') && trimmedParticipant.includes('__');
    
    const shouldSkip = isRoomIdHash || isRoomIdFormat;
    console.log(`Participant "${trimmedParticipant}": isRoomIdHash=${isRoomIdHash}, isRoomIdFormat=${isRoomIdFormat}, shouldSkip=${shouldSkip}`);
    
    return !shouldSkip;
  });
  
  console.log('cleanParticipantList after filtering:', cleanParticipantList);
  
  // Remove current user from the list (match by user ID)
  const otherParticipants = cleanParticipantList.filter(participant => {
    // First try to match by actual user ID
    const isCurrentUserById = participant === currentUserId;
    
    // Also try matching by formatted name (fallback for legacy data)
    let isCurrentUserByName = false;
    if (currentUserName) {
      const formattedCurrentName = currentUserName.replace(/\s+/g, '_');
      const participantWithoutPrefix = participant.startsWith('user_') 
        ? participant.substring(5) 
        : participant;
      isCurrentUserByName = participant === formattedCurrentName || participantWithoutPrefix === formattedCurrentName;
    }
    
    const isCurrentUser = isCurrentUserById || isCurrentUserByName;
    console.log(`Checking if "${participant}" is current user: currentUserId="${currentUserId}", isCurrentUserById=${isCurrentUserById}, isCurrentUserByName=${isCurrentUserByName}, isCurrentUser=${isCurrentUser}`);
    
    return !isCurrentUser;
  });
  
  console.log('otherParticipants after filtering current user:', otherParticipants);
  
  // If no other participants found and we have a room ID, try to extract from room ID
  if (otherParticipants.length === 0 && roomId) {
    console.log('No participants found, trying to extract from room ID:', roomId);
    const roomInfo = parseDMRoomId(roomId);
    if (roomInfo) {
      const otherUserId = roomInfo.participants.find(id => id !== currentUserId);
      if (otherUserId) {
        console.log('Found other user ID from room:', otherUserId);
        return formatSingleName(otherUserId);
      }
    }
  }
  
  if (otherParticipants.length === 0) {
    console.log('No other participants found, returning "Unknown"');
    return 'Unknown';
  }
  
  // For single participant (DM), show full name
  if (otherParticipants.length === 1) {
    const formatted = formatSingleName(otherParticipants[0]);
    console.log('Single participant formatted:', formatted);
    return formatted;
  }
  
  // For group chat, show first names only
  const firstNames = otherParticipants.map(participant => {
    // Remove user_ prefix if it exists
    const cleanParticipant = participant.startsWith('user_') 
      ? participant.substring(5) 
      : participant;
    const [firstName] = cleanParticipant.split('_');
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  });
  
  const result = firstNames.join(', ');
  console.log('Group chat formatted result:', result);
  return result;
}

/**
 * Format a single participant name from "firstname_lastname" to "Firstname Lastname"
 * Also handles userIds that start with "user_" prefix and Clerk user IDs
 */
function formatSingleName(participant: string): string {
  // Remove "user_" prefix if it exists to avoid "user, Cameron" format
  const cleanParticipant = participant.startsWith('user_') 
    ? participant.substring(5) // Remove "user_" prefix
    : participant;
  
  // If it looks like a Clerk user ID (long alphanumeric string), we can't format it nicely
  // This should ideally be replaced with actual user names from your user database
  if (cleanParticipant.length > 20 && /^[a-zA-Z0-9]+$/.test(cleanParticipant)) {
    // For now, return a generic name - in production you'd want to look up the actual name
    return 'User';
  }
    
  const parts = cleanParticipant.split('_');
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Format message preview with sender name
 */
export function formatMessagePreview(
  latestMessagePreview: string, 
  latestMessageSender: string, 
  currentUserName?: string
): string {
  if (!latestMessagePreview) return 'No messages yet';
  
  // Determine sender display name
  let senderName = 'Someone';
  if (latestMessageSender) {
    if (currentUserName && latestMessageSender.replace(/\s+/g, '_') === currentUserName.replace(/\s+/g, '_')) {
      senderName = 'You';
    } else {
      // Remove user_ prefix if it exists
      const cleanSender = latestMessageSender.startsWith('user_') 
        ? latestMessageSender.substring(5) 
        : latestMessageSender;
      const [firstName] = cleanSender.split('_');
      senderName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
  }
  
  // Truncate long messages
  const maxLength = 40;
  const truncatedMessage = latestMessagePreview.length > maxLength 
    ? latestMessagePreview.substring(0, maxLength) + '...'
    : latestMessagePreview;
  
  return `${senderName}: ${truncatedMessage}`;
}