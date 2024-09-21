
import { Realtime } from "ably";
import { RoomOptionsDefaults, ChatClient } from '@ably/chat';
import { ChatClientProvider, ChatRoomProvider } from '@ably/chat/react';

const AblyClient = ({ children }) => {
    const client = new Realtime({
      authUrl: "/api/ably/authenticate",
      autoConnect: typeof window !== 'undefined',
    });
    const chatClient = new ChatClient(client);
  
    return (
      <ChatClientProvider client={chatClient}>
        <ChatRoomProvider id="presence" options={{presence: RoomOptionsDefaults.presence}}>
         {children}
        </ChatRoomProvider>
      </ChatClientProvider>
    );
}

export default AblyClient;