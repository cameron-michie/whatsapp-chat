'use client';
import { useEffect, useRef, useState } from 'react';
import { useMessages } from '@ably/chat/react';
import MessageInput from './message-input';
import MessageList from './message-list';
import { useUser } from '@clerk/nextjs';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const { send, get, getPreviousMessages } = useMessages({
    listener: (message) => {
      // Append new messages to the current state
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    onDiscontinuity: (error) => {
      console.log('Discontinuity detected:', error);
    },
  });

  const { user } = useUser();
  const scrollRef = useRef(null);

  useEffect(() => {
    // Fetch previous messages when the component mounts
    if (getPreviousMessages) {
      get({ limit: 100 }).then((result) => {
        setMessages(result.items);
      });
    }
  }, [getPreviousMessages]);

  const handleSendMessage = (text) => {
    send({ text: text, metadata: { avatarUrl: user.imageUrl } });
  };

  const handleGetMessages = (text) => {
    get({ limit: 3, direction: 'forwards' }).then((result) => console.log('Previous messages: ', result.items));
  };

  return (
    <>
      <div className="overflow-y-auto p-5">
        <MessageList messages={messages} user={user} />
        <div ref={scrollRef} />
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
