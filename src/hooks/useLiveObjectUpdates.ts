import { useEffect, useCallback } from 'react';
import { Room, Message } from '@ably/chat';
import { useUser } from '@clerk/clerk-react';
import { parseClientId } from '../utils/clientId';

const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY as string;

interface UseLiveObjectUpdatesProps {
  room: Room | null;
}

/**
 * Hook to handle client-side LiveObject updates when viewing/receiving messages
 * Updates lastMessageSeenCursor and resets unreadMessageCount
 */
export function useLiveObjectUpdates({ room }: UseLiveObjectUpdatesProps) {
  const { user } = useUser();

  const updateLiveObject = useCallback(async (
    userId: string,
    roomId: string,
    messageText: string,
    shouldResetUnreadCount: boolean = false
  ) => {
    try {
      const channelName = `roomslist:${userId}`;
      const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
      const messageCursor = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;

      const operations = [
        {
          operation: "MAP_SET",
          path: `${roomId}.lastMessageSeenCursor`,
          data: { string: messageCursor }
        }
      ];

      // Reset unread count if this is the latest message
      if (shouldResetUnreadCount) {
        operations.push({
          operation: "COUNTER_SET",
          path: `${roomId}.unreadMessageCount`,
          data: { number: 0 }
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(ABLY_API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(operations)
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error(`Failed to update LiveObject for user ${userId}:`, response.status, errorResponse);
      } else {
        console.log(`Successfully updated LiveObject for user ${userId}`);
      }
    } catch (error) {
      console.error(`Error updating LiveObject for user ${userId}:`, error);
    }
  }, []);

  const handleMessageReceived = useCallback(async (message: Message) => {
    if (!room || !user) return;

    try {
      const currentUserId = user.id;
      if (!currentUserId) return;

      // Parse the message sender
      const senderParsed = parseClientId(message.clientId);
      if (!senderParsed) {
        console.error('Failed to parse sender clientId:', message.clientId);
        return;
      }

      // If this is a message from someone else, update our LiveObject
      if (senderParsed.userId !== currentUserId) {
        console.log('Received message from another user, updating LiveObject');
        await updateLiveObject(currentUserId, room.roomId, message.text, false);
      }
    } catch (error) {
      console.error('Error in handleMessageReceived:', error);
    }
  }, [room, user, updateLiveObject]);

  const handleMessageViewed = useCallback(async (message: Message, isLatestMessage: boolean = false) => {
    if (!room || !user) return;

    try {
      const currentUserId = user.id;
      if (!currentUserId) return;

      console.log('Message viewed, updating LiveObject');
      await updateLiveObject(currentUserId, room.roomId, message.text, isLatestMessage);
    } catch (error) {
      console.error('Error in handleMessageViewed:', error);
    }
  }, [room, user, updateLiveObject]);

  // Subscribe to messages to handle updates automatically
  useEffect(() => {
    if (room && room.messages) {
      console.log('Setting up message subscription for LiveObject updates');
      
      room.messages.subscribe(handleMessageReceived);

      return () => {
        if (room.messages) {
          room.messages.unsubscribe(handleMessageReceived);
        }
      };
    } else {
      console.log('Room or room.messages not available yet', { room: !!room, messages: !!room?.messages });
    }
  }, [room, room?.messages, handleMessageReceived]);

  return { 
    updateLiveObject, 
    handleMessageReceived, 
    handleMessageViewed 
  };
}