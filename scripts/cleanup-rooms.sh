#!/bin/bash

# Script to clear all LiveObjects for specified users
# Removes all rooms/objects from roomslist:userId channels

ABLY_API_KEY="${VITE_ABLY_API_KEY:-$ABLY_API_KEY}"

# Target user IDs to clean up
USER_IDS=(
    "user_2hUyGM9IiZehPwBlrSOigZ6EHu0"
    "user_2hUyd4JpNzwphftRvtwlnb8W7S8"
    "user_30HNK6nodPBeewpeNXEXs4D0wwR"
)

if [ -z "$ABLY_API_KEY" ]; then
    echo "❌ Error: ABLY_API_KEY not set. Please set VITE_ABLY_API_KEY or ABLY_API_KEY environment variable"
    exit 1
fi

echo "🗑️  Cleaning up LiveObjects for ${#USER_IDS[@]} users"
echo ""

# Function to get all rooms from a user's roomslist
get_user_rooms() {
    local user_id="$1"
    local channel_name="roomslist:${user_id}"
    local url="https://rest.ably.io/channels/${channel_name}/objects/root"
    
    echo "🔍 Fetching rooms for user: $user_id"
    echo "   Channel: $channel_name"
    
    local response=$(curl -s -X GET "$url" \
        -u "$ABLY_API_KEY" \
        -H "Content-Type: application/json")
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully fetched rooms for $user_id"
        echo "$response" | jq -r '.map.entries | keys[]' 2>/dev/null || echo "   No rooms found or JSON parsing failed"
        return 0
    else
        echo "❌ Failed to fetch rooms for $user_id"
        echo "   Response: $response"
        return 1
    fi
}

# Function to delete all rooms for a user
delete_all_user_rooms() {
    local user_id="$1"
    local channel_name="roomslist:${user_id}"
    local base_url="https://rest.ably.io/channels/${channel_name}/objects"
    
    echo "🗑️  Getting rooms to delete for user: $user_id"
    
    # First, get the list of room keys
    local root_response=$(curl -s -X GET "${base_url}/root" \
        -u "$ABLY_API_KEY" \
        -H "Content-Type: application/json")
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to fetch root object for $user_id"
        return 1
    fi
    
    # Extract room keys using jq (if available) or basic parsing
    local room_keys
    if command -v jq >/dev/null 2>&1; then
        room_keys=$(echo "$root_response" | jq -r '.map.entries | keys[]?' 2>/dev/null)
    else
        # Fallback: basic grep/sed parsing (less reliable)
        room_keys=$(echo "$root_response" | grep -o '"[^"]*":{' | sed 's/"//g' | sed 's":{//g')
    fi
    
    if [ -z "$room_keys" ]; then
        echo "✅ No rooms found for user $user_id (or empty root object)"
        return 0
    fi
    
    echo "   Found rooms: $room_keys"
    
    # Delete each room individually
    while IFS= read -r room_key; do
        if [ -n "$room_key" ]; then
            echo "   🗑️  Deleting room: $room_key"
            
            local delete_response=$(curl -s -X POST "$base_url" \
                -u "$ABLY_API_KEY" \
                -H "Content-Type: application/json" \
                -d "{
                    \"operation\": \"MAP_REMOVE\",
                    \"objectId\": \"root\",
                    \"data\": {\"key\": \"$room_key\"}
                }")
            
            if [ $? -eq 0 ]; then
                echo "   ✅ Successfully deleted room: $room_key"
            else
                echo "   ❌ Failed to delete room: $room_key"
                echo "      Response: $delete_response"
            fi
        fi
    done <<< "$room_keys"
}

# Main cleanup loop
for user_id in "${USER_IDS[@]}"; do
    echo "=================================="
    echo "Processing user: $user_id"
    echo "=================================="
    
    # Show current rooms
    get_user_rooms "$user_id"
    echo ""
    
    # Delete all rooms
    delete_all_user_rooms "$user_id"
    echo ""
    
    # Verify cleanup
    echo "🔍 Verifying cleanup for $user_id:"
    get_user_rooms "$user_id"
    echo ""
done

echo "🧹 Cleanup complete for all users!"
echo ""
echo "📋 Summary:"
for user_id in "${USER_IDS[@]}"; do
    echo "   - Cleaned roomslist:$user_id"
done