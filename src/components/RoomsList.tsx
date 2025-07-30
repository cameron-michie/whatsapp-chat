import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useChannel, usePresenceListener } from 'ably/react';
import { useUser } from '@clerk/clerk-react';
import { Sidebar } from '../ably-ui-kits/components/molecules';
import { useProfile } from '../contexts/ProfileContext';
// import { useRoomParticipants } from '../hooks/useRoomParticipants';
import { parseDMRoomId } from '../utils/roomId';
import { UserProfileHeader } from './UserProfileHeader';
import { useProfileUpdater } from '../hooks/useProfileUpdater';

interface RoomData {
  chatRoomType: 'DM' | 'topic' | 'groupDM';
  lastMessageSeenCursor: string;
  latestMessagePreview: string;
  latestMessageSender: string;
  latestMessageTimestamp: string;
  displayMacroUrl: string;
  participants: string;
  unreadMessageCount: number;
  // Enhanced with profile data
  displayName?: string;
  avatarUrl?: string;
  isOnline?: boolean;
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
  useProfileUpdater();

  const [rooms, setRooms] = useState<Record<string, RoomData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { channel } = useChannel(`roomslist:${userId}`);
  const { user } = useUser();
  const { getUserName } = useProfile();
  // const { getRoomDisplayInfo } = useRoomParticipants();
  const { presenceData } = usePresenceListener('presence');

  // Track online users from presence
  const onlineUserIds = useMemo(() => {
    if (!presenceData) return new Set();
    return new Set(
      presenceData
        .filter(member => member.data?.userId && member.data.userId !== userId)
        .map(member => member.data.userId)
    );
  }, [presenceData, userId]);

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

  // Helper function to extract room data with profile enhancement
  const extractRoomData = async (roomId: string, roomMap: any): Promise<RoomData> => {

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

    // Extract basic room data
    const baseRoomData = {
      chatRoomType: getValue('chatRoomType') || 'DM',
      lastMessageSeenCursor: getValue('lastMessageSeenCursor') || '',
      latestMessagePreview: getValue('latestMessagePreview') || '',
      latestMessageSender: getValue('latestMessageSender') || '',
      latestMessageTimestamp: getValue('latestMessageTimestamp') || '',
      displayMacroUrl: getValue('displayMacroUrl') || '',
      participants: getValue('participants') || '',
      unreadMessageCount: getUnreadCountValue()
    };

    // Check if this is a DM room and determine online status
    let isOnline = false;
    const roomInfo = parseDMRoomId(roomId);
    if (roomInfo && roomInfo.participants.length === 2) {
      // Find the other participant (not current user)
      const otherUserId = roomInfo.participants.find(id => id !== userId);
      if (otherUserId) {
        // Check if the other user is online using presence data
        isOnline = onlineUserIds.has(otherUserId);
        console.log(`🟢 Room ${roomId}:`, {
          otherUserId,
          isOnline,
          onlineUserIds: Array.from(onlineUserIds),
          roomInfo: roomInfo.participants
        });
      }
    }

    return {
      ...baseRoomData,
      isOnline
    };
  };

  // Helper function to load all rooms from the LiveMap with profile enhancement
  const loadAllRooms = useCallback(async (root: any): Promise<Record<string, RoomData>> => {
    const allRooms: Record<string, RoomData> = {};

    try {
      if (root && typeof root.entries === 'function') {
        const roomEntries = Array.from(root.entries());

        // Process rooms in parallel for better performance
        const roomPromises = (roomEntries as [string, any][]).map(async ([roomId, roomMap]: [string, any]) => {
          if (roomMap) {
            const roomData = await extractRoomData(roomId, roomMap);
            return [roomId, roomData];
          }
          return null;
        });

        const results = await Promise.all(roomPromises);

        results.forEach((result) => {
          if (result) {
            const [roomId, roomData] = result as [string, RoomData];
            allRooms[roomId] = roomData;
          }
        });
      } else {
        console.error('Root object does not have entries method');
      }
    } catch (error) {
      console.error('Error in loadAllRooms:', error);
    }

    return allRooms;
  }, [onlineUserIds, userId]);

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

        // Load all rooms using the consolidated function with profile data
        const initialRooms = await loadAllRooms(root);
        console.log('RoomsList: Found rooms:', Object.keys(initialRooms));
        setRooms(initialRooms);
        setIsLoading(false);

        // Subscribe to room list changes
        root.subscribe((update: any) => {

          // On any update, reload all rooms from the LiveMap with profile data
          loadAllRooms(root).then(updatedRooms => {
            console.log('RoomsList: Reloaded all rooms:', Object.keys(updatedRooms));
            console.log('RoomsList: Updated room data:', updatedRooms);
            setRooms(updatedRooms);
          });
        });

        // Also subscribe to individual room objects for real-time updates
        for (const [roomId, roomMap] of root.entries()) {
          if (roomMap && typeof (roomMap as any).subscribe === 'function') {
            console.log(`Subscribing to room: ${roomId}`);
            (roomMap as any).subscribe((roomUpdate: any) => {
              console.log(`=== ROOM ${roomId} UPDATE ===`);
              console.log('Room update:', roomUpdate);

              // Reload all rooms when any individual room updates
              loadAllRooms(root).then(updatedRooms => {
                console.log('RoomsList: Room updated, reloading all rooms');
                setRooms(updatedRooms);
              });
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
          const unreadCounter = (roomMap as any).get('unreadMessageCount');

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
  }, [channel, activeRoomId]);

  // Reset unread count when app comes into focus or user is active in the active room
  useEffect(() => {
    let lastResetTime = 0;
    const RESET_THROTTLE_MS = 2000; // Only reset once every 2 seconds

    const resetActiveRoomCounter = async (reason: string) => {
      if (!channel || !activeRoomId) {
        console.log(`⚡ ${reason} but no channel or activeRoomId`);
        return;
      }

      // Throttle resets to prevent excessive API calls
      const now = Date.now();
      if (now - lastResetTime < RESET_THROTTLE_MS) {
        console.log(`⚡ ${reason} throttled (last reset ${now - lastResetTime}ms ago)`);
        return;
      }
      lastResetTime = now;

      console.log(`⚡ ${reason} - resetting counter for active room: ${activeRoomId}`);

      try {
        const root = await channel.objects.getRoot();
        const roomMap = root.get(activeRoomId);

        if (roomMap) {
          const unreadCounter = (roomMap as any).get('unreadMessageCount');

          if (unreadCounter !== undefined) {
            console.log(`⚡ Resetting counter due to ${reason.toLowerCase()} for room: ${activeRoomId}`);
            await removeActiveRoomCounter(roomMap, activeRoomId);
          } else {
            console.log(`⚡ No counter to reset for ${reason.toLowerCase()} room: ${activeRoomId}`);
          }
        } else {
          console.warn(`⚡ Room map not found for ${reason.toLowerCase()} room: ${activeRoomId}`);
        }
      } catch (error) {
        console.error(`⚡ Failed to reset counter on ${reason.toLowerCase()}:`, error);
      }
    };

    const handleWindowFocus = () => resetActiveRoomCounter('Window focused');
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        resetActiveRoomCounter('Page became visible');
      }
    };

    // Throttled activity handler
    let activityTimeout: NodeJS.Timeout;
    const handleUserActivity = () => {
      // Debounce activity to only trigger after user stops being active for a moment
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        resetActiveRoomCounter('User activity detected');
      }, 500); // Wait 500ms after last activity
    };

    // Add event listeners for focus scenarios (not activity to avoid spam)
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Only listen for clicks and key events in the chat area, not mouse movement
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      clearTimeout(activityTimeout);
    };
  }, [channel, activeRoomId, removeActiveRoomCounter]);


  useEffect(() => {
    // Logic for subscribing to chat rooms via pub/sub, and updating liveobject from clientside
    console.log("Rooms changed!");
  }, [rooms]);

  // Reload rooms when presence data changes to update online status
  useEffect(() => {
    if (!channel) return;

    const reloadRoomsWithPresence = async () => {
      try {
        console.log('🟢 Presence data changed, reloading rooms with online status');
        console.log('🟢 Online user IDs:', Array.from(onlineUserIds));

        const root = await channel.objects.getRoot();
        const updatedRooms = await loadAllRooms(root);
        console.log('🟢 Reloaded rooms with presence data:', Object.keys(updatedRooms));

        // Log each room's online status for debugging
        Object.entries(updatedRooms).forEach(([roomId, roomData]) => {
          if (roomData.isOnline) {
            console.log(`🟢 Room ${roomId} has online user`);
          }
        });

        setRooms(updatedRooms);
      } catch (error) {
        console.error('Error reloading rooms with presence:', error);
      }
    };

    // Only reload if we have presence data and rooms
    if (onlineUserIds.size > 0) {
      reloadRoomsWithPresence();
    }
  }, [onlineUserIds, channel, loadAllRooms]);

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

  // Simplified: Just format message previews, avatars handled directly in components
  const transformedRooms = useMemo(() => {
    const transformed: Record<string, any> = {};

    Object.entries(rooms).forEach(([roomId, roomData]) => {
      // Parse sender name using profile data
      let senderDisplayName = 'Someone';
      if (roomData.latestMessageSender) {
        if (roomData.latestMessageSender === userId ||
          roomData.latestMessageSender === user?.fullName?.replace(/\s+/g, '_')) {
          senderDisplayName = 'You';
        } else {
          // Extract clean user ID from client ID format
          const extractUserIdFromClientId = (clientId: string): string => {
            // Handle formats like "Jenny_Purcell.user_30HNK6nodPBeewpeNXEXs4D0wwR"
            if (clientId.includes('.user_')) {
              return clientId.split('.user_')[1];
            }
            return clientId;
          };

          const cleanSenderId = extractUserIdFromClientId(roomData.latestMessageSender);
          const profileName = getUserName(cleanSenderId);

          // If we got a meaningful profile name (not just the user ID), use it
          if (profileName && profileName !== cleanSenderId) {
            senderDisplayName = profileName;
          } else {
            // Fallback: extract first name from the original sender string
            if (roomData.latestMessageSender.includes('.user_')) {
              const namepart = roomData.latestMessageSender.split('.user_')[0];
              if (namepart.includes('_')) {
                senderDisplayName = namepart.split('_')[0];
              } else {
                senderDisplayName = namepart;
              }
            } else if (roomData.latestMessageSender.includes('_')) {
              senderDisplayName = roomData.latestMessageSender.split('_')[0];
            } else {
              senderDisplayName = roomData.latestMessageSender;
            }
          }
        }
      }

      // Format message preview
      const messagePreview = roomData.latestMessagePreview ?
        `${senderDisplayName}: ${roomData.latestMessagePreview}` :
        'No messages yet';

      transformed[roomId] = {
        ...roomData,
        // Format message preview with proper sender names
        messagePreview,
        latestMessagePreview: messagePreview
      };
    });

    return transformed;
  }, [rooms, userId, user?.fullName, getUserName]);

  // Memoize the sidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(() => ({
    rooms: transformedRooms,
    activeRoomName: activeRoomId,
    addRoom: handleAddRoom,
    setActiveRoom: handleRoomSelect,
    leaveRoom: handleLeaveRoom,
    userId,
    userFullName: user?.fullName || undefined,
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
      // typing: {
      //   timeoutMs: 10000
      // },
      // Ensure room gets released properly to avoid conflicts
      release: true
    }
  }), [transformedRooms, activeRoomId, handleAddRoom, handleRoomSelect, handleLeaveRoom, userId, user?.fullName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white border-r border-gray-200">
        <div className="text-gray-500">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* User Profile Header */}
      <UserProfileHeader userId={userId} />

      {/* Existing rooms sidebar */}
      <div className="flex-1 overflow-hidden">
        <Sidebar {...sidebarProps} />
      </div>
    </div>
  );
});
