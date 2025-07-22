import React, { useState, useEffect, useCallback } from 'react';
import { useChannel } from 'ably/react';
import { useUser } from '@clerk/clerk-react';
import { Sidebar } from '../ably-ui-kits/components/molecules';
import { formatParticipantNames, formatMessagePreview } from '../utils/roomUtils';
import { ContactList } from './ContactList';

interface RoomData {
  chatRoomType: 'DM' | 'topic' | 'groupDM';
  lastMessageSeenCursor: string;
  latestMessagePreview: string;
  latestMessageSender: string;
  latestMessageTimestamp: string;
  displayMacroUrl: string;
  participants: string;
  unreadMessageCount: number;
}

interface RoomsListProps {
  userId: string;
  onRoomSelect: (roomId: string) => void;
  activeRoomId?: string;
}

export const RoomsList: React.FC<RoomsListProps> = ({
  userId,
  onRoomSelect,
  activeRoomId,
}) => {
  const [rooms, setRooms] = useState<Record<string, RoomData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { channel } = useChannel(`roomslist:${userId}`);
  const { user } = useUser();

  // Helper function to safely get unread count
  const getUnreadCount = (roomMap: any): number => {
    const unreadCounter = roomMap.get('unreadMessageCount');
    if (unreadCounter && typeof unreadCounter.value === 'function') {
      return unreadCounter.value();
    }
    // Fallback for non-LiveCounter values
    return typeof unreadCounter === 'number' ? unreadCounter : 0;
  };

  // Helper function to extract room data
  const extractRoomData = (roomId: string, roomMap: any): RoomData => ({
    chatRoomType: roomMap.get('chatRoomType') || 'DM',
    lastMessageSeenCursor: roomMap.get('lastMessageSeenCursor') || '',
    latestMessagePreview: roomMap.get('latestMessagePreview') || '',
    latestMessageSender: roomMap.get('latestMessageSender') || '',
    latestMessageTimestamp: roomMap.get('latestMessageTimestamp') || '',
    displayMacroUrl: roomMap.get('displayMacroUrl') || '',
    participants: roomMap.get('participants') || '',
    unreadMessageCount: getUnreadCount(roomMap),
  });

  // Helper function to load all rooms from the LiveMap
  const loadAllRooms = (root: any): Record<string, RoomData> => {
    const allRooms: Record<string, RoomData> = {};

    for (const [roomId, roomMap] of root.entries()) {
      if (roomMap) {
        allRooms[roomId] = extractRoomData(roomId, roomMap);
      }
    }

    return allRooms;
  };

  // Initialize LiveObjects and load rooms
  useEffect(() => {
    if (!channel) return;

    const initializeLiveObjects = async () => {
      try {
        console.log('RoomsList: Initializing LiveObjects...');
        setIsLoading(true);

        const root = await channel.objects.getRoot();

        // Load all rooms using the consolidated function
        const initialRooms = loadAllRooms(root);
        console.log('RoomsList: Found rooms:', Object.keys(initialRooms));
        setRooms(initialRooms);
        setIsLoading(false);

        // Subscribe to room list changes
        root.subscribe((update: any) => {
          console.log('Room list updated:', update);

          // On any update, reload all rooms from the LiveMap
          const updatedRooms = loadAllRooms(root);
          console.log('RoomsList: Reloaded all rooms:', Object.keys(updatedRooms));
          setRooms(updatedRooms);
        });

      } catch (error) {
        console.error('Failed to initialize LiveObjects:', error);
        setIsLoading(false);
      }
    };

    initializeLiveObjects();
  }, [channel]);

  useEffect(() => {
    // Logic for subscribing to chat rooms via pub/sub, and updating liveobject from clientside
    console.log("Rooms changed!");
  }, [rooms]);

  const handleRoomSelect = useCallback((roomName?: string) => {
    if (roomName) {
      onRoomSelect(roomName);
    }
  }, [onRoomSelect]);

  const handleAddRoom = useCallback((roomName: string) => {
    console.log('Add room:', roomName);
  }, []);

  const handleLeaveRoom = useCallback((roomName: string) => {
    console.log('Leave room:', roomName);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white border-r border-gray-200">
        <div className="text-gray-500">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Contact List for starting new chats */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <ContactList />
      </div>

      {/* Existing rooms sidebar */}
      <div className="flex-1 overflow-hidden">
        <Sidebar
          rooms={rooms}
          activeRoomName={activeRoomId}
          addRoom={handleAddRoom}
          setActiveRoom={handleRoomSelect}
          leaveRoom={handleLeaveRoom}
          userId={userId}
          userFullName={user?.fullName}
          className="h-full"
          defaultRoomOptions={{
            // Configure Chat SDK room options consistently
            presence: {
              enableEvents: true,
              subscribe: false
            },
            occupancy: {
              enableEvents: true,
              subscribe: false
            },
            typing: {
              timeoutMs: 10000
            },
            // Ensure room gets released properly to avoid conflicts
            release: true
          }}
        />
      </div>
    </div>
  );
};
