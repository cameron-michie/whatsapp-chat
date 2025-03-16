'use client';

import * as Ably from "ably";
import { AblyProvider } from 'ably/react';
import { ChatClient } from '@ably/chat';
import { ChatClientProvider } from '@ably/chat/react';

class AblyClientSingleton {
  static instance = null;

  static getInstance() {
    if (typeof window === "undefined") return null;
    if (!AblyClientSingleton.instance) {
      AblyClientSingleton.instance = new Ably.Realtime({ 
        authUrl: "/api/ably/authenticate",
        autoConnect: typeof window !== 'undefined',
        loglevel: 3
       });
      AblyClientSingleton.instance.connection.on('connected', () => { console.log("Connected to Ably"); });
    }
    return AblyClientSingleton.instance;
  }
}

const AblyClient = ({ children }) => {
  const client = AblyClientSingleton.getInstance();
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
