import { ErrorInfo, Message } from '@ably/chat';
import { useMessages, useTyping, useRoom } from '@ably/chat/react';
import { useUser } from '@clerk/clerk-react';
import React, { ChangeEvent, KeyboardEvent, useCallback, useRef, useState } from 'react';

import { parseDMRoomId } from '../../../utils/roomId';

import { Button } from '../atoms/button.tsx';
import { Icon } from '../atoms/icon.tsx';
import { TextInput } from '../atoms/text-input.tsx';
import { EmojiPicker } from './emoji-picker.tsx';

/**
 * Props for the MessageInput component
 */
export interface MessageInputProps {
  /**
   * Callback function triggered when a message is sent.
   * Receives the built message as a parameter. This is useful for providing
   * an optimistic UI update or for handling the message in a parent component.
   *
   * The input field is automatically cleared after sending.
   * Typing indicators are stopped when a message is sent.
   *
   * @param message - The newly sent message object.
   *
   * @example
   * ```tsx
   * const handleSentMessage = async (message: Message) => {
   *  // alert('Message sent: ' + message.text);
   * };
   *
   * <MessageInput onSent={handleSent} />
   * ```
   */
  onSent?: (message: Message) => void;

  /**
   * Placeholder text displayed in the input field when empty.
   * Provides context about the input's purpose to users.
   *
   * @default "Type a message..."
   *
   * @example
   * ```tsx
   * <MessageInput
   *   placeholder="Send a message to the team..."
   *   onSend={handleSend}
   * />
   * ```
   */
  placeholder?: string;

  /**
   * Callback function triggered when sending a message fails.
   * Provides the error object and the text that failed to send.
   * If not provided, errors will be logged to console.
   *
   * @param error - The error that occurred during message sending
   * @param text - The text that failed to send
   *
   * @example
   * ```tsx
   * const handleSendError = (error: Error, text: string) => {
   *   toast.error(`Failed to send message: ${error.message}`);
   *   console.error('Send error:', error);
   * };
   *
   * <MessageInput
   *   onSent={handleSent}
   *   onSendError={handleSendError}
   * />
   * ```
   */
  onSendError?: (error: ErrorInfo, text: string) => void;

  /**
   * Whether to enable typing indicators when the user is typing.
   * When enabled, triggers typing indicators on keystroke and stops them
   * when the input is cleared or a message is sent.
   *
   * @default true
   *
   * @example
   * ```tsx
   * // Disable typing indicators for performance in large rooms
   * <MessageInput
   *   onSent={handleSent}
   *   enableTyping={false}
   * />
   * ```
   */
  enableTyping?: boolean;
}

/**
 * MessageInput component provides a comprehensive text input interface for composing and sending chat messages
 *
 * Core Features:
 * - Multi-line text input with automatic height adjustment (max 150px)
 * - Enter key to send (Shift+Enter for new line)
 * - Integrated emoji picker with cursor position insertion
 * - Typing indicators to alert others when composing messages
 * - Automatic input cleanup and focus management
 * - Accessible form controls with proper ARIA attributes
 * - Theme-aware styling (light/dark mode support)
 *
 * Typing Indicators:
 * - Triggered on each keystroke when content is present
 * - Automatically stopped when input is cleared or message is sent
 *
 * Emoji Integration:
 * - Picker positioned above the emoji button
 * - Smart cursor position handling for emoji insertion
 * - Maintains focus and cursor position after emoji selection
 * - Fallback behavior for browsers without selection API support
 *
 * @example
 * // Basic usage in chat interface
 * const [messages, setMessages] = useState<Message[]>([]);
 *
 * const handleSentMessage = (message) => {
 *   setMessages(prev => [...prev, message]);
 * };
 *
 * return (
 *   <div className="chat-container">
 *     <MessageList messages={messages} />
 *     <MessageInput
 *       onSent={handleSentMessage}
 *       placeholder="Type your message here..."
 *     />
 *   </div>
 * );
 *
 */

export const MessageInput = ({
  onSent,
  placeholder = 'Type a message...',
  onSendError,
  enableTyping = true,
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const messageRef = useRef('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { keystroke, stop } = useTyping();
  const { send } = useMessages();
  const room = useRoom();
  const { user } = useUser();

  /**
   * Updates LiveObjects for both current user and recipients when a message is sent
   */
  const updateLiveObjectsForMessage = useCallback(async (
    messageText: string, 
    senderId: string, 
    recipients: string[]
  ) => {
    console.log('=== STARTING LIVEOBJECTS UPDATE ===');
    console.log('Message text:', messageText);
    console.log('Sender ID:', senderId);
    console.log('Recipients:', recipients);
    
    if (!room || !user) {
      console.error('Missing room or user:', { room: !!room, user: !!user });
      return;
    }

    const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY;
    if (!ABLY_API_KEY) {
      console.error('ABLY_API_KEY not found in environment variables');
      return;
    }
    console.log('ABLY_API_KEY found:', ABLY_API_KEY.substring(0, 10) + '...');

    const roomId = room.roomName;
    const messagePreview = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;
    const timestamp = Date.now().toString();

    console.log('Processing for room:', roomId);
    console.log('Message preview:', messagePreview);
    console.log('Timestamp:', timestamp);

    // Update LiveObjects for all participants (including current user)
    const allParticipants = [user.id, ...recipients.filter(r => r !== user.id)];
    console.log('All participants to update:', allParticipants);
    
    for (const participantId of allParticipants) {
      try {
        console.log(`\n--- Processing participant: ${participantId} ---`);
        
        const channelName = `roomslist:${participantId}`;
        const url = `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/objects`;
        console.log('Channel name:', channelName);
        console.log('API URL:', url);
        
        // First, check if room exists by getting the root object
        console.log('Checking if room exists...');
        const rootResponse = await fetch(`${url}/root`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(ABLY_API_KEY)}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Root response status:', rootResponse.status);
        
        let roomExists = false;
        let rootData = null;
        if (rootResponse.ok) {
          rootData = await rootResponse.json();
          console.log('Root data received:', JSON.stringify(rootData, null, 2));
          roomExists = rootData.map?.entries?.[roomId] !== undefined;
          console.log(`Room ${roomId} exists:`, roomExists);
        } else {
          console.log('Failed to get root data:', await rootResponse.text());
        }

        if (roomExists) {
          console.log(`Updating existing room for participant ${participantId}`);
          
          // Get the room's objectId from the root data
          const roomObjectId = rootData.map?.entries?.[roomId]?.data?.objectId;
          console.log('Room objectId:', roomObjectId);
          
          if (!roomObjectId) {
            console.error('Room objectId not found in root data');
            continue;
          }
          
          // Update existing room using path notation - send each operation separately
          const updates = [
            {
              operation: "MAP_SET",
              path: `${roomId}.latestMessagePreview`,
              data: { key: "latestMessagePreview", value: { string: messagePreview } }
            },
            {
              operation: "MAP_SET",
              path: `${roomId}.latestMessageSender`, 
              data: { key: "latestMessageSender", value: { string: senderId } }
            },
            {
              operation: "MAP_SET",
              path: `${roomId}.latestMessageTimestamp`,
              data: { key: "latestMessageTimestamp", value: { string: timestamp } }
            },
            {
              operation: "MAP_SET",
              path: `${roomId}.participants`,
              data: { key: "participants", value: { string: allParticipants.join(',') } }
            }
          ];

          // Add counter increment for recipients (not sender)
          if (participantId !== user.id) {
            console.log('Adding unread count increment for recipient');
            updates.push({
              operation: "COUNTER_INCREMENT", 
              path: `${roomId}.unreadMessageCount`,
              data: { key: "unreadMessageCount", value: { number: 1 } }
            });
          } else {
            console.log('Skipping unread count increment for sender');
          }

          // Send each operation separately
          for (const update of updates) {
            console.log('Sending update:', JSON.stringify(update, null, 2));

            const updateResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(ABLY_API_KEY)}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(update)
            });

            console.log('Update response status:', updateResponse.status);

            if (!updateResponse.ok) {
              const errorResponse = await updateResponse.json();
              console.error(`Failed to update ${update.path} for participant ${participantId}:`, updateResponse.status, errorResponse);
              console.error('Update that failed:', JSON.stringify(update, null, 2));
            } else {
              const successResponse = await updateResponse.json();
              console.log(`Successfully updated ${update.path} for participant ${participantId}`);
              console.log('Update success response:', JSON.stringify(successResponse, null, 2));
            }
          }

        } else {
          console.log(`Creating new room for participant ${participantId}`);
          
          // Create new room for this participant - send each operation separately
          const initialCount = participantId !== user.id ? 1 : 0;
          console.log('Initial unread count:', initialCount);
          
          const createOperations = [
            // Create the room map
            {
              operation: "MAP_CREATE",
              path: roomId,
              data: {
                chatRoomType: { string: "DM" },
                lastMessageSeenCursor: { string: "" },
                latestMessagePreview: { string: messagePreview },
                latestMessageSender: { string: senderId },
                latestMessageTimestamp: { string: timestamp },
                displayMacroUrl: { string: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}` },
                participants: { string: allParticipants.join(',') }
              }
            },
            // Create the unread counter within the room
            {
              operation: "COUNTER_CREATE",
              path: `${roomId}.unreadMessageCount`,
              data: { key: "unreadMessageCount", value: { number: initialCount } }
            }
          ];

          // Send each create operation separately
          for (const createOp of createOperations) {
            console.log('Sending create operation:', JSON.stringify(createOp, null, 2));

            const createResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(ABLY_API_KEY)}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(createOp)
            });

            console.log('Create response status:', createResponse.status);

            if (!createResponse.ok) {
              const errorResponse = await createResponse.json();
              console.error(`Failed to create ${createOp.path} for participant ${participantId}:`, createResponse.status, errorResponse);
              console.error('Create operation that failed:', JSON.stringify(createOp, null, 2));
            } else {
              const successResponse = await createResponse.json();
              console.log(`Successfully created ${createOp.path} for participant ${participantId}`);
              console.log('Create success response:', JSON.stringify(successResponse, null, 2));
            }
          }
        }
        
      } catch (error) {
        console.error(`Error updating LiveObject for participant ${participantId}:`, error);
      }
    }
    
    console.log('=== LIVEOBJECTS UPDATE COMPLETE ===\n');
  }, [room, user]);

  /**
   * Updates only the sender's LiveObjects to reset unread count and update cursor
   */
  const updateSenderLiveObjects = useCallback(async (
    senderId: string,
    roomId: string,
    sentMessage: Message
  ) => {
    const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY;
    if (!ABLY_API_KEY) {
      console.error('ABLY_API_KEY not found in environment variables');
      return;
    }

    console.log('=== UPDATING SENDER LIVEOBJECTS ===');
    console.log('Sender ID:', senderId);
    console.log('Room ID:', roomId);
    console.log('Message timeserial:', sentMessage.timeserial);

    try {
      const channelName = `roomslist:${senderId}`;
      const url = `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/objects`;
      
      console.log('Sender channel:', channelName);
      console.log('API URL:', url);

      // Update sender's room to reset unread count and update cursor
      const updates = [
        {
          operation: "COUNTER_SET",
          path: `${roomId}.unreadMessageCount`,
          data: { number: 0 }
        },
        {
          operation: "MAP_SET",
          path: roomId,
          data: { key: "lastMessageSeenCursor", value: { string: sentMessage.timeserial || '' } }
        }
      ];

      // Send each operation separately
      for (const update of updates) {
        console.log('Sending sender update:', JSON.stringify(update, null, 2));

        const updateResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(ABLY_API_KEY)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update)
        });

        console.log('Sender update response status:', updateResponse.status);

        if (!updateResponse.ok) {
          const errorResponse = await updateResponse.json();
          console.error(`Failed to update sender ${update.data.key}:`, updateResponse.status, errorResponse);
        } else {
          const successResponse = await updateResponse.json();
          console.log(`Successfully updated sender ${update.data.key}`);
          console.log('Sender update success response:', JSON.stringify(successResponse, null, 2));
        }
      }

    } catch (error) {
      console.error('Error updating sender LiveObjects:', error);
    }

    console.log('=== SENDER LIVEOBJECTS UPDATE COMPLETE ===');
  }, []);

  /**
   * Handles sending the message, clearing the input, and stopping typing indicators
   */
  const handleSend = useCallback(() => {
    const trimmedMessage = messageRef.current.trim();
    console.log("=== MESSAGE SEND STARTED ===");
    console.log("Message text:", trimmedMessage);
    console.log("Room:", room?.roomName);
    console.log("User:", user?.id);
    
    if (trimmedMessage && room && user) {
      // Extract recipients from room ID
      const roomInfo = parseDMRoomId(room.roomName);
      let recipients: string[] = [];
      
      console.log("Room info parsed:", roomInfo);
      
      if (roomInfo) {
        // For DM rooms, recipients are ALL participants
        recipients = roomInfo.participants;
        console.log("Recipients extracted:", recipients);
      } else {
        console.warn("No room info found for room:", room.roomName);
      }
      
      console.log("Sending chat message...");
      // Send message with recipients metadata (keep for Lambda backup)
      send({ 
        text: trimmedMessage,
        metadata: {
          recipients: recipients.join(',')
        }
      })
        .then(async (sentMessage) => {
          console.log("Chat message sent successfully:", sentMessage.timeserial);
          console.log("Updating sender's LiveObjects for unread count and cursor...");
          
          // Update only the sender's own LiveObjects (reset unread count, update cursor)
          await updateSenderLiveObjects(user.id, room.roomName, sentMessage);
          
          console.log("Sender LiveObjects updated, cleaning up UI...");
          
          onSent?.(sentMessage);
          setMessage('');
          messageRef.current = '';
          if (enableTyping) {
            stop().catch((error: unknown) => {
              console.warn('Stop typing failed:', error);
            });
          }
          
          console.log("=== MESSAGE SEND COMPLETE ===");
        })
        .catch((error: unknown) => {
          console.error("Failed to send chat message:", error);
          if (onSendError) {
            onSendError(error as ErrorInfo, trimmedMessage);
          } else {
            console.error('Chat send error:', error);
          }
        });
    } else {
      console.warn("Send aborted - missing data:", {
        hasMessage: !!trimmedMessage,
        hasRoom: !!room,
        hasUser: !!user
      });
    }
  }, [send, stop, onSent, onSendError, enableTyping, room, user, updateLiveObjectsForMessage]);

  /**
   * Handles changes to the input field
   * Updates the message state and manages typing indicators
   *
   * @param e - The input change event
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    messageRef.current = newValue;

    if (enableTyping) {
      // Call keystroke on each keypress when there's content
      if (newValue.trim()) {
        keystroke().catch((error: unknown) => {
          console.warn('Keystroke failed:', error);
        });
      } else {
        // Stop typing indicator when all text is deleted
        stop().catch((error: unknown) => {
          console.warn('Stop typing failed:', error);
        });
      }
    }
  };

  /**
   * Handles keyboard events in the input field
   * Sends the message when Enter is pressed (without Shift)
   *
   * @param e - The keyboard event
   */
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Opens the emoji picker and positions it relative to the emoji button
   */
  const handleEmojiButtonClick = () => {
    // Position emoji picker above the emoji button
    const button = document.querySelector('[data-emoji-button]');
    if (button) {
      const rect = button.getBoundingClientRect();
      const pickerWidth = 200;
      const pickerHeight = 200;

      // Position above the button
      const left = Math.max(10, rect.left - pickerWidth / 2 + rect.width / 2);
      const top = rect.top - pickerHeight - 10;

      setEmojiPickerPosition({ top, left });
      setShowEmojiPicker(true);
    }
  };

  /**
   * Handles emoji selection from the emoji picker
   * Inserts the emoji at the current cursor position
   *
   * @param emoji - The selected emoji character
   */
  const handleEmojiSelect = (emoji: string) => {
    // Insert emoji at current cursor position or at the end
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      messageRef.current = newMessage; // Keep ref in sync

      // Trigger keystroke for emoji insertion
      if (enableTyping) {
        keystroke().catch((error: unknown) => {
          console.warn('Keystroke failed:', error);
        });
      }

      // Focus back on input and set cursor position after emoji
      setTimeout(() => {
        input.focus();
        const newCursorPosition = start + emoji.length;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    } else {
      // Fallback: append to end
      const newMessage = message + emoji;
      setMessage(newMessage);
      messageRef.current = newMessage; // Keep ref in sync
      if (enableTyping) {
        keystroke().catch((error: unknown) => {
          console.warn('Keystroke failed:', error);
        });
      }
    }

    setShowEmojiPicker(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900" role="form" aria-label="Message input">
      <div className="border border-gray-300 dark:border-gray-600 rounded-2xl p-2">
        <div className="flex items-end gap-3">
          {/* Text Input */}
          <TextInput
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            variant="message"
            multiline={true}
            maxHeight="150px"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
            aria-label="Message text"
          />

          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 self-end mb-1"
            onClick={handleEmojiButtonClick}
            data-emoji-button
            aria-label="Open emoji picker"
            aria-haspopup="dialog"
            aria-expanded={showEmojiPicker}
          >
            <Icon name="emoji" size="md" aria-hidden={true} />
          </Button>
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onClose={() => {
            setShowEmojiPicker(false);
          }}
          onEmojiSelect={handleEmojiSelect}
          position={emojiPickerPosition}
        />
      )}
    </div>
  );
};
