# WhatsApp-Style Chat Application

A real-time chat application built with React, TypeScript, and Ably's LiveObjects + Chat SDK. Features a dual-panel interface with comprehensive profile management, online presence indicators, and intelligent unread message handling.

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Ably account with API key
- Clerk account for authentication

### 1. Clone and Install

```bash
git clone <repository-url>
cd whatsapp-chat
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Ably Configuration
VITE_ABLY_API_KEY=your_ably_api_key_here

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

**Getting your Ably API Key:**
1. Sign up at [ably.com](https://ably.com)
2. Create a new app in the Ably dashboard
3. Go to the "API Keys" tab
4. Copy the API key (it should start with something like `ALwA2Q.`)
5. Ensure the key has the following capabilities:
   - `publish`
   - `subscribe` 
   - `presence`
   - `history`
   - `object-subscribe`
   - `object-publish`

**Getting your Clerk Keys:**
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to "API Keys" in the dashboard
4. Copy the "Publishable key" and "Secret key"

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

### 4. Additional Commands

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Architecture Overview

### Technology Stack

- **Frontend**: React 19 with TypeScript and Vite
- **Real-time Communication**: Ably platform
  - LiveObjects for room metadata and user profiles
  - Chat SDK for messaging features
  - Presence API for online status
- **Authentication**: Clerk with automatic profile synchronization
- **UI Framework**: Custom Ably Chat React UI Components
- **Styling**: Tailwind CSS with dark/light theme support

### System Architecture

The application uses a dual-client architecture for optimal performance:

1. **Rooms List Client**: Manages LiveObjects for room metadata on private channels
2. **Chat Window Client**: Handles active chat conversations via Chat SDK

### Data Flow

```
User Authentication (Clerk)
    ↓
Profile Creation (profile:userId channel)
    ↓
Room List Management (roomslist:userId channel)
    ↓
Chat Messaging (room:roomId$$chat channel)
    ↓
Real-time Updates (LiveObjects + Chat SDK)
```

### Key Components

**Data Layer:**
- `ProfileContext`: Manages user profile data from LiveObjects
- `RoomsList`: Handles room metadata and unread counts
- `ChatWindow`: Active chat interface with full messaging features

**UI Layer:**
- `RoomListItem`: Reusable component for displaying users and rooms
- `UserProfileHeader`: Profile display with home navigation
- `OnlinePresence`: Shows who's currently online

### Channel Structure

- **Room Metadata**: `roomslist:userId` (private per user)
- **User Profiles**: `profile:userId` (public profile data)
- **Chat Messages**: `room:roomId$$chat` (via Chat SDK)
- **Presence**: `presence` (global presence channel)

### Room ID Format

Room IDs follow the pattern `room:{hash}` where the hash is generated from sorted participant user IDs. This ensures consistent room identification across users.

## Core Features

**Chat Functionality:**
- Real-time messaging with typing indicators
- Message reactions, editing, and deletion
- Auto-room creation when visiting URLs
- URL-based navigation and deep linking

**Profile and Presence:**
- Real user profiles fetched from Ably LiveObjects
- Online presence indicators with green status dots
- Profile-based avatars throughout the application
- Live "Who's Online" list

**Smart User Experience:**
- Intelligent unread count management
- Automatic counter reset when user is active in rooms
- Focus detection for better unread handling
- Clean message previews with proper sender names
- Recipient-aware message input placeholders

**User Interface:**
- Consistent RoomListItem components across all user displays
- Blue unread badges positioned on the right
- Green online indicators on profile avatars
- Home navigation button for easy access
- Responsive design for different screen sizes

## Development Workflow

1. Start the development server with `npm run dev`
2. Note the generated `demo-user-*` ID in the browser console
3. Open the application in multiple browser tabs/windows to test real-time features
4. Use the browser's developer tools to monitor network requests and console logs
5. For API testing, see `docs/curl_requests.md` for examples

## Project Structure

```
src/
├── components/           # React components
│   ├── ChatWindow.tsx   # Main chat interface
│   ├── RoomsList.tsx    # Sidebar with room list
│   └── OnlinePresence.tsx
├── contexts/            # React contexts
│   └── ProfileContext.tsx
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── ably-ui-kits/       # UI component library
└── main.tsx            # Application entry point

docs/
└── curl_requests.md    # API testing examples
```

## Configuration Notes

- The application uses Vite's environment variable system (variables must start with `VITE_`)
- Profile data is automatically synced on login and cached for performance
- Unread counters are managed through LiveObjects and reset intelligently based on user activity
- The UI components are imported from a local `ably-chat-react-ui-components` package

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and test thoroughly
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Create a Pull Request

## License

MIT License - see LICENSE file for details.