import React from 'react';

import { Avatar, type AvatarData } from '../atoms/avatar.tsx';
import { Button } from '../atoms/button.tsx';
import { Icon } from '../atoms/icon.tsx';

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
}

/**
 * Format participant names for display (exclude current user, format names)
 */
function formatParticipantNames(participants: string, _currentUserId: string, currentUserName?: string): string {
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
function formatMessagePreview(
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
  onLeave,
  avatar: propAvatar,
  isCollapsed = false,
  typingIndicatorsEnabled = true,
  userId,
  userFullName,
}: RoomListItemProps) {
  // Use room data instead of Chat SDK hooks for display-only sidebar
  const displayName = roomData 
    ? formatParticipantNames(roomData.participants, userId || '', userFullName)
    : roomName;
    
  const messagePreview = roomData 
    ? formatMessagePreview(roomData.latestMessagePreview, roomData.latestMessageSender, userFullName)
    : '';
    
  const unreadCount = roomData?.unreadMessageCount || 0;
  const timestamp = roomData?.latestMessageTimestamp;

  // Create avatar data from room data or use defaults
  const roomAvatarData = propAvatar || {
    displayName: displayName,
    src: roomData?.displayMacroUrl || undefined,
    initials: displayName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase(),
    color: `bg-${['blue', 'green', 'purple', 'pink', 'indigo'][Math.abs(roomName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 5]}-500`
  };

  // For display-only sidebar, we don't show real-time presence
  // This can be enhanced later if needed
  const isActive = unreadCount > 0; // Show as active if there are unread messages

  // If collapsed, render just the avatar with selection indicator
  if (isCollapsed) {
    return (
      <div className="flex justify-center p-2">
        <div
          className={`relative cursor-pointer transition-transform hover:scale-110 ${
            isSelected ? 'ring-2 ring-blue-500 rounded-full' : ''
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
          {isSelected && (
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

        {/* Present indicator */}
        {isActive && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
            aria-hidden="true"
            title="Room is active"
          />
        )}

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div
            className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium"
            aria-hidden="true"
            title={`${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
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
            {/* Leave button - only visible on hover */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLeave();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1"
              aria-label={`Leave ${displayName || 'room'}`}
              title={`Leave ${displayName || 'room'}`}
            >
              <Icon name="close" size="sm" />
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
    </div>
  );
});
