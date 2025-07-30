import { ChatClientProvider } from '@ably/chat/react';
import { AblyProvider, ChannelProvider } from 'ably/react';
import React, { useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import './index.css';
import './dist_style.css';
import {
  AvatarProvider,
  ChatSettingsProvider,
  ThemeProvider,
} from './ably-ui-kits/providers';
import { ChatWindow } from './components/ChatWindow';
import { RoomsList } from './components/RoomsList';
import { OnlinePresence } from './components/OnlinePresence';
import { AppPresence } from './components/AppPresence';
import { ProfileProvider } from './contexts/ProfileContext';
import { useProfileUpdater } from './hooks/useProfileUpdater';
import { getAblyClients } from './services/ablyClient';

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
  const activeRoomId = roomMatch ? roomMatch[1] : null;

  const handleRoomSelect = useCallback((roomId: string) => {
    navigate(`/room/${roomId}`);
  }, [navigate]);

  // Create user ID for LiveObjects channel
  const userId = user?.id || '';

  // Create client ID for Ably Chat - use fullName.userId format
  const fullName = user?.fullName || 'Unknown User';
  const clientId = `${fullName.replace(/\s+/g, '_')}.${userId}`;

  // On home page, activeRoomId should be null
  const isHomePage = location.pathname === '/';
  const finalActiveRoomId = isHomePage ? null : activeRoomId;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading user information...</div>
      </div>
    );
  }

  // Update user profile on login
  // useProfileUpdater();

  // Get or create Ably clients (reused on rerenders if clientId is the same)
  const { ablyClient1, ablyClient2, chatClient } = getAblyClients(clientId);

  console.log('Authenticated User ID:', userId);
  console.log('User Name:', user.fullName);
  console.log('Chat client created for user:', chatClient);
  return (
    <ProfileProvider userId={userId}>
      <ThemeProvider options={{ persist: true, defaultTheme: 'light' }}>
        <AvatarProvider>
          <ChatSettingsProvider>
            <AblyProvider client={ablyClient1}>
              <ChannelProvider channelName="presence">
                <AppPresence>
                  <ChatClientProvider client={chatClient}>
                    <div className="flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden h-screen w-full">

                      {/* Sidebar - Rooms List */}
                      <div className="flex-shrink-0 w-1/4 min-w-80 max-w-96">
                        <ChannelProvider channelName={`roomslist:${userId}`} options={{ modes: ['OBJECT_SUBSCRIBE', 'OBJECT_PUBLISH'] }}>
                          <RoomsList
                            userId={userId}
                            onRoomSelect={handleRoomSelect}
                            activeRoomId={activeRoomId || undefined}
                          />
                        </ChannelProvider>
                      </div>

                      {/* Main Content - Chat Window */}
                      <main className="flex-1 overflow-hidden">
                        <Routes>
                          <Route path="/room/:roomId" element={<ChatWindow />} />
                          <Route path="/" element={
                            <div className="flex flex-col h-full">
                              <OnlinePresence onClose={() => { }} inlineMode={true} />
                            </div>
                          } />
                        </Routes>
                      </main>
                    </div>
                  </ChatClientProvider>
                </AppPresence>
              </ChannelProvider>
            </AblyProvider>
          </ChatSettingsProvider>
        </AvatarProvider>
      </ThemeProvider >
    </ProfileProvider>
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
