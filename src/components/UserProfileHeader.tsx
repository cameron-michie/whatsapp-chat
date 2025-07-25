import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useProfile } from '../contexts/ProfileContext';

interface UserProfileHeaderProps {
  userId: string;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ userId }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
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
            {/* Avatar and Basic Info */}
            <div className="flex items-center space-x-4">
              <img
                src={user?.imageUrl || currentProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                alt={user?.fullName || 'User avatar'}
                className="w-16 h-16 rounded-full bg-gray-200"
              />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {user?.fullName || currentProfile?.fullName || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.primaryEmailAddress?.emailAddress || 'No email'}
                </p>
              </div>
            </div>

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
      {/* Profile Header Button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={user?.imageUrl || currentProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
              alt={user?.fullName || 'User avatar'}
              className="w-10 h-10 rounded-full bg-gray-200"
            />
            {/* Online status indicator */}
            {currentProfile?.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {user?.fullName || currentProfile?.fullName || 'Unknown User'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              View profile
            </div>
          </div>

          {/* Arrow Icon */}
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Profile Modal */}
      <ProfileModal />
    </>
  );
};