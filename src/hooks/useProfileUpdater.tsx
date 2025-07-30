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

      // Only update profile with actual user data (no fallbacks that could overwrite real data)
      const profileUpdate: any = {
        userId: user.id,
        lastOnlineTime: new Date().toISOString(),
        isOnline: true
      };

      // Only include fullName if we have actual data from Clerk
      if (user.fullName) {
        profileUpdate.fullName = user.fullName;
      }

      // Only include avatarUrl if we have actual image data from Clerk
      if (user.imageUrl) {
        profileUpdate.avatarUrl = user.imageUrl;
      }

      console.log('Profile update data (no fallbacks):', profileUpdate);
      await updateCurrentUserProfile(profileUpdate);
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