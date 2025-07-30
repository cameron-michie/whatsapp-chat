import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { RoomListItem } from '../ably-ui-kits/components/molecules/room-list-item';
import { useChannel } from 'ably/react';
import { useUser } from '@clerk/clerk-react';

interface OtherUserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const OtherUserProfileModal: React.FC<OtherUserProfileModalProps> = ({ 
  userId, 
  isOpen, 
  onClose, 
  roomId 
}) => {
  const { user: currentUser } = useUser();
  const { getProfile, fetchProfile, getUserName, getUserAvatar } = useProfile();
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const { channel } = useChannel(`roomslist:${currentUser?.id}`);

  // Fetch other user's profile
  useEffect(() => {
    const loadOtherUserProfile = async () => {
      if (userId) {
        await fetchProfile(userId);
        const profile = getProfile(userId);
        setOtherUserProfile(profile);
      }
    };

    if (isOpen) {
      loadOtherUserProfile();
    }
  }, [userId, fetchProfile, getProfile, isOpen]);

  const handleDeleteChat = async () => {
    try {
      if (!channel || !currentUser?.id) {
        console.error('No channel or current user ID available');
        return;
      }

      console.log(`Deleting chat: ${roomId} for user: ${currentUser.id}`);
      
      // Get the root LiveObjects map
      const root = await channel.objects.getRoot();
      
      // Remove the room from the current user's rooms list
      await root.remove(roomId);
      
      console.log(`Successfully removed room ${roomId} from user's room list`);
      onClose();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  if (!isOpen) return null;

  const profileName = getUserName(userId) || otherUserProfile?.fullName || 'Unknown User';
  const profileAvatarUrl = getUserAvatar(userId) || otherUserProfile?.avatarUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              User Profile
            </h2>
            <button
              onClick={onClose}
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
              latestMessagePreview: 'View profile',
              latestMessageSender: '',
              latestMessageTimestamp: '',
              displayMacroUrl: profileAvatarUrl || '',
              participants: profileName,
              unreadMessageCount: 0,
              displayName: profileName,
              avatarUrl: profileAvatarUrl,
              isOnline: otherUserProfile?.isOnline || false
            }}
            isSelected={false}
            onClick={() => {}} // No click action for profile display
            onLeave={() => {}} // No leave action for profile
            userId={currentUser?.id}
            userFullName={currentUser?.fullName || undefined}
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

            {otherUserProfile && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${otherUserProfile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {otherUserProfile.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {otherUserProfile.lastOnlineTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Online
                    </label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(otherUserProfile.lastOnlineTime).toLocaleString()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDeleteChat}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};