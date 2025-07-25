import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useProfile } from '../contexts/ProfileContext';

/**
 * Hook to automatically update the current user's profile on login and user data changes
 */
export const useProfileUpdater = () => {
  const { user, isLoaded } = useUser();
  const { updateCurrentUserProfile, clearCache } = useProfile();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const updateProfile = async () => {
      console.log('Updating profile for logged-in user:', user.id);
      
      // Clear cache on fresh login
      clearCache();

      // Update profile with current user data
      await updateCurrentUserProfile({
        userId: user.id,
        fullName: user.fullName || '',
        avatarUrl: user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        lastOnlineTime: new Date().toISOString(),
        isOnline: true
      });
    };

    updateProfile();
  }, [user, isLoaded, updateCurrentUserProfile, clearCache]);

  // Also update on visibility change (when user comes back to tab)
  useEffect(() => {
    if (!isLoaded || !user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, updating last online time');
        updateCurrentUserProfile({
          lastOnlineTime: new Date().toISOString(),
          isOnline: true
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isLoaded, updateCurrentUserProfile]);
};