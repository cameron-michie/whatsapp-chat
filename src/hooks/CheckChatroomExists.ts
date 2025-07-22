import { useEffect, useCallback } from 'react';
import { Room, Message } from '@ably/chat';
import { useUser } from '@clerk/clerk-react';
import { parseClientId, createClientId } from '../utils/clientId';
import { parseDMRoomId, getOtherParticipant } from '../utils/roomId';

const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY as string;

interface UseFirstMessageDetectionProps {
  room: Room | null;
  messages: Message[] | undefined;
}

/**
 * Hook to handle first message detection and LiveObject creation
 * Checks if chat exists in participants' roomslists and creates if needed
 */
export function useFirstMessageDetection({ room, messages }: UseFirstMessageDetectionProps) {
  const { user } = useUser();

  const checkChatroomExists = useCallback(async (recipientUserId: string, roomId: string): Promise<boolean> => {
    try {
      const url = `https://main.realtime.ably.net/channels/roomslist:${recipientUserId}/objects/root`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(ABLY_API_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to check chatroom existence:', response.status);
        return false;
      }

      const roomListData = await response.json();
      return roomListData.data && roomListData.data[roomId] !== undefined;
    } catch (error) {
      console.error('Error checking chatroom existence:', error);
      return false;
    }
  }, []);

  const createChatroomInLiveObject = useCallback(async (
    recipientUserId: string, 
    roomId: string, 
    messageText: string,
    senderDisplayName: string,
    senderUserId: string
  ) => {
    try {
      const channelName = `roomslist:${recipientUserId}`;
      const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
      const timestamp = Date.now().toString();
      const messagePreview = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;

      const createPayload = [
        {
          operation: "MAP_CREATE",
          path: roomId,
          data: {
            chatRoomType: { string: "DM" },
            lastMessageSeenCursor: { string: "" },
            latestMessagePreview: { string: messagePreview },
            latestMessageSender: { string: senderDisplayName },
            latestMessageTimestamp: { string: timestamp },
            displayMacroUrl: { string: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderDisplayName}` },
            participants: { string: `${recipientUserId},${senderUserId}` },
            unreadMessageCount: { number: 1 }
          }
        }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(ABLY_API_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error(`Failed to create LiveObject for recipient ${recipientUserId}:`, response.status, errorResponse);
      } else {
        console.log(`Successfully created LiveObject for recipient ${recipientUserId}`);
      }
    } catch (error) {
      console.error(`Error creating LiveObject for recipient ${recipientUserId}:`, error);
    }
  }, []);

  const handleFirstMessage = useCallback(async (message: Message) => {
    if (!room || !user) {
      console.log('HandleFirstMessage: Missing room or user', { room: !!room, user: !!user });
      return;
    }

    try {
      console.log('HandleFirstMessage: Processing room', { roomId: room.roomId, messageText: message.text });
      
      // Parse room ID to get participants
      const roomInfo = parseDMRoomId(room.roomId);
      if (!roomInfo) {
        console.error('Invalid room ID format:', room.roomId);
        console.log('Expected format: room-userId1__userId2-dm');
        return;
      }
      
      console.log('Parsed room info:', roomInfo);

      // Parse current user info from message
      const currentUserParsed = parseClientId(message.clientId);
      if (!currentUserParsed) {
        console.error('Failed to parse current user clientId:', message.clientId);
        return;
      }

      const currentUserId = currentUserParsed.userId;
      const otherUserId = getOtherParticipant(room.roomId, currentUserId);
      
      if (!otherUserId) {
        console.error('Could not find other participant in room:', room.roomId);
        return;
      }

      console.log('DM participants:', { currentUserId, otherUserId });

      // Check and create LiveObject for the other participant
      const otherUserChatroomExists = await checkChatroomExists(otherUserId, room.roomId);
      
      if (!otherUserChatroomExists) {
        console.log(`Creating LiveObject for other participant ${otherUserId}`);
        await createChatroomInLiveObject(
          otherUserId,
          room.roomId,
          message.text,
          currentUserParsed.displayName,
          currentUserParsed.userId
        );
      } else {
        console.log(`LiveObject already exists for participant ${otherUserId}`);
      }

      // Also create for current user if needed
      const currentUserChatroomExists = await checkChatroomExists(currentUserId, room.roomId);
      if (!currentUserChatroomExists) {
        console.log(`Creating LiveObject for current user ${currentUserParsed.displayName}`);
        // For current user, we don't have the other user's display name yet
        // We'll use their userId as display name for now
        await createChatroomInLiveObject(
          currentUserId,
          room.roomId,
          message.text,
          otherUserId, // Using userId as display name - could be enhanced later
          otherUserId
        );
      } else {
        console.log(`LiveObject already exists for current user`);
      }

    } catch (error) {
      console.error('Error in handleFirstMessage:', error);
    }
  }, [room, user, checkChatroomExists, createChatroomInLiveObject]);

  // Check for first message when joining room with no message history
  useEffect(() => {
    if (room && room.messages && messages && messages.length === 0) {
      console.log('Joined room with no message history, setting up first message detection');
      
      // Listen for the first message
      const handleMessage = (message: Message) => {
        console.log('First message detected:', message);
        handleFirstMessage(message);
      };

      room.messages.subscribe(handleMessage);

      return () => {
        if (room.messages) {
          room.messages.unsubscribe(handleMessage);
        }
      };
    } else {
      console.log('First message detection conditions not met:', { 
        room: !!room, 
        roomMessages: !!room?.messages, 
        messages: !!messages, 
        messageCount: messages?.length || 0 
      });
    }
  }, [room, room?.messages, messages?.length, handleFirstMessage]);

  return { checkChatroomExists, createChatroomInLiveObject, handleFirstMessage };
}