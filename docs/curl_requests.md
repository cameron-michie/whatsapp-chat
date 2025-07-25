# LiveObjects REST API Examples

This document provides curl commands to interact with your chat application's LiveObjects data in real-time. These commands are useful for testing, debugging, and managing room data.

## Environment Setup

```bash
# Set your Ably API key
export ABLY_API_KEY="your_ably_api_key_here"

# Set the user ID (use the one from your running app)
export USER_ID="demo-user-abc123"
```

## API Format Notes

**Important**: 
- **All operations**: Use `https://rest.ably.io/channels/{channelName}/objects`
- **GET operations**: Append `/{objectId}` for specific objects or `/compact` for simplified format
- **POST operations (create/update)**: Require array format `[{operation, path, data}, ...]`
- **Object paths**: For nested operations, use dot notation: `"objectId.property"`
- **Error handling**: Error code 92005 means the object path doesn't exist

## Room List Management

### 1. View Current Room List

```bash
# Get the entire room list LiveObject
curl -X GET "https://rest.ably.io/channels/roomslist:$USER_ID/objects/root" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json"
```

### 2. View Room List (Compact Format)

```bash
# Get room list in simplified format (better for debugging)
curl -X GET "https://rest.ably.io/channels/roomslist:$USER_ID/objects/root/compact" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" | jq
```

### 3. View Room List with All Child Objects

```bash
# Get room list with all nested room data
curl -X GET "https://rest.ably.io/channels/roomslist:$USER_ID/objects/root?children=true" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json"
```

## Creating Rooms

### 4. Create a New DM Room

```bash
# Create a new DM room via REST API
curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
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

### 5. Add a Group DM Room

```bash
# Create a group DM room
curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
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

## Updating Room Data

### 6. Update Message Preview and Unread Count

```bash
# Update latest message and increment unread count
curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
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

### 7. Mark Room as Read (Reset Unread Count)

```bash
# Reset unread count to 0
curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
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
      "data": { "string": "message-cursor-123" }
    }
  ]'
```

### 8. Remove Unread Counter (App's Reset Method)

```bash
# Remove the unread counter completely (how the app resets counters)
curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
    {
      "operation": "MAP_REMOVE",
      "path": "room-john-dm.unreadMessageCount"
    }
  ]'
```

## Room Management

### 9. Delete a Room

```bash
# Remove a room from the list entirely
curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
    {
      "operation": "MAP_REMOVE",
      "path": "room-john-dm"
    }
  ]'
```

### 10. Clear All Rooms

```bash
# Delete the entire root object (removes all rooms)
curl -X DELETE "https://rest.ably.io/channels/roomslist:$USER_ID/objects/root" \
  -u $ABLY_API_KEY
```

## Profile Management

### 11. View User Profile

```bash
# Get a user's profile data
curl -X GET "https://rest.ably.io/channels/profile:$USER_ID/objects/root/compact" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" | jq
```

### 12. Create/Update User Profile

```bash
# Create or update a user profile
curl -X POST "https://rest.ably.io/channels/profile:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
    {
      "operation": "MAP_SET",
      "path": "profile",
      "data": {
        "fullName": "John Smith",
        "avatarUrl": "https://example.com/avatar.jpg",
        "lastOnlineTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "isOnline": true
      }
    }
  ]'
```

## Monitoring and Debugging

### 13. Monitor Real-time Changes

```bash
# Subscribe to channel events to see real-time changes (keep running in terminal)
curl -X GET "https://rest.ably.io/channels/roomslist:$USER_ID/messages" \
  -u $ABLY_API_KEY \
  -H "Accept: text/event-stream"
```

### 14. Monitor Profile Changes

```bash
# Subscribe to profile channel events
curl -X GET "https://rest.ably.io/channels/profile:$USER_ID/messages" \
  -u $ABLY_API_KEY \
  -H "Accept: text/event-stream"
```

### 15. Bulk Room Creation (For Testing)

```bash
# Create multiple test rooms at once
curl -X POST "https://rest.ably.io/channels/roomslist:$USER_ID/objects" \
  -u $ABLY_API_KEY \
  -H "Content-Type: application/json" \
  -d '[
    {
      "operation": "MAP_CREATE",
      "path": "room-alice-dm",
      "data": {
        "chatRoomType": { "string": "DM" },
        "latestMessagePreview": { "string": "How are you doing?" },
        "latestMessageSender": { "string": "Alice Johnson" },
        "latestMessageTimestamp": { "string": "'$(date +%s)000'" },
        "participants": { "string": "'$USER_ID',Alice_Johnson" },
        "unreadMessageCount": { "number": 2 }
      }
    },
    {
      "operation": "MAP_CREATE", 
      "path": "room-team-chat",
      "data": {
        "chatRoomType": { "string": "groupDM" },
        "latestMessagePreview": { "string": "Meeting at 3pm today" },
        "latestMessageSender": { "string": "Sarah Wilson" },
        "latestMessageTimestamp": { "string": "'$(date +%s)000'" },
        "participants": { "string": "'$USER_ID',Alice_Johnson,Bob_Smith,Sarah_Wilson" },
        "unreadMessageCount": { "number": 5 }
      }
    }
  ]'
```

## Development Workflow

1. **Start the app**: `npm run dev`
2. **Note the USER_ID**: Check console for the generated `demo-user-*` ID
3. **Set environment variables**: Export your API key and user ID
4. **View current state**: Use command #2 to see existing room list
5. **Add test rooms**: Use commands #4, #5, or #15 to add rooms
6. **Watch real-time updates**: See rooms appear instantly in the UI
7. **Simulate activity**: Use command #6 to update message previews
8. **Test read functionality**: Use commands #7 or #8 to reset counters
9. **Monitor changes**: Use command #13 in a separate terminal

## Room Data Schema

Each room in the LiveObjects LiveMap has this structure:

```typescript
{
  "roomId": {
    "chatRoomType": "DM" | "topic" | "groupDM",
    "unreadMessageCount": number, // LiveCounter (optional)
    "lastMessageSeenCursor": string,
    "latestMessagePreview": string,
    "latestMessageSender": string,
    "latestMessageTimestamp": string, // Unix timestamp as string
    "displayMacroUrl": string, // avatar URL (optional)
    "participants": string // comma-separated user IDs
  }
}
```

## Profile Data Schema

User profiles are stored in `profile:userId` channels:

```typescript
{
  "profile": {
    "fullName": string,
    "avatarUrl": string,
    "lastOnlineTime": string, // ISO 8601 timestamp
    "isOnline": boolean
  }
}
```

## Troubleshooting

- **Error 92005**: Object path doesn't exist - create it first with `MAP_CREATE`
- **Error 40005**: Invalid API key or permissions
- **Error 40160**: Invalid channel name format
- **Empty responses**: Check that your USER_ID matches the one in the running app
- **Real-time not working**: Ensure WebSocket connections aren't blocked by firewall

## Tips

- Use `| jq` to format JSON responses nicely
- Keep monitoring commands running in separate terminals
- The app automatically removes counters when rooms are active - this is normal behavior
- Profile data is cached - changes may take a moment to appear in UI
- Use the compact format (`/compact`) for easier debugging