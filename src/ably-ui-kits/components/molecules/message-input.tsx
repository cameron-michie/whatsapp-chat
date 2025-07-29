import type { ErrorInfo, Message } from '@ably/chat';
import { useMessages, useTyping, useRoom } from '@ably/chat/react';
import { useUser } from '@clerk/clerk-react';
import React, { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

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
  const { sendMessage } = useMessages();
  const room = useRoom();
  const { user } = useUser();

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
      sendMessage({
        text: trimmedMessage,
        metadata: {
          recipients: recipients.join(',')
        }
      })
        .then(async (sentMessage) => {
          console.log("Chat message sent successfully:", sentMessage.serial);
          
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
  }, [sendMessage, stop, onSent, onSendError, enableTyping, room, user]);

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
