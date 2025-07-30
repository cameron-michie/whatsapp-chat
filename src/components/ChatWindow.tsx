import React from 'react';
import { useParams } from 'react-router-dom';
import { ChatWindow as ChatWindowUI } from '../ably-ui-kits/components/molecules';
import { ChatRoomProvider, useMessages } from '@ably/chat/react';
import { useUser } from '@clerk/clerk-react';
import { useAvatarProfileSync } from '../hooks/useAvatarProfileSync';
import { useProfile } from '../contexts/ProfileContext';
import { parseDMRoomId } from '../utils/roomId';

// Inner component that uses the chat hooks
const ChatWindowContent: React.FC<{ roomId: string }> = ({ roomId }) => {
  // const room = useRoom(); // Room info available but not currently used
  useMessages(); // Initialize messages hook but don't use the return value
  const { user } = useUser();
  const { getUserName } = useProfile();

  // Sync profile data with avatar system for proper message avatars
  useAvatarProfileSync(roomId);

  // Calculate display name for the chat window
  const getDisplayName = (): string => {
    // Try to parse as DM room first
    const roomInfo = parseDMRoomId(roomId);
    if (roomInfo && user?.id) {
      // Find the other participant (not current user)
      const otherUserId = roomInfo.participants.find(id => id !== user.id);
      if (otherUserId) {
        // Get profile name for the other user
        const profileName = getUserName(otherUserId);
        return profileName !== otherUserId ? profileName : otherUserId;
      }
    }

    // Fallback to room ID for non-DM rooms or if parsing fails
    return roomId;
  };

  const displayName = getDisplayName();

  return (
    <ChatWindowUI
      roomName={roomId}
      displayName={displayName}
      enableTypingIndicators={true}
      autoEnterPresence={true}
      windowSize={1000}
      className="!w-full !max-w-none !min-w-0"
      // style={{ width: '100%', maxWidth: 'none', minWidth: 0 }}
      errorHandling={{
        onSendError: (error, text) => {
          console.error('Send error:', error, text);
        },
        onEditError: (error, message) => {
          console.error('Edit error:', error, message);
        },
        onDeleteError: (error, message) => {
          console.error('Delete error:', error, message);
        },
        onAddReactionError: (error, message, emoji) => {
          console.error('Add reaction error:', error, message, emoji);
        },
        onRemoveReactionError: (error, message, emoji) => {
          console.error('Remove reaction error:', error, message, emoji);
        },
      }}
    />
  );
};

export const ChatWindow: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();

  console.log('ChatWindow render:', { roomId });

  if (!roomId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-gray-500">No room selected</div>
      </div>
    );
  }

  return (
    <ChatRoomProvider
      key={roomId}
      name={roomId}
      options={{
        occupancy: { enableEvents: true },
      }}
    >
      <ChatWindowContent roomId={roomId} />
    </ChatRoomProvider>
  );
};
