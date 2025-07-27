import { useState, useCallback } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { parseDMRoomId } from '../utils/roomId';

export interface RoomParticipant {
  userId: string;
  fullName: string;
  avatarUrl: string;
  isOnline?: boolean;
}

export interface RoomDisplayInfo {
  roomName: string;
  participants: RoomParticipant[];
  otherParticipant: RoomParticipant | null; // For DMs, the other person
}

/**
 * Hook to get participant information for rooms and fetch their profiles
 */
export const useRoomParticipants = () => {
  const { fetchProfile, getUserName, getUserAvatar } = useProfile();
  const [roomCache, setRoomCache] = useState<Map<string, RoomDisplayInfo>>(new Map());

  const getRoomDisplayInfo = useCallback(async (roomId: string, currentUserId: string): Promise<RoomDisplayInfo> => {
    // Check cache first
    const cached = roomCache.get(roomId);
    if (cached) {
      return cached;
    }

    console.log(`Getting display info for room: ${roomId}`);

    // Parse room ID to get participants
    const roomInfo = parseDMRoomId(roomId);
    if (!roomInfo) {
      console.warn(`Could not parse room ID: ${roomId}`);
      return {
        roomName: roomId,
        participants: [],
        otherParticipant: null
      };
    }

    console.log(`Room participants from ID: ${roomInfo.participants.join(', ')}`);

    // Fetch profiles for all participants
    const participantProfiles = await Promise.all(
      roomInfo.participants.map(async (userId) => {
        console.log(`Fetching profile for participant: ${userId}`);
        await fetchProfile(userId);
        
        return {
          userId,
          fullName: getUserName(userId),
          avatarUrl: getUserAvatar(userId),
          isOnline: false // TODO: integrate with presence data
        };
      })
    );

    console.log(`Participant profiles loaded:`, participantProfiles);

    // For DMs, find the other participant (not current user)
    const otherParticipant = participantProfiles.find(p => p.userId !== currentUserId) || null;

    // For DMs, room name is just the other person's name
    const roomName = otherParticipant ? otherParticipant.fullName : roomId;

    const displayInfo: RoomDisplayInfo = {
      roomName,
      participants: participantProfiles,
      otherParticipant
    };

    // Cache the result
    setRoomCache(prev => new Map(prev).set(roomId, displayInfo));
    console.log(`Cached display info for room ${roomId}:`, displayInfo);

    return displayInfo;
  }, [fetchProfile, getUserName, getUserAvatar, roomCache]);

  const clearRoomCache = useCallback(() => {
    console.log('Clearing room display cache');
    setRoomCache(new Map());
  }, []);

  return {
    getRoomDisplayInfo,
    clearRoomCache,
    roomCache
  };
};