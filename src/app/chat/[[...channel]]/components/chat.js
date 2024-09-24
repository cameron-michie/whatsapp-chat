//chat.js
'use client';
import { useEffect, useRef, useState } from 'react';
import { useMessages, useRoom, useChatConnection, useTyping } from '@ably/chat/react';
import MessageInput from './message-input';
import MessageList from './message-list';
import { useUser } from '@clerk/nextjs';

const Chat = () => {
  const scrollRef = useRef(null);
  const { currentStatus } = useChatConnection();
  const [messages, setMessages] = useState([]);
  const { send, get, roomStatus } = useMessages({
    listener: (message) => {
      setMessages((prevMessages) => [...prevMessages, message.message]);
    },
    onDiscontinuity: (error) => {
      console.log('Discontinuity detected:', error);
    },
  });

  const { user } = useUser();

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

  return (
    <>
      <div className="overflow-y-auto p-5">
        <MessageList messages={messages} user={user} />
        <div ref={scrollRef} />
        <div />
      </div>
      <div className="p-5 mt-auto">
        <MessageInput
          onSubmit={handleSendMessage}
        />
      </div>
    </>
  );
};

export default Chat;
