import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { RoomListItem } from '../ably-ui-kits/components/molecules/room-list-item';

interface UserProfileHeaderProps {
  userId: string;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ userId }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { getProfile, fetchProfile } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  // Fetch current user's profile
  useEffect(() => {
    const loadCurrentProfile = async () => {
      if (userId) {
        await fetchProfile(userId);
        const profile = getProfile(userId);
        setCurrentProfile(profile);
      }
    };
    
    loadCurrentProfile();
  }, [userId, fetchProfile, getProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const ProfileModal = () => {
    if (!showProfileModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowProfileModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Profile using RoomListItem */}
            <RoomListItem
              roomName={`profile-${userId}`}
              roomData={{
                chatRoomType: 'DM',
                lastMessageSeenCursor: '',
                latestMessagePreview: user?.primaryEmailAddress?.emailAddress || 'No email',
                latestMessageSender: '',
                latestMessageTimestamp: '',
                displayMacroUrl: user?.imageUrl || currentProfile?.avatarUrl || '',
                participants: user?.fullName || currentProfile?.fullName || 'Unknown User',
                unreadMessageCount: 0,
                displayName: user?.fullName || currentProfile?.fullName || 'Unknown User',
                avatarUrl: user?.imageUrl || currentProfile?.avatarUrl,
                isOnline: currentProfile?.isOnline || false
              }}
              isSelected={false}
              onClick={() => {}} // No click action for profile display
              onLeave={() => {}} // No leave action for profile
              userId={userId}
              userFullName={user?.fullName || undefined}
            />

            {/* Profile Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-2 rounded font-mono">
                  {userId}
                </div>
              </div>

              {currentProfile && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Profile Status
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${currentProfile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {currentProfile.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {currentProfile.lastOnlineTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Online
                      </label>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(currentProfile.lastOnlineTime).toLocaleString()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Profile Header and Home Button */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Home Button */}
        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm font-medium">Home</span>
          </button>
        </div>

        {/* Profile Header using RoomListItem */}
        <div className="p-2">
          <RoomListItem
            roomName={`current-user-${userId}`}
            roomData={{
              chatRoomType: 'DM',
              lastMessageSeenCursor: '',
              latestMessagePreview: 'View profile',
              latestMessageSender: '',
              latestMessageTimestamp: '',
              displayMacroUrl: user?.imageUrl || currentProfile?.avatarUrl || '',
              participants: user?.fullName || currentProfile?.fullName || 'Unknown User',
              unreadMessageCount: 0,
              displayName: user?.fullName || currentProfile?.fullName || 'Unknown User',
              avatarUrl: user?.imageUrl || currentProfile?.avatarUrl,
              isOnline: currentProfile?.isOnline || false
            }}
            isSelected={false}
            onClick={() => setShowProfileModal(true)}
            onLeave={() => {}} // No leave action for current user
            userId={userId}
            userFullName={user?.fullName || undefined}
          />
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal />
    </>
  );
};