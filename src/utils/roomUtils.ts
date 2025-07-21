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
 */
export function formatParticipantNames(participants: string, currentUserId: string, currentUserName?: string): string {
  if (!participants) return 'Unknown';
  
  const participantList = participants.split(',').filter(p => p.trim() !== '');
  
  // Remove current user from the list (match by name since we don't store userIds in participants)
  const otherParticipants = participantList.filter(participant => {
    if (currentUserName) {
      const formattedCurrentName = currentUserName.replace(/\s+/g, '_');
      return participant !== formattedCurrentName;
    }
    return true;
  });
  
  if (otherParticipants.length === 0) return 'You';
  
  // For single participant (DM), show full name
  if (otherParticipants.length === 1) {
    return formatSingleName(otherParticipants[0]);
  }
  
  // For group chat, show first names only
  const firstNames = otherParticipants.map(participant => {
    const [firstName] = participant.split('_');
    return firstName;
  });
  
  return firstNames.join(', ');
}

/**
 * Format a single participant name from "firstname_lastname" to "Firstname Lastname"
 */
function formatSingleName(participant: string): string {
  const parts = participant.split('_');
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
      const [firstName] = latestMessageSender.split('_');
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