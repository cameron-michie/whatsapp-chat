import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useChannel } from 'ably/react';
import { useUser } from '@clerk/clerk-react';
import { Sidebar } from '../ably-ui-kits/components/molecules';
import { formatParticipantNames, formatMessagePreview } from '../utils/roomUtils';

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

export const RoomsList: React.FC<RoomsListProps> = React.memo(({
  userId,
  onRoomSelect,
  activeRoomId,
}) => {
  const [rooms, setRooms] = useState<Record<string, RoomData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { channel } = useChannel(`roomslist:${userId}`);
  const { user } = useUser();

  // Helper function to remove counter from active room
  const removeActiveRoomCounter = async (roomMap: any, roomId: string) => {
    console.log(`🗑️ REMOVING counter for active room: ${roomId}`);

    try {
      // Simply remove the unreadMessageCount field
      await roomMap.remove('unreadMessageCount');
      console.log(`✅ Successfully removed counter for room ${roomId}`);
      console.log('📋 Lambda will recreate counter if new messages arrive');

    } catch (error) {
      console.error(`❌ Failed to remove counter for room ${roomId}:`, error);
      // Don't throw - this is not critical
    }
  };


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
  const extractRoomData = (roomId: string, roomMap: any): RoomData => {
    console.log(`Extracting data for room ${roomId}:`, roomMap);
    console.log('roomMap type:', typeof roomMap);
    console.log('roomMap has get method:', typeof roomMap?.get === 'function');

    // Handle both LiveMap objects and plain objects
    const getValue = (key: string) => {
      if (roomMap && typeof roomMap.get === 'function') {
        // It's a LiveMap object
        return roomMap.get(key);
      } else if (roomMap && typeof roomMap === 'object') {
        // It's a plain object
        return roomMap[key];
      }
      return null;
    };

    const getUnreadCountValue = () => {
      if (roomMap && typeof roomMap.get === 'function') {
        return getUnreadCount(roomMap);
      } else if (roomMap && typeof roomMap === 'object') {
        const counter = roomMap.unreadMessageCount;
        if (counter && typeof counter === 'object' && typeof counter.value === 'function') {
          return counter.value();
        }
        return typeof counter === 'number' ? counter : 0;
      }
      return 0;
    };

    return {
      chatRoomType: getValue('chatRoomType') || 'DM',
      lastMessageSeenCursor: getValue('lastMessageSeenCursor') || '',
      latestMessagePreview: getValue('latestMessagePreview') || '',
      latestMessageSender: getValue('latestMessageSender') || '',
      latestMessageTimestamp: getValue('latestMessageTimestamp') || '',
      displayMacroUrl: getValue('displayMacroUrl') || '',
      participants: getValue('participants') || '',
      unreadMessageCount: getUnreadCountValue(),
    };
  };

  // Helper function to load all rooms from the LiveMap
  const loadAllRooms = (root: any): Record<string, RoomData> => {
    const allRooms: Record<string, RoomData> = {};

    console.log('Root object:', root);
    console.log('Root type:', typeof root);
    console.log('Root has entries method:', typeof root?.entries === 'function');

    try {
      if (root && typeof root.entries === 'function') {
        for (const [roomId, roomMap] of root.entries()) {
          console.log(`Processing room entry: ${roomId}`, roomMap);
          if (roomMap) {
            allRooms[roomId] = extractRoomData(roomId, roomMap);
          }
        }
      } else {
        console.error('Root object does not have entries method');
      }
    } catch (error) {
      console.error('Error in loadAllRooms:', error);
    }

    return allRooms;
  };

  // Initialize LiveObjects and load rooms
  useEffect(() => {
    if (!channel) return;

    const initializeLiveObjects = async () => {
      try {
        console.log('RoomsList: Initializing LiveObjects...');
        // Only show loading on initial load, not on subsequent updates
        if (Object.keys(rooms).length === 0) {
          setIsLoading(true);
        }

        const root = await channel.objects.getRoot();

        // Load all rooms using the consolidated function
        const initialRooms = loadAllRooms(root);
        console.log('RoomsList: Found rooms:', Object.keys(initialRooms));
        console.log('RoomsList: Room data:', initialRooms);
        setRooms(initialRooms);
        setIsLoading(false);

        // Subscribe to room list changes
        root.subscribe((update: any) => {
          console.log('=== ROOT SUBSCRIPTION UPDATE ===');
          console.log('Room list updated:', update);
          console.log('Update type:', typeof update);
          console.log('Update keys:', Object.keys(update || {}));

          // On any update, reload all rooms from the LiveMap
          const updatedRooms = loadAllRooms(root);
          console.log('RoomsList: Reloaded all rooms:', Object.keys(updatedRooms));
          console.log('RoomsList: Updated room data:', updatedRooms);
          setRooms(updatedRooms);
        });

        // Also subscribe to individual room objects for real-time updates
        for (const [roomId, roomMap] of root.entries()) {
          if (roomMap && typeof roomMap.subscribe === 'function') {
            console.log(`Subscribing to room: ${roomId}`);
            roomMap.subscribe((roomUpdate: any) => {
              console.log(`=== ROOM ${roomId} UPDATE ===`);
              console.log('Room update:', roomUpdate);

              // Reload all rooms when any individual room updates
              const updatedRooms = loadAllRooms(root);
              console.log('RoomsList: Room updated, reloading all rooms');
              setRooms(updatedRooms);
            });
          }
        }

      } catch (error) {
        console.error('Failed to initialize LiveObjects:', error);
        setIsLoading(false);
      }
    };

    initializeLiveObjects();
  }, [channel]);

  // Remove counter for active room (Lambda will recreate as needed)
  useEffect(() => {
    console.log('=== ACTIVE ROOM COUNTER REMOVAL EFFECT ===');
    console.log('Channel available:', !!channel);
    console.log('Active room ID:', activeRoomId);

    if (!channel || !activeRoomId) {
      console.log('No channel or activeRoomId, nothing to remove');
      return;
    }

    const handleActiveRoomCounter = async () => {
      try {
        console.log(`=== REMOVING COUNTER FOR ACTIVE ROOM: ${activeRoomId} ===`);

        const root = await channel.objects.getRoot();
        const roomMap = root.get(activeRoomId);

        if (roomMap) {
          const unreadCounter = roomMap.get('unreadMessageCount');

          if (unreadCounter !== undefined) {
            // Remove counter regardless of type (number, object, or LiveCounter)
            await removeActiveRoomCounter(roomMap, activeRoomId);
          } else {
            console.log(`✅ No counter found for room ${activeRoomId}, nothing to remove`);
          }
        } else {
          console.warn(`⚠️ Room map not found for active room: ${activeRoomId}`);
        }
      } catch (error) {
        console.error('❌ Failed to handle active room counter:', error);
      }
    };

    handleActiveRoomCounter();
  }, [channel, activeRoomId, rooms]);


  useEffect(() => {
    // Logic for subscribing to chat rooms via pub/sub, and updating liveobject from clientside
    console.log("Rooms changed!");
  }, [rooms]);

  // Memoize callbacks to prevent unnecessary re-renders
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

  // Memoize the sidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(() => ({
    rooms,
    activeRoomName: activeRoomId,
    addRoom: handleAddRoom,
    setActiveRoom: handleRoomSelect,
    leaveRoom: handleLeaveRoom,
    userId,
    userFullName: user?.fullName,
    className: "h-full",
    defaultRoomOptions: {
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
    }
  }), [rooms, activeRoomId, handleAddRoom, handleRoomSelect, handleLeaveRoom, userId, user?.fullName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white border-r border-gray-200">
        <div className="text-gray-500">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Existing rooms sidebar */}
      <div className="flex-1 overflow-hidden">
        <Sidebar {...sidebarProps} />
      </div>
    </div>
  );
});
