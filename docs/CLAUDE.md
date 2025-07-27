# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **WhatsApp/Slack-style chat application** that demonstrates innovative use of Ably's LiveObjects with the Chat SDK. The application features a dual-panel layout: a left-hand rooms list for conversation management and a right-hand chat window for active conversations.

## Technology Stack

- **Frontend**: React 19.1.0 with TypeScript and Vite 7.0.4
- **Real-time**: Ably platform with Chat SDK (@ably/chat) and LiveObjects
- **UI Components**: Custom Ably Chat React UI Components (local dependency)
- **Build Tool**: Vite with SWC plugin for fast refresh

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Dual-Client Architecture
The application uses **two separate Ably clients**:
1. **Rooms List Client**: Manages LiveObjects for room metadata on private channels
2. **Chat Window Client**: Handles active chat conversations via Chat SDK

### Key Components Structure
- **RoomsList** (left panel): Displays conversations with unread counts and previews
- **ChatWindow** (right panel): Active chat interface with full Chat SDK features

### Room Management
- **Room IDs**: Follow pattern `room:{roomId}` where `roomId` is hash of sorted user IDs
- **Rooms List Channel**: `roomslist:{userId}` (private channel per user)
- **Chat Channels**: `room:{roomId}$$chat` (accessed via Pub/Sub API)

### LiveObjects Schema
Rooms list uses LiveMap with this structure:
```typescript
{
  "roomId": {
    "chatRoomType": "DM" | "topic" | "groupDM",
    "unreadMessageCount": number, // LiveCounter
    "lastMessageSeenCursor": string,
    "latestMessagePreview": string, // first 50 chars + '...'
    "latestMessageSender": string,
    "latestMessageTimestamp": string,
    "displayMacroUrl": string, // avatar URL
    "participants": string // comma-separated usernames
  }
}
```

## Key Implementation Details

### Local Package Integration
- UI components accessed via `../../ably-chat-react-ui-components`
- Uses `file:../../` dependency in package.json
- Vite configured with `preserveSymlinks: true`

### State Management Flow
1. New chats appear via LiveObjects REST API updates
2. RoomsList subscribes to chat channels via Pub/Sub API
3. LiveMap updates in batch for message previews, timestamps, unread counts
4. Room selection updates URL path and opens ChatWindow

### Environment Requirements
- `VITE_ABLY_API_KEY`: Required Ably API key environment variable
- Client ID generation: `demo-user-` + random string for demo purposes

## Project Structure

```
src/
├── main.tsx           # App entry point with providers
├── index.css          # Global styles
└── assets/           # Static assets

docs/
└── PROJECTPLAN.md    # Complete project specifications

Key files:
- vite.config.ts      # Vite configuration with symlinks
- tsconfig.json       # TypeScript project references
- eslint.config.js    # Modern flat ESLint config
```

## Development Notes

### Chat SDK Integration
- Use existing UI components from `ably-chat-react-ui-components`
- Chat SDK handles editing, deleting, reactions, and moderation
- Avoid reimplementing chat features - use provided UI kits

### React Hooks Usage
- Use Ably React hooks where available
- LiveObjects hooks don't exist yet - implement custom hooks
- Avoid hooks/providers for dynamic subscription lists in RoomsList

### URL Routing
- Room selection should update URL path: `/room/{roomId}`
- ChatWindow component should read roomId from URL path
- Navigation between rooms updates both URL and active chat

## LiveObjects Implementation Guide

### Core LiveObjects Setup
```typescript
import * as Ably from 'ably';
import Objects from 'ably/objects';

// Create Ably client with LiveObjects plugin
const realtimeClient = new Ably.Realtime({ 
  key: 'API_KEY', 
  plugins: { Objects } 
});

// Setup channel for LiveObjects
const channelOptions = { modes: ['OBJECT_SUBSCRIBE', 'OBJECT_PUBLISH'] };
const channel = realtimeClient.channels.get('roomslist:userId', channelOptions);
await channel.attach();
```

### LiveObjects API Patterns
- **LiveMap**: Key/value data structure with last-write-wins semantics
- **LiveCounter**: Numerical counter for unread message counts
- **Root Object**: Entry point LiveMap (cannot be deleted)
- **Batch Operations**: Atomic updates for related changes
- **Subscriptions**: Real-time updates via `subscribe()` method

### Room Management Implementation
```typescript
// Get root object for room list
const root = await channel.objects.getRoot();

// Create room structure
const roomData = await channel.objects.createMap({
  chatRoomType: 'DM',
  lastMessageSeenCursor: '',
  latestMessagePreview: 'Hi Cam, how are you?',
  latestMessageSender: 'John Smith',
  latestMessageTimestamp: Date.now().toString(),
  displayMacroUrl: 'www.example.com/avatar.png',
  participants: 'Cam_Michie,John_Smith'
});

// Create unread counter
const unreadCounter = await channel.objects.createCounter(0);
await roomData.set('unreadMessageCount', unreadCounter);

// Store room in root
await root.set('room-123', roomData);

// Subscribe to changes
root.subscribe((update) => {
  // Handle room list updates
  Object.keys(update).forEach(roomId => {
    const changeType = update[roomId];
    if (changeType === 'updated') {
      updateUIForRoom(roomId, root.get(roomId));
    } else if (changeType === 'removed') {
      removeRoomFromUI(roomId);
    }
  });
});
```

### Authentication & Capabilities
- Required capabilities: `['object-subscribe', 'object-publish']`
- Use token authentication for client-side access
- REST API available for server-side operations
- Default 100 objects per channel limit

### Performance Best Practices
- Use batch operations for atomic updates
- Subscribe only to necessary objects
- Handle sync states (`syncing`, `synced`) for loading indicators
- Implement proper error handling and retry logic

## Current Status
- Basic React app with Ably integration
- Providers configured (Theme, Avatar, ChatSettings, ChatClient)
- Hardcoded sidebar showing single room ("John")
- LiveObjects documentation explored and integrated
- Ready for RoomsList and ChatWindow component implementation