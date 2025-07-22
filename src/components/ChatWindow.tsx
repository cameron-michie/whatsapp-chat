import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ChatWindow as ChatWindowUI } from '../ably-ui-kits/components/molecules';
import { ChatRoomProvider } from '@ably/chat/react';
import { useUser } from '@clerk/clerk-react';

export const ChatWindow: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useUser();

  console.log('ChatWindow render:', { roomId });

  // Handle first message logic for new chat rooms
  const handleFirstMessage = useCallback(async (messageText: string) => {
    console.log('First message being sent:', messageText);
    // TODO: Implement LiveObjects room creation logic
    // This should:
    // 1. Check if this is truly the first message in the room
    // 2. Create/update the room entry in the sender's LiveObjects room list
    // 3. Create/update the room entry in all participants' LiveObjects room lists
    // 4. Set initial room metadata (participants, timestamps, etc.)

    // Placeholder for now
    console.log('First message LiveObjects logic not implemented yet');
  }, [roomId, user]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    // This would be called when any message is sent
    // For now, we'll assume it's handled by the ChatWindowUI internally
    // But we could intercept first messages here if needed
    console.log('Message being sent:', messageText);
  }, []);

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
    </ChatRoomProvider>
  );
};
