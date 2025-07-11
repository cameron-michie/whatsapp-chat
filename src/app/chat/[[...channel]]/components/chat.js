//chat.js
'use client';
import { useEffect, useRef, useState, useContext } from 'react';
import { useAbly } from 'ably/react';
import MessageInput from './message-input';
import MessageList from './message-list';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation'
import { ChatContext } from './chat-context';

const Chat = ({ roomId }) => {
  const scrollRef = useRef(null);
  const chat = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [currentlyTyping, setCurrentlyTyping] = useState([]);
  const pathname = usePathname();
  const ably = useAbly();
  const { user } = useUser();
  const otherUserId = pathname.split(user.id).join('');

  useEffect(() => {
    if (!chat) return;

    const roomInstance = chat.rooms.get({ id: roomId });
    setRoom(roomInstance);

    const messageCallback = (message) => {
      setMessages((prevMessages) => [...prevMessages, message.message]);
    };

    const typingCallback = (typingData) => {
      setCurrentlyTyping(typingData.userIds);
    };

    roomInstance.messages.subscribe(messageCallback);
    roomInstance.typing.subscribe(typingCallback);

    return () => {
      roomInstance.messages.unsubscribe(messageCallback);
      roomInstance.typing.unsubscribe(typingCallback);
    };
  }, [chat, roomId]);

  useEffect(() => {
    if (room) {
      handleGetMessages();
    }
  }, [room]);

  useEffect(() => {
    scrollRef.current.scrollIntoView();
  }, [messages.length]);

  const handleSendMessage = (text) => {
    if (!room) {
      console.log('Room is not ready.');
      return;
    }

    room.messages.send({ text: text, metadata: { avatarUrl: user.imageUrl } })
      .then(() => {
        console.log(`Message sent successfully. ${user.fullName}: ${text}`);
      })
      .catch((error) => {
        console.error('Failed to send message:', error);
      });
    
    stopTyping();
  };

  const handleGetMessages = () => {
    if (!room) return;
    room.messages.get({ limit: 100, direction: 'forwards' })
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

  const startTyping = () => {
    if (room) {
      room.typing.start();
    }
  };

  const stopTyping = () => {
    if (room) {
      room.typing.stop();
    }
  };

  return (
    <>
      <div className="overflow-y-auto p-5">
        <MessageList messages={messages} user={user} />
        <div ref={scrollRef} />
        <div />
      </div>
      {currentlyTyping.length > 0 && (
        <p>Currently typing: {currentlyTyping.join(', ')}</p>
      )}
      <div className="p-5 mt-auto">
        <MessageInput
          onSubmit={handleSendMessage}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />
      </div>
    </>
  );
};

export default Chat;
