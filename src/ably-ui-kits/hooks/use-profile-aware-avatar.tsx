import { useCallback, useEffect, useState } from 'react';
import type { AvatarData } from '../components/atoms/avatar.tsx';
import { useAvatar } from './use-avatar.tsx';

/**
 * Props for the useProfileAwareAvatar hook
 */
export interface UseProfileAwareAvatarProps {
  clientId: string;
  displayName?: string;
  // Profile system integration
  getUserName?: (userId: string) => string;
  getUserAvatar?: (userId: string) => string;
  fetchProfile?: (userId: string) => Promise<any>;
}

/**
 * Return type for the useProfileAwareAvatar hook
 */
export interface UseProfileAwareAvatarReturn {
  userAvatar: AvatarData | undefined;
  setUserAvatar: (avatarData: Partial<AvatarData>) => void;
}

/**
 * Enhanced avatar hook that integrates with the profile system
 * Falls back to the original avatar system if profile system is not available
 */
export const useProfileAwareAvatar = ({
  clientId,
  displayName,
  getUserName,
  getUserAvatar,
  fetchProfile,
}: UseProfileAwareAvatarProps): UseProfileAwareAvatarReturn => {
  const { getAvatarForUser, createAvatarForUser, setUserAvatar: updateUserAvatar } = useAvatar();
  const [avatar, setAvatar] = useState<AvatarData | undefined>();

  useEffect(() => {
    const loadAvatar = async () => {
      // First, try to get profile data if profile system functions are available
      if (fetchProfile && getUserName && getUserAvatar) {
        try {
          console.log(`Loading profile avatar for clientId: ${clientId}`);
          
          // Extract user ID from clientId (format: "Name.userId" or just "userId")
          const userId = clientId.includes('.') ? clientId.split('.').pop() : clientId;
          
          if (userId) {
            // Try to fetch profile data
            await fetchProfile(userId);
            const profileName = getUserName(userId);
            const profileAvatarUrl = getUserAvatar(userId);
            
            console.log(`Profile data for ${userId}:`, { profileName, profileAvatarUrl });
            
            // If we have meaningful profile data, use it
            if (profileName && profileName !== userId) {
              const profileAvatar: AvatarData = {
                displayName: profileName,
                src: profileAvatarUrl,
                initials: profileName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase(),
                color: generateColorFromId(userId)
              };
              
              console.log(`Using profile-based avatar for ${clientId}:`, profileAvatar);
              setAvatar(profileAvatar);
              return;
            }
          }
        } catch (error) {
          console.log(`Failed to load profile data for ${clientId}, falling back to avatar system:`, error);
        }
      }
      
      // Fallback to existing avatar system
      const existingAvatar = getAvatarForUser(clientId);
      
      if (existingAvatar) {
        setAvatar(existingAvatar);
      } else {
        // Create a new avatar if one doesn't exist
        const newAvatar = createAvatarForUser(clientId, displayName);
        setAvatar(newAvatar);
      }
    };
    
    loadAvatar();
  }, [getAvatarForUser, createAvatarForUser, clientId, displayName, fetchProfile, getUserName, getUserAvatar]);

  /**
   * Updates the user avatar both in the cache and local state
   */
  const setUserAvatar = useCallback(
    (avatarData: Partial<AvatarData>) => {
      updateUserAvatar(clientId, avatarData);
      // Update local state to reflect changes immediately
      setAvatar((prev) => (prev ? { ...prev, ...avatarData } : undefined));
    },
    [updateUserAvatar, clientId]
  );

  return {
    userAvatar: avatar,
    setUserAvatar,
  };
};

/**
 * Generate a consistent color from user ID
 */
function generateColorFromId(id: string): string {
  const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}