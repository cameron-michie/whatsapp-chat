export const handler = async (event) => {
  try {
    // Parse the incoming request body
    const request = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    // Extract message details
    const { message, room } = request;
    const { text, metadata, clientId } = message;
    
    // Profanity filter - common moderated words
    const profanityList = [
      'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap', 'bastard', 
      'piss', 'slut', 'whore', 'nigger', 'faggot', 'retard', 'cunt', 
      'dickhead', 'asshole', 'motherfucker', 'cocksucker', 'twat',
      'prick', 'wanker', 'tosser', 'bollocks', 'bloody', 'bugger',
      'christ', 'jesus', 'goddamn', 'goddam', 'dammit', 'damnit',
      'fag', 'dyke', 'homo', 'spic', 'chink', 'kike', 'gook',
      'wetback', 'raghead', 'towelhead', 'sandnigger', 'nazi',
      'commie', 'feminazi', 'libtard', 'conservitard', 'trumptard'
    ];
    
    // Check for profanity
    const textLower = text.toLowerCase();
    for (const word of profanityList) {
      if (textLower.includes(word)) {
        const censoredWord = word.charAt(0) + '*'.repeat(word.length - 1);
        return {
          statusCode: 200,
          body: JSON.stringify({
            action: 'reject',
            rejectionReason: {
              message: `Use of profanity is not accepted: ${censoredWord}`
            }
          })
        };
      }
    }
    
    // Parse recipients from metadata
    const recipients = metadata.recipients ? metadata.recipients.split(',') : [];
    
    if (recipients.length > 0) {
      // Update LiveObjects for each recipient
      await updateLiveObjectsForRecipients(recipients, room, text, clientId);
    }
    
    // Accept the message
    return {
      statusCode: 200,
      body: JSON.stringify({
        action: 'accept'
      })
    };
    
  } catch (error) {
    console.error('Error in moderation handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        action: 'reject',
        rejectionReason: {
          message: 'Internal server error during moderation'
        }
      })
    };
  }
};

async function updateLiveObjectsForRecipients(recipients, roomId, messageText, senderId) {
  const ABLY_API_KEY = process.env.ABLY_API_KEY;
  const timestamp = Date.now().toString();
  const messagePreview = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;
  
  for (const recipientId of recipients) {
    try {
      const channelName = `roomslist:${recipientId.trim()}`;
      const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
      
      const updatePayload = [
        {
          operation: "MAP_SET",
          path: `${roomId}.latestMessagePreview`,
          data: { string: messagePreview }
        },
        {
          operation: "MAP_SET", 
          path: `${roomId}.latestMessageSender`,
          data: { string: senderId }
        },
        {
          operation: "MAP_SET",
          path: `${roomId}.latestMessageTimestamp`, 
          data: { string: timestamp }
        },
        {
          operation: "COUNTER_INCREMENT",
          path: `${roomId}.unreadMessageCount`,
          data: { number: 1 }
        }
      ];
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(ABLY_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!response.ok) {
        const errorResponse = await response.json();
        console.error(`Failed to update LiveObject for recipient ${recipientId}:`, response.status, errorResponse);
        
        // If the object path doesn't exist (error code 92005), create the LiveObject
        if (errorResponse.error && errorResponse.error.code === 92005) {
          console.log(`LiveObject path doesn't exist, creating new LiveObject for recipient ${recipientId}`);
          await createLiveObjectForRecipient(recipientId, roomId, messagePreview, senderId, timestamp);
        }
      } else {
        console.log(`Successfully updated LiveObject for recipient ${recipientId}`);
      }
      
    } catch (error) {
      console.error(`Error updating LiveObject for recipient ${recipientId}:`, error);
    }
  }
}

async function createLiveObjectForRecipient(recipientId, roomId, messagePreview, senderId, timestamp) {
  const ABLY_API_KEY = process.env.ABLY_API_KEY;
  const channelName = `roomslist:${recipientId.trim()}`;
  const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
  
  const createPayload = [
    {
      operation: "MAP_CREATE",
      path: roomId,
      data: {
        chatRoomType: { string: "DM" },
        lastMessageSeenCursor: { string: "" },
        latestMessagePreview: { string: messagePreview },
        latestMessageSender: { string: senderId },
        latestMessageTimestamp: { string: timestamp },
        displayMacroUrl: { string: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}` },
        participants: { string: `${recipientId},${senderId}` },
        unreadMessageCount: { number: 1 }
      }
    }
  ];
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(ABLY_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });
    
    if (!response.ok) {
      const errorResponse = await response.json();
      console.error(`Failed to create LiveObject for recipient ${recipientId}:`, response.status, errorResponse);
    } else {
      console.log(`Successfully created LiveObject for recipient ${recipientId}`);
    }
    
  } catch (error) {
    console.error(`Error creating LiveObject for recipient ${recipientId}:`, error);
  }
}