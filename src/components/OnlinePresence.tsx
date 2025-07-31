import React, { useEffect, useState } from 'react';
import { usePresenceListener } from 'ably/react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { createDMRoomId } from '../utils/roomId';
import { RoomListItem } from '../ably-ui-kits/components/molecules/room-list-item';
import { useProfile } from '../contexts/ProfileContext';

interface OnlineUser {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  timestamp: number;
}

interface OnlinePresenceProps {
  onClose: () => void;
  inlineMode?: boolean; // Show inline instead of as popup
}

export const OnlinePresence: React.FC<OnlinePresenceProps> = ({ onClose: _onClose, inlineMode = false }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { fetchProfile } = useProfile();

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
  // useEffect(() => {
  //   console.log('Raw presenceData:', presenceData);
  //   console.log('Current user ID:', user?.id);

  //   if (presenceData) {
  //     console.log('Processing presence data:', presenceData.map(member => ({
  //       clientId: member.clientId,
  //       data: member.data,
  //       action: member.action
  //     })));

  //     const users = presenceData
  //       .filter(member => {
  //         // Parse user info from clientId format: "FullName.userId"
  //         if (!member.clientId || !member.clientId.includes('.')) {
  //           console.log('Invalid clientId format:', member.clientId);
  //           return false;
  //         }

  //         const parts = member.clientId.split('.');
  //         const userId = parts[parts.length - 1]; // Get the last part (userId)
  //         const isNotCurrentUser = userId !== user?.id;
  //         const isPresent = member.action === 'present';
  //         const isValidMember = isNotCurrentUser && isPresent;

  //         console.log('Filtering member:', member.clientId, 'userId:', userId, 'isValid:', isValidMember, 'status:', member.data);
  //         return isValidMember;
  //       })
  //       .map(member => {
  //         // Parse user info from clientId format: "FullName.userId"
  //         const parts = member.clientId.split('.');
  //         const userId = parts[parts.length - 1];
  //         const fullName = parts.slice(0, -1).join('.').replace(/_/g, ' '); // Join all but last part, replace underscores

  //         return {
  //           userId,
  //           fullName,
  //           avatarUrl: undefined, // Will be fetched from ProfileContext
  //           timestamp: member.timestamp || Date.now()
  //         };
  //       })
  //       .sort((a, b) => a.fullName.localeCompare(b.fullName)); // Sort alphabetically

  //     console.log('Filtered and mapped users:', users);
  //     setOnlineUsers(users);

  //     // Fetch profile data for each online user to ensure we have up-to-date info
  //     users.forEach(onlineUser => {
  //       fetchProfile(onlineUser.userId);
  //     });
  //   } else {
  //     console.log('No presence data available');
  //   }
  // }, [presenceData, user?.id, fetchProfile]);
  // Update online users list when presence data changes
  useEffect(() => {
    if (presenceData && user?.id) {
      // Use a Map to store the latest presence entry for each unique userId.
      const uniqueUsersMap = presenceData.reduce((acc, member) => {
        // 1. Filter out invalid members, just like before.
        if (!member.clientId || !member.clientId.includes('.') || member.action !== 'present') {
          return acc;
        }

        const parts = member.clientId.split('.');
        const userId = parts[parts.length - 1];

        // 2. Exclude the current user from the list.
        if (userId === user.id) {
          return acc;
        }

        // 3. If the user is already in our map, only update if the new entry is more recent.
        const existingUser = acc.get(userId);
        if (existingUser && existingUser.timestamp >= member.timestamp) {
          return acc;
        }

        // 4. Add or update the user in the map.
        const fullName = parts.slice(0, -1).join('.').replace(/_/g, ' ');
        acc.set(userId, {
          userId,
          fullName,
          avatarUrl: undefined, // Will be fetched later
          timestamp: member.timestamp || Date.now(),
        });

        return acc;
      }, new Map<string, OnlineUser>());

      // Convert the map values to an array and sort it.
      const uniqueUsers = Array.from(uniqueUsersMap.values())
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      setOnlineUsers(uniqueUsers);

      // Fetch profile data for each unique online user.
      uniqueUsers.forEach(onlineUser => {
        fetchProfile(onlineUser.userId);
      });
    }
  }, [presenceData, user?.id, fetchProfile]);
  const handleStartChat = (targetUser: OnlineUser) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    console.log(`Starting chat with ${targetUser.fullName} (${targetUser.userId})`);
    const roomId = createDMRoomId(user.id, targetUser.userId);
    navigate(`/room/${roomId}`);
  };


  if (!user) {
    return null;
  }

  // Render inline mode for home page
  if (inlineMode) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Who's Online
                </h2>
              </div>
            </div>
            <div className="text-center mt-2 text-gray-500 dark:text-gray-400">
              {onlineUsers.length} people online · Click anyone to start chatting
            </div>
          </div>

          {/* Online Users List */}
          <div className="flex-1 overflow-y-auto p-6">
            {onlineUsers.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                    No one else is online
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    When others join the app, you'll see them here and can start chatting instantly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                {onlineUsers.map((onlineUser) => (
                  <div key={onlineUser.userId} className="mb-2">
                    <RoomListItem
                      roomName={`online-${onlineUser.userId}`}
                      roomData={{
                        chatRoomType: 'DM',
                        lastMessageSeenCursor: '',
                        latestMessagePreview: 'Online now',
                        latestMessageSender: '',
                        latestMessageTimestamp: onlineUser.timestamp.toString(),
                        avatarUrl: onlineUser.avatarUrl || '',
                        participants: onlineUser.fullName,
                        unreadMessageCount: 0,
                        displayName: onlineUser.fullName,
                        isOnline: true
                      }}
                      isSelected={false}
                      onClick={() => handleStartChat(onlineUser)}
                      onLeave={() => { }} // No leave function for online users
                      userId={user?.id}
                      userFullName={user?.fullName || undefined}
                      participantUserId={onlineUser.userId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

