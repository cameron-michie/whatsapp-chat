'use client';

import * as Ably from "ably";
import { AblyProvider } from 'ably/react';
import { ChatClient } from '@ably/chat';
import { ChatClientProvider } from '@ably/chat/react';

const client = new Ably.Realtime({
  authUrl: "/api/ably/authenticate",
  autoConnect: typeof window !== 'undefined',
  loglevel: 3
});

ably.connection.on('connected', () => {
  console.log("Connected to Ably");
});
 
const AblyClient = ({ children }) => {
  const chatClient = new ChatClient(client);
  return (
    <AblyProvider client={client}>
      <ChatClientProvider client={chatClient}>
        {children}
      </ChatClientProvider>
    </AblyProvider>
  );
};

export default AblyClient;
