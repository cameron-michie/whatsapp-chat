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
  const [activeRoomCounter, setActiveRoomCounter] = useState<any>(null);

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
        setIsLoading(true);

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

  // Auto-decrement unread counter for active room
  useEffect(() => {
    console.log('=== ACTIVE ROOM COUNTER EFFECT ===');
    console.log('Channel available:', !!channel);
    console.log('Active room ID:', activeRoomId);

    if (!channel || !activeRoomId) {
      console.log('No channel or activeRoomId, clearing counter');
      setActiveRoomCounter(null);
      return;
    }

    const setupActiveRoomCounter = async () => {
      try {
        console.log(`=== SETTING UP AUTO-DECREMENT FOR ROOM: ${activeRoomId} ===`);

        const root = await channel.objects.getRoot();
        console.log('Got root object for active room setup');

        const roomMap = root.get(activeRoomId);
        console.log('Room map for active room:', !!roomMap);

        if (roomMap) {
          console.log("roomMap", roomMap);
          const unreadCounter = roomMap.get('unreadMessageCount');
          console.log('Unread counter found:', !!unreadCounter);
          console.log('Counter type:', typeof unreadCounter);
          console.log('Counter value:', unreadCounter);
          console.log('Counter constructor:', unreadCounter?.constructor?.name);
          console.log('Counter has subscribe method:', typeof unreadCounter?.subscribe === 'function');
          console.log('Counter has value method:', typeof unreadCounter?.value === 'function');
          console.log('Counter has increment method:', typeof unreadCounter?.increment === 'function');
          console.log('Available methods on counter:', Object.getOwnPropertyNames(unreadCounter || {}));

          if (unreadCounter && typeof unreadCounter.subscribe === 'function') {
            const currentValue = unreadCounter.value();
            console.log(`Setting up auto-decrement for active room: ${activeRoomId}`);
            console.log(`Current counter value: ${currentValue}`);

            setActiveRoomCounter(unreadCounter);

            // Subscribe to counter changes and immediately decrement any increments
            const unsubscribe = unreadCounter.subscribe((update: any) => {
              console.log(`=== COUNTER UPDATE FOR ACTIVE ROOM ${activeRoomId} ===`);
              console.log('Update object:', JSON.stringify(update, null, 2));
              console.log('Update amount:', update?.amount);
              console.log('Update type:', typeof update);

              if (update && update.amount > 0) {
                console.log(`🔄 AUTO-DECREMENTING by ${update.amount} for active room ${activeRoomId}`);
                console.log('Counter value before decrement:', unreadCounter.value());

                // Immediately decrement by the same amount that was just incremented
                unreadCounter.increment(-update.amount)
                  .then(() => {
                    console.log(`✅ Successfully auto-decremented counter by ${update.amount}`);
                    console.log('Counter value after decrement:', unreadCounter.value());
                  })
                  .catch((error: any) => {
                    console.error('❌ Failed to auto-decrement counter:', error);
                  });
              } else if (update && update.amount < 0) {
                console.log(`⬇️ Counter decremented by ${Math.abs(update.amount)} (this is expected)`);
              } else {
                console.log('📊 Counter update with no positive amount, no action needed');
              }
            });

            // Also reset counter to 0 when room becomes active
            if (currentValue > 0) {
              console.log(`🔄 RESETTING unread count from ${currentValue} to 0 for newly active room ${activeRoomId}`);

              unreadCounter.increment(-currentValue)
                .then(() => {
                  console.log(`✅ Successfully reset counter from ${currentValue} to 0`);
                  console.log('Counter value after reset:', unreadCounter.value());
                })
                .catch((error: any) => {
                  console.error('❌ Failed to reset counter on room activation:', error);
                });
            } else {
              console.log('✅ Counter already at 0, no reset needed');
            }

            return unsubscribe;
          } else {
            console.warn('⚠️ Unread counter not found or not subscribable for room:', activeRoomId);
          }
        } else {
          console.warn('⚠️ Room map not found for active room:', activeRoomId);
        }
      } catch (error) {
        console.error('❌ Failed to setup active room counter:', error);
        console.error('Error details:', error);
      }
    };

    setupActiveRoomCounter();

    // Cleanup when room changes or component unmounts
    return () => {
      console.log(`🧹 CLEANING UP active room counter for: ${activeRoomId}`);

      if (activeRoomCounter && typeof activeRoomCounter.unsubscribeAll === 'function') {
        console.log('Unsubscribing from counter updates');
        activeRoomCounter.unsubscribeAll();
      }

      console.log('Clearing active room counter state');
      setActiveRoomCounter(null);
    };
  }, [channel, activeRoomId]);

  // Additional effect to handle counter changes for the active room
  useEffect(() => {
    console.log('=== ACTIVE ROOM COUNTER STATE CHANGE ===');
    console.log('Active room counter available:', !!activeRoomCounter);

    if (!activeRoomCounter) {
      console.log('No active room counter, skipping additional reset');
      return;
    }

    // Reset counter when it becomes the active room counter
    const currentValue = activeRoomCounter.value();
    console.log(`Active room counter current value: ${currentValue}`);

    if (currentValue > 0) {
      console.log(`🔄 ADDITIONAL RESET: Resetting active room counter from ${currentValue} to 0`);

      activeRoomCounter.increment(-currentValue)
        .then(() => {
          console.log(`✅ Successfully performed additional reset from ${currentValue} to 0`);
          console.log('Counter value after additional reset:', activeRoomCounter.value());
        })
        .catch((error: any) => {
          console.error('❌ Failed to perform additional reset of active room counter:', error);
        });
    } else {
      console.log('✅ Active room counter already at 0, no additional reset needed');
    }
  }, [activeRoomCounter]);

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
