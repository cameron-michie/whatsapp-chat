import { useEffect, useRef } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { useAvatar } from '../ably-ui-kits/hooks/use-avatar';
import { parseDMRoomId } from '../utils/roomId';

/**
 * Hook to sync profile data with the AvatarProvider cache
 * This ensures that ChatWindow messages display the correct profile-based avatars
 */
export const useAvatarProfileSync = (roomId?: string) => {
  const { fetchProfile, getUserName, getUserAvatar } = useProfile();
  const { setUserAvatar } = useAvatar();
  const syncedRooms = useRef(new Set<string>());

  useEffect(() => {
    if (!roomId || syncedRooms.current.has(roomId)) {
      return;
    }

    const syncProfilesForRoom = async () => {
      try {
        console.log(`Syncing profile avatars for room: ${roomId}`);
        
        // Parse room to get participants
        const roomInfo = parseDMRoomId(roomId);
        if (!roomInfo) {
          console.log('Could not parse room ID for profile sync');
          return;
        }

        // Fetch and sync profiles for all participants
        for (const userId of roomInfo.participants) {
          try {
            console.log(`Syncing avatar for user: ${userId}`);
            
            // Fetch profile data
            await fetchProfile(userId);
            const profileName = getUserName(userId);
            const profileAvatarUrl = getUserAvatar(userId);
            
            // If we have meaningful profile data, update the avatar cache
            if (profileName && profileName !== userId) {
              const avatarData = {
                displayName: profileName,
                src: profileAvatarUrl,
                initials: profileName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase(),
                color: generateColorFromUserId(userId)
              };
              
              // Update avatar cache with profile data
              // This will be used by useUserAvatar in chat messages
              setUserAvatar(userId, avatarData);
              
              // Also try common clientId formats that might be used in messages
              const clientIdFormats = [
                userId,
                `${profileName.replace(/\s+/g, '_')}.${userId}`,
                `${profileName}.${userId}`
              ];
              
              for (const clientId of clientIdFormats) {
                setUserAvatar(clientId, avatarData);
              }
              
              console.log(`✅ Synced avatar for ${userId} (${profileName})`);
            }
            
          } catch (error) {
            console.log(`Failed to sync profile for ${userId}:`, error);
          }
        }
        
        // Mark this room as synced to avoid re-syncing
        syncedRooms.current.add(roomId);
        
      } catch (error) {
        console.error('Error syncing profiles for room:', error);
      }
    };

    syncProfilesForRoom();
  }, [roomId]); // Only depend on roomId to avoid infinite loops
};

/**
 * Generate a consistent color from user ID
 */
function generateColorFromUserId(userId: string): string {
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#EC4899', // pink
    '#6366F1'  // indigo
  ];
  return colors[Math.abs(hash) % colors.length];
}