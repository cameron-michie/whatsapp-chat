import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ChatWindow as ChatWindowUI } from '../ably-ui-kits/components/molecules';
import { ChatRoomProvider, useRoom, useMessages } from '@ably/chat/react';
import { useUser } from '@clerk/clerk-react';
import { useFirstMessageDetection } from '../hooks/CheckChatroomExists';
import { useLiveObjectUpdates } from '../hooks/useLiveObjectUpdates';

// Inner component that uses the chat hooks
const ChatWindowContent: React.FC<{ roomId: string }> = ({ roomId }) => {
  const room = useRoom();
  const { messages } = useMessages();

  // Use our custom hooks
  useFirstMessageDetection({ room, messages });
  useLiveObjectUpdates({ room });

  console.log('ChatWindowContent render:', { roomId, messagesCount: messages?.length || 0 });

  return (
    <ChatWindowUI
      roomName={roomId}
      enableTypingIndicators={true}
      autoEnterPresence={true}
      windowSize={1000}
      className="!w-full !max-w-none !min-w-0"
      style={{ width: '100%', maxWidth: 'none', minWidth: 0 }}
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
      attach={true}
      release={true}
      options={{
        occupancy: { enableEvents: true },
      }}
    >
      <ChatWindowContent roomId={roomId} />
    </ChatRoomProvider>
  );
};
