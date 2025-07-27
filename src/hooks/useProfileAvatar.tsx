import { useMemo } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import type { AvatarData } from '../ably-ui-kits/components/atoms/avatar';

/**
 * Simple hook that directly converts a userId to avatar data using the profile system
 * This eliminates complex component drilling and data transformation chains
 */
export const useProfileAvatar = (userId: string): AvatarData => {
  const { getUserName, getUserAvatar } = useProfile();
  
  return useMemo(() => {
    const profileName = getUserName(userId);
    const profileAvatarUrl = getUserAvatar(userId);
    
    // Generate initials from name
    const initials = profileName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    return {
      displayName: profileName,
      src: profileAvatarUrl,
      initials,
      color: generateConsistentColor(userId)
    };
  }, [userId, getUserName, getUserAvatar]);
};

/**
 * Generate a consistent color from user ID
 */
function generateConsistentColor(userId: string): string {
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}