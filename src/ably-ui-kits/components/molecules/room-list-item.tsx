import React from 'react';

import { Avatar, type AvatarData } from '../atoms/avatar.tsx';
import { Button } from '../atoms/button.tsx';
import { Icon } from '../atoms/icon.tsx';
import { parseDMRoomId } from '../../../utils/roomId.ts';
import { useProfile } from '../../../contexts/ProfileContext.tsx';
import { OtherUserProfileModal } from '../../../components/OtherUserProfileModal.tsx';

/**
 * Room data structure
 */
export interface RoomData {
  chatRoomType: 'DM' | 'topic' | 'groupDM';
  lastMessageSeenCursor: string;
  latestMessagePreview: string;
  latestMessageSender: string;
  latestMessageTimestamp: string;
  displayMacroUrl: string;
  participants: string;
  unreadMessageCount: number;
  // Profile-based enhancements
  displayName?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

/**
 * Format participant names for display (exclude current user, format names)
 * If participants field is incomplete, extract from room ID as fallback
 */
function formatParticipantNames(participants: string, _currentUserId: string, currentUserName?: string, roomId?: string): string {
  if (!participants) return 'Unknown';

  const participantList = participants.split(',').filter(p => p.trim() !== '');

  // Filter out any room IDs that might have been included accidentally
  // Be more specific about what we consider room IDs
  const cleanParticipantList = participantList.filter(participant => {
    const trimmedParticipant = participant.trim();
    // Only skip if it's clearly a room ID hash (very long alphanumeric strings)
    const isRoomIdHash = trimmedParticipant.length > 25 && /^[a-z0-9]+$/.test(trimmedParticipant);
    const isRoomIdFormat = trimmedParticipant.startsWith('room-') && trimmedParticipant.includes('__');

    const shouldSkip = isRoomIdHash || isRoomIdFormat;

    return !shouldSkip;
  });

  // Remove current user from the list (match by user ID)
  const otherParticipants = cleanParticipantList.filter(participant => {
    // First try to match by actual user ID
    const isCurrentUserById = participant === _currentUserId;

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

    return !isCurrentUser;
  });

  // If no other participants found and we have a room ID, try to extract from room ID
  if (otherParticipants.length === 0 && roomId) {
    const roomInfo = parseDMRoomId(roomId);
    if (roomInfo) {
      const otherUserId = roomInfo.participants.find(id => id !== _currentUserId);
      if (otherUserId) {
        return formatSingleName(otherUserId);
      }
    }
  }

  if (otherParticipants.length === 0) return 'Unknown';

  // For single participant (DM), show full name
  if (otherParticipants.length === 1) {
    return formatSingleName(otherParticipants[0]);
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

  return firstNames.join(', ');
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
  // This indicates we need to fetch the actual profile data
  if (cleanParticipant.length > 20 && /^[a-zA-Z0-9]+$/.test(cleanParticipant)) {
    // Return the user ID with user_ prefix so the useEffect above can detect it
    // This will trigger profile fetching in the component
    return `user_${cleanParticipant}`;
  }

  const parts = cleanParticipant.split('_');
  return parts.map(part =>
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Format message preview with sender name
 */
// function formatMessagePreview(
//   latestMessagePreview: string,
//   latestMessageSender: string,
//   currentUserName?: string
// ): string {
//   if (!latestMessagePreview) return 'No messages yet';

//   // Determine sender display name
//   let senderName = 'Someone';
//   if (latestMessageSender) {
//     if (currentUserName && latestMessageSender.replace(/\s+/g, '_') === currentUserName.replace(/\s+/g, '_')) {
//       senderName = 'You';
//     } else {
//       // Remove user_ prefix if it exists
//       const cleanSender = latestMessageSender.startsWith('user_')
//         ? latestMessageSender.substring(5)
//         : latestMessageSender;
//       const [firstName] = cleanSender.split('_');
//       senderName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
//     }
//   }

//   // Truncate long messages
//   const maxLength = 40;
//   const truncatedMessage = latestMessagePreview.length > maxLength
//     ? latestMessagePreview.substring(0, maxLength) + '...'
//     : latestMessagePreview;

//   return `${senderName}: ${truncatedMessage}`;
// }

/**
 * Props for the RoomListItem component
 */
export interface RoomListItemProps {
  /**
   * Unique identifier for the room.
   * Used for room identification and avatar generation when no custom avatar is provided.
   */
  roomName: string;

  /**
   * Room data containing message information and metadata.
   */
  roomData?: RoomData;

  /**
   * Whether this room is currently selected/active in the UI.
   * Controls visual highlighting and selection indicators.
   * When true, shows selection styling and active indicators.
   */
  isSelected: boolean;

  /**
   * Callback function triggered when the room item is clicked.
   * Should handle room navigation and selection logic.
   * Called for clicks on the main room area (not action buttons).
   */
  onClick: () => void;

  /**
   * Callback function triggered when the leave button is clicked.
   * Should handle room departure logic and UI updates.
   * Called only when the leave button is explicitly clicked.
   */
  onLeave: () => void;

  /**
   * Optional custom avatar data for the room.
   * If not provided, uses the useRoomAvatar hook to generate/retrieve avatar data.
   * Allows for custom room branding and visual identity.
   */
  avatar?: AvatarData;

  /**
   * Whether the component should render in collapsed mode (avatar only).
   * When true, displays only the room avatar with a selection indicator.
   * When false, shows full room information including name, counts, and actions.
   * @default false
   */
  isCollapsed?: boolean;

  /**
   * Whether typing indicators should be displayed for this room.
   * Controls the visibility of real-time typing status below the room name.
   * @default true
   */
  typingIndicatorsEnabled?: boolean;

  /**
   * Current user ID for formatting participant names
   */
  userId?: string;

  /**
   * Current user's full name for message formatting
   */
  userFullName?: string;

  /**
   * The participant user ID for DM rooms (passed from room-list.tsx)
   */
  participantUserId?: string;
}

/**
 * RoomListItem component displays a room entry in the sidebar with activity indicators and controls
 *
 * Core Features:
 * - Room avatar with automatic fallback to generated avatars via useRoomAvatar hook
 * - Activity indicators (presence count, activity status)
 * - Room selection with visual feedback and hover states
 * - Typing indicators showing who is currently typing (when enabled)
 * - Leave room functionality with hover-revealed action button
 * - Collapsed mode for compact sidebar display (avatar-only)
 * - Connection count display for total room occupancy (connections)
 * - Accessible design with proper ARIA attributes and keyboard navigation
 * - Theme-aware styling supporting both light and dark modes
 *
 * @example
 * // Basic usage in sidebar room list
 * <RoomListItem
 *   roomName="general"
 *   isSelected={currentRoom === "general"}
 *   onClick={() => setCurrentRoom("general")}
 *   onLeave={() => leaveRoom("general")}
 * />
 *
 * @example
 * // With custom avatar and collapsed mode
 * <RoomListItem
 *   roomName="design-team"
 *   isSelected={false}
 *   onClick={handleRoomSelect}
 *   onLeave={handleRoomLeave}
 *   avatar={{
 *     displayName: "Design Team",
 *     src: "/team-avatars/design.jpg",
 *     color: "bg-purple-500"
 *   }}
 *   isCollapsed={sidebarCollapsed}
 *   typingIndicatorsEnabled={true}
 * />
 *
 *
 */
export const RoomListItem = React.memo(function RoomListItem({
  roomName,
  roomData,
  isSelected,
  onClick,
  onLeave: _onLeave,
  // avatar: propAvatar,
  isCollapsed = false,
  // typingIndicatorsEnabled = true,
  userId,
  userFullName,
  participantUserId,
}: RoomListItemProps) {
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  // Use participantUserId directly if provided, otherwise parse from roomName
  const otherUser = React.useMemo(() => {
    if (participantUserId) return participantUserId;
    if (!roomName.includes('-dm') || !userId) return null;
    const parsed = parseDMRoomId(roomName);
    const otherId = parsed?.participants.find(p => p !== userId);
    return otherId || null;
  }, [participantUserId, roomName, userId]);

  const { getUserName, getUserAvatar, fetchProfile, getProfile } = useProfile();

  // Get profile data directly from useProfile hook
  const profileName = otherUser ? getUserName(otherUser) : null;
  const profileAvatarUrl = otherUser ? getUserAvatar(otherUser) : null;

  // Fetch profile if not cached and we have an otherUser
  React.useEffect(() => {
    if (otherUser && !getProfile(otherUser)) {
      console.log(`[RoomListItem] Fetching profile for user: ${otherUser}`);
      fetchProfile(otherUser);
    }
  }, [otherUser, fetchProfile, getProfile]);

  // Additional check: if display name shows as "user_..." format, ensure we fetch the profile
  React.useEffect(() => {
    const currentDisplayName = profileName || roomData?.displayName ||
      (roomData ? formatParticipantNames(roomData.participants, userId || '', userFullName, roomName) : roomName);

    // Check if the display name is showing as user_... format (indicating we need profile data)
    if (currentDisplayName.startsWith('user_') ||
      (currentDisplayName.match(/^User$/i) && otherUser)) {
      console.log(`[RoomListItem] Display name shows as "${currentDisplayName}", needs profile data`);

      // Extract user ID from the display name if it starts with user_
      let targetUserId = otherUser;
      if (currentDisplayName.startsWith('user_')) {
        targetUserId = currentDisplayName.substring(5); // Remove "user_" prefix
      }

      if (targetUserId && !getProfile(targetUserId)) {
        console.log(`[RoomListItem] Fetching profile for: ${targetUserId}`);
        fetchProfile(targetUserId);
      }
    }
  }, [profileName, roomData?.displayName, roomData?.participants, userId, userFullName, roomName, otherUser, fetchProfile, getProfile]);

  // Simplified display name logic - use profile first, then fallback
  const displayName = profileName || roomData?.displayName ||
    (roomData ? formatParticipantNames(roomData.participants, userId || '', userFullName, roomName) : roomName);


  // Message preview is already formatted in RoomsList.tsx, just use it directly
  const messagePreview = roomData?.latestMessagePreview || 'No messages yet';

  const unreadCount = roomData?.unreadMessageCount || 0;
  const timestamp = roomData?.latestMessageTimestamp;

  // Create avatar data with profile priority: propAvatar > profile > roomData > fallback
  const roomAvatarData = {
    displayName: displayName,
    src: profileAvatarUrl || roomData?.avatarUrl || roomData?.displayMacroUrl || undefined,
    initials: displayName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase(),
    color: `bg-${['blue', 'green', 'purple', 'pink', 'indigo'][Math.abs(roomName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 5]}-500`
  };

  // Enhanced presence indicators: online status or unread messages
  const isOnline = roomData?.isOnline || false;
  // const hasUnreadMessages = unreadCount > 0;
  // const isActive = isOnline || hasUnreadMessages; // Show as active if online OR has unread messages

  // If collapsed, render just the avatar with selection indicator
  if (isCollapsed) {
    return (
      <div className="flex justify-center p-2">
        <div
          className={`relative cursor-pointer transition-transform hover:scale-110 ${isSelected ? 'ring-2 ring-blue-500 rounded-full' : ''
            }`}
          onClick={onClick}
          title={displayName}
          role="button"
          aria-label={`${displayName} room${isSelected ? ' (selected)' : ''}`}
          aria-pressed={isSelected}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }}
        >
          <Avatar
            alt={roomAvatarData?.displayName}
            src={roomAvatarData?.src}
            color={roomAvatarData?.color}
            size="md"
            initials={roomAvatarData?.initials}
          />
          {/* Show different indicators based on status */}
          {isSelected && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
          )}
          {/* Online indicator (green dot) when not selected but user is online */}
          {!isSelected && isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          )}
        </div>
      </div>
    );
  }

  // Otherwise render the full room list item
  return (
    <div
      className={`group flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800
                    cursor-pointer transition-colors
                    ${isSelected ? 'bg-gray-100 dark:bg-gray-800 border-r-2 border-blue-500' : ''}`}
      onClick={onClick}
      role="button"
      aria-label={`${displayName} room${isSelected ? ' (selected)' : ''}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative">
        <Avatar
          alt={roomAvatarData?.displayName}
          src={roomAvatarData?.src}
          color={roomAvatarData?.color}
          size="md"
          initials={roomAvatarData?.initials}
        />

        {/* Online indicator (green dot) */}
        {isOnline && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
            title="Online"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Timestamp */}
            {timestamp && (
              <span className="text-xs text-gray-400">
                {new Date(parseInt(timestamp)).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center leading-tight">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {/* Profile button - only visible on hover */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (otherUser) {
                  setShowProfileModal(true);
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500 p-1"
              aria-label={`View profile for ${displayName || 'room'}`}
              title={`View profile for ${displayName || 'room'}`}
            >
              <Icon name="info" size="sm" />
            </Button>
          </div>
        </div>
        {/* Message preview */}
        {messagePreview && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
            {messagePreview}
          </p>
        )}
        {/* Typing indicators disabled in display-only mode */}
        <div aria-live="polite">
          {/* {typingIndicatorsEnabled && <TypingIndicators maxClients={1} />} */}
        </div>
      </div>

      {/* Profile Modal */}
      {otherUser && (
        <OtherUserProfileModal
          userId={otherUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          roomId={roomName}
        />
      )}
    </div>
  );
});
