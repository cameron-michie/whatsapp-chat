//chat.js
'use client';
import { useEffect, useRef, useState } from 'react';
import { useAbly } from 'ably/react';
import { useMessages, usePresence, useRoom, useChatConnection, useTyping } from '@ably/chat/react';
import MessageInput from './message-input';
import MessageList from './message-list';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation'

const Chat = () => {
  const scrollRef = useRef(null);
  const { currentStatus } = useChatConnection();
  const [messages, setMessages] = useState([]);
  const pathname = usePathname();
  const ably = useAbly();
  const { send, get, roomStatus } = useMessages({
    listener: (message) => {
      setMessages((prevMessages) => [...prevMessages, message.message]);
    },
    onDiscontinuity: (error) => {
      console.log('Discontinuity detected:', error);
    },
  });

   const { leave, isPresent } = usePresence({
    enterWithData: { status: 'Online' },
    leaveWithData: { status: 'Offline' },
  });

  const { user } = useUser();
  const { start: startTyping, stop: stopTyping, currentlyTyping, error } = useTyping();
  const otherUserId = pathname.split(user.id).join('');

  useEffect(() => {
    
    let ignore = false;
    const fetchHist = async () => {
      if (!ignore) handleGetMessages();
    };
    fetchHist();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current.scrollIntoView();
  }, [messages.length]);

  const handleSendMessage = (text) => {
    if (roomStatus !== 'attached' || currentStatus !== 'connected') {
      console.log('Room or connection is not ready. Current roomStatus:', roomStatus, 'Connection status:', currentStatus);
      return;
    }

    send({ text: text, metadata: { avatarUrl: user.imageUrl } })
      .then(() => {
        console.log(`Message sent successfully. ${user.fullName}: ${text}`);
      })
      .catch((error) => {
        console.error('Failed to send message:', error);
      });
    
    stopTyping();  // Stop typing once the message is sent
  };

  const handleGetMessages = () => {
    get({ limit: 100, direction: 'forwards' })
      .then((histMessages) => {
        const newMessages = histMessages.items;

        if (newMessages.length === 0) {
          sendNotificationMessage(otherUserId);
          return; 
        }

        setMessages((prevMessages) => {
          const allMessages = [...prevMessages, ...newMessages];
          const uniqueMessagesMap = new Map();
          allMessages.forEach((message) => {
            uniqueMessagesMap.set(message.timeserial, message);
          });
          return Array.from(uniqueMessagesMap.values());
        });
      })
      .catch((error) => {
        console.error('Error fetching messages:', error);
      });
  };

  const sendNotificationMessage = (otherUserId) => {
    const channel = ably.channels.get(otherUserId + ':notifications');
    const member =  {
        userId: user.id,
        avatarUrl: user.imageUrl,
        fullName: user.fullName
      };

    channel.publish('new-chat', member, (err) => {
      if (err) {
        console.error('Error publishing message:', err);
      } else {
        console.log('Message sent successfully');
      }
    });
  };

  return (
    <>
      <div className="overflow-y-auto p-5">
        <MessageList messages={messages} user={user} />
        <div ref={scrollRef} />
        <div />
      </div>
      {currentlyTyping.length > 0 && (
        <p>Currently typing: {currentlyTyping.join(', ')}</p>  // Display who is typing
      )}
      <div className="p-5 mt-auto">
        <MessageInput
          onSubmit={handleSendMessage}
          onTypingStart={startTyping}  // Start typing when the user begins typing
          onTypingStop={stopTyping}    // Stop typing when the user stops typing
        />
      </div>
    </>
  );
};

export default Chat;
