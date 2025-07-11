'use client';
import Chat from './components/chat';
import AblyClient from './components/ably-client';
import Rooms from './components/rooms';
import WhosOnlineList from './components/whos-online-list';
import { redirect } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ChannelProvider } from 'ably/react';
import { ChatClient } from '@ably/chat';
import { ChatClientProvider } from '@ably/chat/react';
import * as Ably from 'ably';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'ably-chat-react-ui-components/dist/style.css';
import {
  App,
  AvatarProvider,
  ChatSettingsProvider,
  ThemeProvider,
} from 'ably-chat-react-ui-components';

const Page = ({ params }) => {
  const channelName = `${params.channel || 'general'}`;
  const { user } = useUser()    

  // Redirect to general channel if no specific channel is provided
  if (!params.channel) {
    redirect(`/chat/general`);
  }

  return (
    <AblyClient>
      <div className="grid grid-cols-4 h-[calc(100vh-72.8px)]">
       <div className="border-r border-gray-200 p-5">
         <ChannelProvider channelName={`${user.id}:notifications`} options={{ params: { rewind: '1' } }}>
            <Rooms />
         </ChannelProvider>
        </div>
        <div className="col-span-2 flex flex-col min-h-0">
          <Chat roomId={channelName} />
        </div>
        <div className="border-l border-gray-200 p-5">
          {/* Placeholder for other components like WhosOnlineList */}
          <ChannelProvider channelName="presence">
            <WhosOnlineList/>
          </ChannelProvider>
        </div>
      </div>
    </AblyClient>
  );
};

export default Page;
