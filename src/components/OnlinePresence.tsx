import React, { useEffect, useState } from 'react';
import { usePresenceListener } from 'ably/react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { createDMRoomId } from '../utils/roomId';

interface OnlineUser {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  timestamp: number;
}

interface OnlinePresenceProps {
  onClose: () => void;
}

export const OnlinePresence: React.FC<OnlinePresenceProps> = ({ onClose }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Use Ably presence listener to track who's online (presence entry handled at app level)
  const { presenceData } = usePresenceListener('presence');
  
  // Debug presence hook state
  useEffect(() => {
    console.log('usePresence hook state changed:', {
      presenceData,
      presenceDataType: typeof presenceData,
      presenceDataLength: presenceData?.length
    });
  }, [presenceData]);

  // Update online users list when presence data changes
  useEffect(() => {
    console.log('Raw presenceData:', presenceData);
    console.log('Current user ID:', user?.id);
    
    if (presenceData) {
      console.log('Processing presence data:', presenceData.map(member => ({
        clientId: member.clientId,
        data: member.data,
        action: member.action
      })));

      const users = presenceData
        .filter(member => {
          // member.data contains the presence data we set
          const hasValidData = member.data && typeof member.data === 'object' && member.data.userId;
          const isNotCurrentUser = member.data?.userId !== user?.id;
          const isValidMember = hasValidData && isNotCurrentUser;
          console.log('Filtering member:', member.clientId, 'isValid:', isValidMember, 'data:', member.data);
          return isValidMember;
        })
        .map(member => ({
          userId: member.data.userId,
          fullName: member.data.fullName,
          avatarUrl: member.data.avatarUrl,
          timestamp: member.data.timestamp
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)); // Sort alphabetically

      console.log('Filtered and mapped users:', users);
      setOnlineUsers(users);
    } else {
      console.log('No presence data available');
    }
  }, [presenceData, user?.id]);

  const handleStartChat = (targetUser: OnlineUser) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    console.log(`Starting chat with ${targetUser.fullName} (${targetUser.userId})`);
    const roomId = createDMRoomId(user.id, targetUser.userId);
    navigate(`/room/${roomId}`);
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Who's Online
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {onlineUsers.length} online
              </div>
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
        </div>

        {/* Online Users List */}
        <div className="max-h-96 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No one else is online
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                When others join, you'll see them here
              </p>
            </div>
          ) : (
            onlineUsers.map((onlineUser) => (
              <button
                key={onlineUser.userId}
                onClick={() => handleStartChat(onlineUser)}
                className="w-full px-6 py-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={onlineUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${onlineUser.fullName}`}
                    alt={`${onlineUser.fullName} avatar`}
                    className="w-12 h-12 rounded-full mr-4 bg-gray-200"
                  />
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {onlineUser.fullName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {onlineUser.userId}
                  </div>
                </div>

                {/* Chat Icon */}
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Click on anyone to start chatting</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
