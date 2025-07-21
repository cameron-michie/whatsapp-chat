import { ChatClient } from '@ably/chat';
import { ChatClientProvider } from '@ably/chat/react';
import * as Ably from 'ably';
import { AblyProvider, ChannelProvider } from 'ably/react';
import Objects from 'ably/objects';
import React, { useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import './index.css';
import '../dist/style.css';
import {
  AvatarProvider,
  ChatSettingsProvider,
  ThemeProvider,
} from './ably-ui-kits/providers';
import { ChatWindow } from './components/ChatWindow';
import { RoomsList } from './components/RoomsList';

// Vite will replace this at build time
const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY as string;
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

console.log('Ably API Key exists:', !!ABLY_API_KEY);
console.log('Clerk Key exists:', !!CLERK_PUBLISHABLE_KEY);

// Component to handle authenticated users
const AuthenticatedApp: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse current room from URL
  const roomMatch = location.pathname.match(/^\/room\/(.+)$/);
  const activeRoomId = roomMatch ? roomMatch[1] : undefined;

  const handleRoomSelect = useCallback((roomId: string) => {
    navigate(`/room/${roomId}`);
  }, [navigate]);

  // Create user ID for LiveObjects channel
  const userId = user?.id || '';

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading user information...</div>
      </div>
    );
  }

  return <AuthenticatedAppContent
    user={user}
    userId={userId}
    activeRoomId={activeRoomId}
    handleRoomSelect={handleRoomSelect}
  />;
};

// Main app content component
interface AuthenticatedAppContentProps {
  user: any;
  userId: string;
  activeRoomId: string | undefined;
  handleRoomSelect: (roomId: string) => void;
}

const AuthenticatedAppContent: React.FC<AuthenticatedAppContentProps> = ({
  user,
  userId,
  activeRoomId,
  handleRoomSelect,
}) => {
  // Create Ably Realtime client with LiveObjects plugin
  const ablyClient1 = new Ably.Realtime({
    key: ABLY_API_KEY,
    plugins: { Objects }
  });

  // Create Ably Realtime client for Chat Window with authenticated clientId
  const ablyClient2 = new Ably.Realtime({
    key: ABLY_API_KEY,
    clientId: userId,
  });

  // Create Chat client using the Ably client
  const chatClient = new ChatClient(ablyClient2);

  console.log('Authenticated User ID:', userId);
  console.log('User Name:', user.fullName);
  console.log('Chat client created for user:', chatClient);

  return (
    <ThemeProvider options={{ persist: true, defaultTheme: 'light' }}>
      <AvatarProvider>
        <ChatSettingsProvider>
          <AblyProvider client={ablyClient1}>
            <ChatClientProvider client={chatClient}>
              <div className="flex h-screen">
                {/* User Profile Section
                <div className="absolute top-4 right-4 z-20 flex items-center space-x-3 bg-white shadow-lg rounded-lg px-3 py-2">
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {user.fullName || user.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
 */}

                {/* Left Panel - Rooms List */}
                <ChannelProvider channelName={`roomslist:${userId}`} options={{ modes: ['OBJECT_SUBSCRIBE', 'OBJECT_PUBLISH'] }}>
                  <RoomsList
                    userId={userId}
                    onRoomSelect={handleRoomSelect}
                    activeRoomId={activeRoomId}
                  />
                </ChannelProvider>

                {/* Center Panel - Chat Window */}
                <div className="flex-1">
                  <Routes>
                    <Route path="/room/:roomId" element={<ChatWindow />} />
                    <Route path="/" element={
                      <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center p-8">
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Chat</h2>
                          <p className="text-gray-600 mb-6">Select a chat from the sidebar to start messaging.</p>
                        </div>
                      </div>
                    } />
                  </Routes>
                </div>
              </div>
            </ChatClientProvider>
          </AblyProvider>
        </ChatSettingsProvider>
      </AvatarProvider>
    </ThemeProvider >
  );
};

// Main App component with Clerk authentication
const App: React.FC = () => {
  return (
    <>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Chat App</h1>
            <p className="text-gray-600 mb-6">Please sign in to access your chat rooms and start messaging.</p>
            <RedirectToSignIn />
          </div>
        </div>
      </SignedOut>
    </>
  );
};

ReactDOM.createRoot(document.querySelector('#root') || document.createElement('div')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
