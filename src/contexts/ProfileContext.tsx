import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ProfileData {
  userId: string;
  fullName: string;
  avatarUrl: string;
  lastOnlineTime: string;
  isOnline: boolean;
}

interface ProfileContextType {
  // Cache operations
  getProfile: (userId: string) => ProfileData | null;
  getUserName: (userId: string) => string;
  getUserAvatar: (userId: string) => string;

  // Profile management
  updateCurrentUserProfile: (userData: Partial<ProfileData>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<ProfileData | null>;
  clearCache: () => void;

  // Cache state
  profiles: Map<string, ProfileData>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children, userId }) => {
  const [profiles, setProfiles] = useState<Map<string, ProfileData>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set()); // Prevent duplicate fetches

  const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY;

  // Get profile from cache
  const getProfile = useCallback((targetUserId: string): ProfileData | null => {
    return profiles.get(targetUserId) || null;
  }, [profiles]);

  // Get user display name with fallback
  const getUserName = useCallback((targetUserId: string): string => {
    const profile = getProfile(targetUserId);
    return profile?.fullName || targetUserId;
  }, [getProfile]);

  // Get user avatar URL with fallback
  const getUserAvatar = useCallback((targetUserId: string): string => {
    const profile = getProfile(targetUserId);
    return profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserId}`;
  }, [getProfile]);

  // Fetch profile data from LiveObjects
  const fetchProfile = useCallback(async (targetUserId: string): Promise<ProfileData | null> => {
    if (!ABLY_API_KEY) {
      console.error('ABLY_API_KEY not found');
      return null;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current.has(targetUserId)) {
      console.log(`Already fetching profile for ${targetUserId}`);
      return null;
    }

    // Check cache first
    const cached = profiles.get(targetUserId);
    if (cached) {
      console.log(`Profile for ${targetUserId} found in cache`);
      return cached;
    }

    try {
      fetchingRef.current.add(targetUserId);
      console.log(`Fetching profile for ${targetUserId}`);

      const channelName = `profile:${targetUserId}`;
      const url = `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/objects/root/compact`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(ABLY_API_KEY)}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`Profile not found for ${targetUserId} (${response.status})`);
        return null;
      }

      const data = await response.json();
      console.log(`Profile data received for ${targetUserId}:`, data);
      console.log(`Full response structure:`, JSON.stringify(data, null, 2));

      // Extract profile from LiveObjects compact response
      // Expected format: { "profile": { "avatarUrl": "...", "fullName": "...", "isOnline": true, "lastOnlineTime": "..." } }
      const profile = data.profile;
      if (!profile) {
        console.log(`No profile data found in response for ${targetUserId}`);
        return null;
      }

      const profileData: ProfileData = {
        userId: targetUserId,
        fullName: profile.fullName || targetUserId,
        avatarUrl: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserId}`,
        lastOnlineTime: profile.lastOnlineTime || '',
        isOnline: profile.isOnline || false
      };

      // Cache the profile
      setProfiles(prev => new Map(prev).set(targetUserId, profileData));
      console.log(`Cached profile for ${targetUserId}`);

      return profileData;

    } catch (error) {
      console.error(`Error fetching profile for ${targetUserId}:`, error);
      return null;
    } finally {
      fetchingRef.current.delete(targetUserId);
    }
  }, [ABLY_API_KEY, profiles]);

  // Update current user's profile
  const updateCurrentUserProfile = useCallback(async (userData: Partial<ProfileData>) => {
    if (!userId || !ABLY_API_KEY) {
      console.error('Cannot update profile: missing userId or API key');
      return;
    }

    try {
      console.log(`[ProfileUpdate] Starting profile update for user ${userId}`);
      console.log(`[ProfileUpdate] Input userData:`, JSON.stringify(userData, null, 2));

      const channelName = `profile:${userId}`;
      const url = `https://rest.ably.io/channels/${channelName}/objects`;
      
      console.log(`[ProfileUpdate] Channel name: ${channelName}`);
      console.log(`[ProfileUpdate] Request URL: ${url}`);

      // Create or update the profile object using the correct LiveObjects format
      // Batch MAP_SET operations for all profile fields
      const profileUpdate = [
        {
          operation: "MAP_SET",
          path: "profile",
          data: { key: "fullName", value: { "string": userData.fullName || '' } }
        },
        {
          operation: "MAP_SET", 
          path: "profile",
          data: { key: "avatarUrl", value: { "string": userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}` } }
        },
        {
          operation: "MAP_SET",
          path: "profile", 
          data: { key: "lastOnlineTime", value: { "string": new Date().toISOString() } }
        },
        {
          operation: "MAP_SET",
          path: "profile",
          data: { key: "isOnline", value: { "boolean": true } }
        }
      ];
      
      console.log(`[ProfileUpdate] Request payload:`, JSON.stringify(profileUpdate, null, 2));
      console.log(`[ProfileUpdate] Request headers:`, {
        'Authorization': `Basic ${btoa(ABLY_API_KEY).substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(ABLY_API_KEY)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileUpdate)
      });

      console.log(`[ProfileUpdate] Initial response status: ${response.status} ${response.statusText}`);
      console.log(`[ProfileUpdate] Initial response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`[ProfileUpdate] MAP_SET failed with ${response.status}:`, responseText);
        
        // Try creating the root map first
        console.log(`[ProfileUpdate] Attempting MAP_CREATE fallback...`);
        const createRoot = {
          operation: "MAP_CREATE",
          path: "profile",
          data: {
            fullName: { "string": userData.fullName || '' },
            avatarUrl: { "string": userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}` },
            lastOnlineTime: { "string": new Date().toISOString() },
            isOnline: { "boolean": true }
          }
        };

        console.log(`[ProfileUpdate] MAP_CREATE payload:`, JSON.stringify(createRoot, null, 2));

        const createResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(ABLY_API_KEY)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createRoot)
        });

        console.log(`[ProfileUpdate] MAP_CREATE response status: ${createResponse.status} ${createResponse.statusText}`);
        console.log(`[ProfileUpdate] MAP_CREATE response headers:`, Object.fromEntries(createResponse.headers.entries()));

        if (!createResponse.ok) {
          const createResponseText = await createResponse.text();
          console.error(`[ProfileUpdate] MAP_CREATE also failed with ${createResponse.status}:`, createResponseText);
          throw new Error(`Failed to create profile: ${createResponse.status} - ${createResponseText}`);
        } else {
          const createResponseText = await createResponse.text();
          console.log(`[ProfileUpdate] MAP_CREATE succeeded:`, createResponseText);
        }
      } else {
        const responseText = await response.text();
        console.log(`[ProfileUpdate] MAP_SET succeeded:`, responseText);
      }

      // Update local cache
      const updatedProfile: ProfileData = {
        userId,
        fullName: userData.fullName || '',
        avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        lastOnlineTime: new Date().toISOString(),
        isOnline: true
      };

      console.log(`[ProfileUpdate] Updating local cache with profile:`, JSON.stringify(updatedProfile, null, 2));
      setProfiles(prev => new Map(prev).set(userId, updatedProfile));
      console.log(`[ProfileUpdate] Successfully updated profile for ${userId}`);

    } catch (error) {
      console.error(`[ProfileUpdate] Error updating profile for ${userId}:`, error);
      if (error instanceof Error) {
        console.error(`[ProfileUpdate] Error message:`, error.message);
        console.error(`[ProfileUpdate] Error stack:`, error.stack);
      }
      throw error;
    }
  }, [userId, ABLY_API_KEY]);

  // Clear the cache (on login/refresh)
  const clearCache = useCallback(() => {
    console.log('Clearing profile cache');
    setProfiles(new Map());
    fetchingRef.current.clear();
  }, []);

  const value: ProfileContextType = {
    profiles,
    getProfile,
    getUserName,
    getUserAvatar,
    updateCurrentUserProfile,
    fetchProfile,
    clearCache
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
