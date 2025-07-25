import type { RoomOptions } from '@ably/chat';
import React from 'react';
import { parseDMRoomId } from '../../../utils/roomId.ts';
import { RoomListItem } from './room-list-item.tsx';

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
 * Props for the RoomList component
 */
export interface RoomListProps {
  /** Array of room names to render. */
  roomNames: string[];
  /** Rooms data with message information. */
  rooms: Record<string, RoomData>;
  /** Currently selected room. */
  activeRoomName?: string;
  /** Ably chat options applied to each `ChatRoomProvider`. */
  defaultRoomOptions?: RoomOptions;

  /** Fires when the user clicks a room. */
  onSelect: (roomName: string) => void;
  /** Fires when the user clicks the "leave" action. */
  onLeave: (roomName: string) => void;

  /** Collapsed (avatar-only) rendering mode. */
  isCollapsed?: boolean;
  /** Current user ID for formatting participant names */
  userId?: string;
  /** Current user's full name for message formatting */
  userFullName?: string;
}

/**
 * RoomList component
 *
 * Component that renders a list of chat rooms. It displays each room as a clickable item
 * with an avatar, name, and action buttons for selecting or leaving the room. It also
 * allows for collapsed rendering mode where only the avatar is shown.
 * Each room is wrapped in a `ChatRoomProvider`, rooms will automatically attach/(detach & release) on mount/unmount.
 *
 * @example
 * <RoomList
 *   roomNames={['room1', 'room2', 'room3']}
 *   onSelect={(roomName) => console.log('Selected:', roomName)}
 *   onLeave={(roomName) => console.log('Left:', roomName)}
 * />
 *
 * @example
 * // Collapsed mode for narrow sidebars
 * <RoomList
 *   roomNames={['general', 'random']}
 *   activeRoomName="general"
 *   isCollapsed={true}
 *   onSelect={setActiveRoom}
 *   onLeave={handleLeaveRoom}
 * />
 *
 */
export const RoomList = ({
  roomNames,
  rooms,
  activeRoomName,
  defaultRoomOptions,
  onSelect,
  onLeave,
  isCollapsed = false,
  userId,
  userFullName,
}: RoomListProps) => (
  <>
    {roomNames.map((roomName) => {
      const roomData = rooms[roomName];

      // Extract participantUserId for direct profile avatar loading
      let participantUserId: string | undefined;
      const roomInfo = parseDMRoomId(roomName);
      if (roomInfo && userId) {
        // Find the other participant (not current user)
        participantUserId = roomInfo.participants.find(id => id !== userId);
      }

      return (
        <RoomListItem
          key={roomName}
          roomName={roomName}
          roomData={roomData}
          isSelected={roomName === activeRoomName}
          isCollapsed={isCollapsed}
          onClick={() => {
            onSelect(roomName);
          }}
          onLeave={() => {
            onLeave(roomName);
          }}
          userId={userId}
          userFullName={userFullName}
          participantUserId={participantUserId}
        />
      );
    })}
  </>
);

RoomList.displayName = 'RoomList';
