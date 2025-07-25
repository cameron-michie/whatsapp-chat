import { type RoomOptions } from '@ably/chat';
import { clsx } from 'clsx';
import { useState } from 'react';

import { useTheme } from '../../hooks/use-theme.tsx';
import { Button } from '../atoms/button.tsx';
import { Icon } from '../atoms/icon.tsx';
import { CreateRoomModal } from './create-room-modal.tsx';
import { DropdownMenu } from './dropdown-menu.tsx';
import { RoomList } from './room-list.tsx';

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
 * Props for the Sidebar component
 */
export interface SidebarProps {
  /** Rooms to display with their data. */
  rooms: Record<string, RoomData>;
  /** Currently-active room (optional). */
  activeRoomName?: string;
  /** Ably options passed to each `ChatRoomProvider`. */
  defaultRoomOptions?: RoomOptions;
  /** Adds (or joins) a room. Should also set it active, if desired. */
  addRoom: (name: string) => void;
  /** Sets the active room. Pass `undefined` to clear. */
  setActiveRoom: (name?: string) => void;
  /** Leaves a room (and handles provider release if needed). */
  leaveRoom: (name: string) => void;
  /** Optional CSS class names for additional styling. */
  className?: string;
  /** Whether the sidebar is in collapsed mode (avatar-only). */
  isCollapsed?: boolean;
  /** Callback to toggle the collapsed state. */
  onToggleCollapse?: () => void;
  /** Current user ID for formatting participant names */
  userId?: string;
  /** Current user's full name for message formatting */
  userFullName?: string;
}

/**
 * Sidebar component provides room navigation and management
 *
 * Features:
 * - Collapsible interface with avatar-only mode
 * - Room creation and management
 * - Theme toggle integration
 * - Active room highlighting
 * - Room count display
 *
 * @example
 * const [rooms, setRooms]   = useState<string[]>([]);
 * const [active, setActive] = useState<string>();
 *
 * const addRoom   = (name: string) => setRooms(r => r.includes(name) ? r : [...r, name]);
 * const leaveRoom = (name: string) => setRooms(r => r.filter(n => n !== name));
 *
 * <Sidebar
 *   roomNames={rooms}
 *   activeRoomName={active}
 *   defaultRoomOptions={{ rewind: 50 }}
 *   addRoom={addRoom}
 *   setActiveRoom={setActive}
 *   leaveRoom={leaveRoom}
 * />
 */
export const Sidebar = ({
  rooms,
  activeRoomName,
  defaultRoomOptions,
  addRoom,
  setActiveRoom,
  leaveRoom,
  className = '',
  isCollapsed = false,
  onToggleCollapse,
  userId,
  userFullName,
}: SidebarProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Convert rooms object to sorted array of room names
  const roomNames = Object.keys(rooms).sort((a, b) => {
    const timestampA = parseInt(rooms[a].latestMessageTimestamp) || 0;
    const timestampB = parseInt(rooms[b].latestMessageTimestamp) || 0;
    return timestampB - timestampA;
  });

  return (
    <aside
      className={clsx(
        'bg-white dark:bg-gray-900',
        'border-r border-gray-200 dark:border-gray-800',
        'flex flex-col h-full',
        'w-full',
        className
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800',
          'min-h-[4rem]'
        )}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size="md" />
            </Button>
            {onToggleCollapse && (
              <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
                <Icon name="chevronright" size="md" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              Chats <span className="text-sm font-normal text-gray-500">({roomNames.length})</span>
            </h1>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size="md" />
              </Button>

              <DropdownMenu
                trigger={
                  <Button variant="ghost" size="sm">
                    <Icon name="more" size="md" />
                  </Button>
                }
                items={[
                  {
                    id: 'create-room',
                    label: 'Create Room',
                    icon: '➕',
                    onClick: () => {
                      setShowCreateModal(true);
                    },
                  },
                ]}
              />

              {onToggleCollapse && (
                <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
                  <Icon name="chevronleft" size="md" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-w-0">
        <RoomList
          roomNames={roomNames}
          rooms={rooms}
          activeRoomName={activeRoomName}
          defaultRoomOptions={defaultRoomOptions}
          onSelect={setActiveRoom}
          onLeave={leaveRoom}
          isCollapsed={isCollapsed}
          userId={userId}
          userFullName={userFullName}
        />
      </div>
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onCreateRoom={(name) => {
          addRoom(name);
          setShowCreateModal(false);
        }}
      />
    </aside>
  );
};

Sidebar.displayName = 'Sidebar';
