# WhatsApp/Slack-Style Chat Application

This is a WhatsApp/Slack-style chat application built with React, TypeScript, and Ably's LiveObjects + Chat SDK. It demonstrates innovative use of LiveObjects for room state management combined with the Chat SDK for real-time messaging.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your VITE_ABLY_API_KEY to .env

# Start development server
npm run dev

# Build for production
npm run build
```

## LiveObjects REST API Examples

Use these curl commands to monitor and manipulate your room list data in real-time:

**Important API Format Notes:**
- **All operations**: Use `https://main.realtime.ably.net/channels/{channelName}/objects`
- **GET operations**: Append `/{objectId}` for specific objects
- **POST operations (create/update)**: Require array format `[{operation, path, data}, ...]`
- **Object paths**: For nested operations, use dot notation: `"objectId.property"`
- **Error handling**: Error code 92005 means the object path doesn't exist

### Environment Setup

```bash
# Set your Ably API key
export ABLY_API_KEY="your_ably_api_key_here"

# Set the user ID (use the one from your running app)
export USER_ID="demo-user-abc123"
```

### 1. View Current Room List

```bash
# Get the entire room list LiveObject
curl -X GET "https://main.realtime.ably.net/channels/roomslist:$USER_ID/objects/root" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json"
```

### 2. View Room List with All Child Objects

```bash
# Get room list with all nested room data
curl -X GET "https://main.realtime.ably.net/channels/roomslist:$USER_ID/objects/root?children=true" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json"
```

### 3. Create a New DM Room - Corrected Format

```bash
# Create a new DM room via REST API using the correct format
curl -X POST "https://main.realtime.ably.net/channels/roomslist:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
        {
          "operation": "MAP_CREATE",
          "path": "room-john-dm3",
          "data": {
            "chatRoomType": { "string": "DM" },
            "lastMessageSeenCursor": { "string": "" },
            "latestMessagePreview": { "string": "Hey there! 👋" },
            "latestMessageSender": { "string": "John Smith" },
            "latestMessageTimestamp": { "string": "'$(date +%s)000'" },
            "displayMacroUrl": { "string": "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
            "participants": { "string": "'$USER_ID',John_Smith" },
            "unreadMessageCount": { "number" : 0 }
          }
        }
      ]'
```

### 4. Add a Group DM Room - Updated to Use Correct Endpoint

```bash
# Create a group DM room using the correct endpoint
curl -X POST "https://main.realtime.ably.net/channels/roomslist:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
      {
        "operation": "MAP_CREATE",
        "path": "room-group-dm",
        "data": {
          "chatRoomType": { "string": "groupDM" },
          "lastMessageSeenCursor": { "string": "" },
          "latestMessagePreview": { "string": "Great meeting everyone!" },
          "latestMessageSender": { "string": "Alice Smith" },
          "latestMessageTimestamp": { "string": "'$(date +%s)000'" },
          "displayMacroUrl": { "string": "https://api.dicebear.com/7.x/avataaars/svg?seed=Group" },
          "participants": { "string": "'$USER_ID',John_Smith,Jane_Doe,Alice_Smith" },
          "unreadMessageCount": { "number": 3 }
        }
      }
    ]'
```

### 5. Update Message Preview and Unread Count (Correct Format)

```bash
# Update latest message and increment unread count using the correct API format
curl -X POST "https://main.realtime.ably.net/channels/roomslist:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
    {
      "operation": "MAP_SET",
      "path": "room-john-dm.latestMessagePreview",
      "data": { "string": "Just sent you the files you needed!" }
    },
    {
      "operation": "MAP_SET", 
      "path": "room-john-dm.latestMessageSender",
      "data": { "string": "John Smith" }
    },
    {
      "operation": "MAP_SET",
      "path": "room-john-dm.latestMessageTimestamp", 
      "data": { "string": "'$(date +%s)000'" }
    },
    {
      "operation": "COUNTER_INCREMENT",
      "path": "room-john-dm.unreadMessageCount",
      "data": { "number": 1 }
    }
  ]'
```

**Note**: The correct endpoint is `https://main.realtime.ably.net/channels/{channelName}/objects` using POST method with an array of operations. Each operation path must include the object ID prefix (e.g., `"room-john-dm.latestMessagePreview"`). If the object doesn't exist, you'll get error code 92005 and should create it first.

### 6. Mark Room as Read (Reset Unread Count) - Corrected Format

```bash
# Reset unread count to 0 using the correct API format
curl -X POST "https://main.realtime.ably.net/channels/roomslist:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
    {
      "operation": "COUNTER_SET",
      "path": "room-john-dm.unreadMessageCount",
      "data": { "number": 0 }
    },
    {
      "operation": "MAP_SET",
      "path": "room-john-dm.lastMessageSeenCursor",
      "data": { "string": "Just sent you the files you needed!" }
    }
  ]'
```

### 7. Delete a Room

```bash
# Remove a room from the list
curl -X DELETE "https://main.realtime.ably.net/channels/roomslist:$USER_ID/objects/room-john-dm" \
  -u $ABLY_API_KEY \
```

### 8. Monitor Real-time Changes

```bash
# Subscribe to channel events to see real-time changes
curl -X GET "https://main.realtime.ably.net/channels/roomslist:$USER_ID/messages" \
  -u $ABLY_API_KEY \
  -H "Accept: text/event-stream"
```

## Development Workflow

1. **Start the app**: `npm run dev`
2. **Note the USER_ID**: Check console for the generated `demo-user-*` ID
3. **Set environment variables**: Export your API key and user ID
4. **View current state**: Use curl command #1 to see existing room list
5. **Add test rooms**: Use curl commands #3 and #4 to add rooms
6. **Watch real-time updates**: See rooms appear instantly in the UI
7. **Simulate message activity**: Use curl command #5 to update message previews
8. **Test read functionality**: Use curl command #6 to mark rooms as read

## Room List Schema

Each room in the LiveObjects LiveMap has this structure:

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

## Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Real-time**: Ably LiveObjects + Chat SDK
- **UI Components**: Custom Ably Chat React UI Components
- **State Management**: LiveObjects for room metadata, Chat SDK for messages
- **Styling**: Tailwind CSS with dark/light theme support

## Features

- ✅ WhatsApp/Slack-style dual-panel interface
- ✅ Real-time room list with unread counts
- ✅ Live message previews and timestamps
- ✅ Auto-room creation via URL visits
- ✅ Full Chat SDK integration (reactions, typing, etc.)
- ✅ LiveObjects-powered room state management
- ✅ URL-based navigation and deep linking


curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
    -u "$ABLY_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "data": {
        "room-john-dm": {
          "chatRoomType": "DM",
          "displayMacroUrl":
  "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
          "lastMessageSeenCursor": "",
          "latestMessagePreview": "Hey there! 👋",
          "latestMessageSender": "John_Smith",
          "latestMessageTimestamp": "1752837725000",
          "participants": "abc,John_Smith",
          "unreadMessageCount": 3
        },
        "room-jane-dm": {
          "chatRoomType": "DM",
          "displayMacroUrl":
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
          "lastMessageSeenCursor": "",
          "latestMessagePreview": "How are you doing?",
          "latestMessageSender": "Jane_Doe",
          "latestMessageTimestamp": "1752839836000",
          "participants": "abc,Jane_Doe",
          "unreadMessageCount": 0
        },
        "room-group-chat": {
          "chatRoomType": "groupDM",
          "displayMacroUrl":
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Group",
          "lastMessageSeenCursor": "",
          "latestMessagePreview": "Great meeting everyone!",
          "latestMessageSender": "Alice_Smith",
          "latestMessageTimestamp": "1752841000000",
          "participants": "abc,John_Smith,Jane_Doe,Alice_Smith",
          "unreadMessageCount": 6
        }
      }
    }'

    
// DElete
curl -X POST "https://rest.ably.io/channels/roomslist:abc/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
  "operation": "MAP_REMOVE",
  "objectId": "root",
  "data": {
    "key": "room-john-dm3"
  }
}'
