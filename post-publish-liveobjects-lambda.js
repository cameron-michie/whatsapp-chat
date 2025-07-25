export const handler = async (event) => {
  try {
    // Debug: Log the complete incoming request structure
    console.log('=== INCOMING WEBHOOK PAYLOAD ===');
    console.log('Full event:', JSON.stringify(event, null, 2));
    
    // Parse the incoming webhook payload
    let payload;
    if (event.body) {
      // API Gateway event (production)
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      // Direct Lambda invocation or test event
      payload = event;
    }
    
    console.log('Parsed payload:', JSON.stringify(payload, null, 2));
    
    // Extract webhook details
    const { source, appId, channel, messages } = payload;
    
    console.log(`Processing webhook: source=${source}, appId=${appId}, channel=${channel}`);
    console.log(`Messages array length: ${messages?.length || 0}`);
    
    if (!messages || messages.length === 0) {
      console.log('No messages to process');
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'success', message: 'No messages to process' })
      };
    }
    
    // Process each message
    for (const [index, rawMessage] of messages.entries()) {
      console.log(`Processing message ${index + 1}:`, JSON.stringify(rawMessage, null, 2));
      
      // Extract message details
      const { data, name, timestamp, clientId } = rawMessage;
      
      // Parse the JSON data string
      let parsedData = {};
      let messageText = '';
      
      try {
        if (typeof data === 'string') {
          parsedData = JSON.parse(data);
          messageText = parsedData.text || '';
        } else if (data && typeof data === 'object') {
          parsedData = data;
          messageText = data.text || '';
        }
      } catch (error) {
        console.log('Error parsing message data:', error);
        console.log('Raw data:', data);
        continue;
      }
      
      console.log(`Parsed data:`, JSON.stringify(parsedData, null, 2));
      console.log(`Message text: "${messageText}"`);
      console.log(`Sender (clientId): ${clientId}`);
      console.log(`Channel: ${channel}`);
      
      // Extract room ID from channel name (remove ::$chat suffix)
      const roomId = channel.replace(/::?\$chat$/, '');
      console.log(`Extracted room ID: ${roomId}`);
      
      // Extract recipients from parsed metadata
      let recipients = [];
      
      if (parsedData.metadata && parsedData.metadata.recipients) {
        const recipientsStr = parsedData.metadata.recipients;
        if (recipientsStr && recipientsStr.trim() !== '') {
          recipients = Array.isArray(recipientsStr) 
            ? recipientsStr 
            : recipientsStr.split(',').map(r => r.trim()).filter(r => r);
        }
      }
      
      console.log('Recipients extraction debug:', {
        hasMetadata: !!parsedData.metadata,
        rawRecipients: parsedData.metadata?.recipients,
        recipientsType: typeof parsedData.metadata?.recipients,
        finalRecipients: recipients
      });
      
      console.log('Recipients:', recipients);
      
      if (recipients.length > 0) {
        // Update LiveObjects for each recipient
        await updateLiveObjectsForRecipients(recipients, roomId, messageText, clientId, timestamp);
      } else {
        console.log('No recipients found - skipping LiveObjects update');
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', processed: messages.length })
    };
    
  } catch (error) {
    console.error('Error in post-publish handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error', 
        message: 'Internal server error during post-publish processing' 
      })
    };
  }
};

// Helper function to make Ably REST API requests
async function makeAblyRequest(url, operations, apiKey) {
  const isArray = Array.isArray(operations);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(operations)
  });
  
  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(`Ably API error: ${response.status} - ${JSON.stringify(errorResponse)}`);
  }
  
  return await response.json();
}

async function updateLiveObjectsForRecipients(recipients, roomId, messageText, senderId, messageTimestamp) {
  const ABLY_API_KEY = "ALwA2Q.4QI37w:D_h8yJGTdcH5Xp8ZB9d7Tt9Zbp7QjfuXTdAL3HLBV1Y";
  const timestamp = messageTimestamp ? messageTimestamp.toString() : Date.now().toString();
  const DEBUG = process.env.DEBUG_ENABLED === 'true';
  const log = DEBUG ? console.log : () => {};
  
  console.log(`🚀 Processing ${recipients.length} recipients in parallel`);
  
  // Create message preview (first 50 characters)
  const messagePreview = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;
  
  // Group recipients by user to batch room existence checks
  const uniqueUsers = [...new Set(recipients.map(r => r.trim()))];
  
  // Batch check room existence for all users in parallel
  const roomExistenceChecks = await Promise.allSettled(
    uniqueUsers.map(async (userId) => {
      const channelName = `roomslist:${userId}`;
      const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
      
      try {
        const rootResponse = await fetch(`${url}/root`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(ABLY_API_KEY).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!rootResponse.ok) {
          return { userId, exists: false, url, error: `Status: ${rootResponse.status}` };
        }
        
        const rootData = await rootResponse.json();
        const roomExists = !!rootData.map?.entries?.[roomId]?.data?.objectId;
        
        return { userId, exists: roomExists, url, rootData };
      } catch (error) {
        return { userId, exists: false, url, error: error.message };
      }
    })
  );
  
  // Create lookup map for room existence
  const roomExistenceMap = new Map();
  roomExistenceChecks.forEach((result) => {
    if (result.status === 'fulfilled') {
      roomExistenceMap.set(result.value.userId, result.value);
    } else {
      console.error(`❌ Failed to check room existence:`, result.reason);
    }
  });
  
  // Process all recipients in parallel
  const updatePromises = recipients.map(async (recipientId) => {
    const trimmedId = recipientId.trim();
    const roomInfo = roomExistenceMap.get(trimmedId);
    
    if (!roomInfo) {
      console.error(`❌ No room info for recipient ${trimmedId}`);
      return { recipientId: trimmedId, success: false, error: 'No room info' };
    }
    
    try {
      if (roomInfo.exists) {
        log(`📝 Updating existing room for recipient: ${trimmedId}`);
        return await updateExistingRoom(roomInfo.url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, trimmedId);
      } else {
        log(`🏗️ Creating new room for recipient: ${trimmedId}`);
        return await createNewRoom(roomInfo.url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, trimmedId);
      }
    } catch (error) {
      console.error(`❌ Error processing recipient ${trimmedId}:`, error.message);
      return { recipientId: trimmedId, success: false, error: error.message };
    }
  });
  
  // Wait for all updates to complete
  const results = await Promise.allSettled(updatePromises);
  
  // Log summary
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  console.log(`✅ Completed: ${successful} successful, ${failed} failed out of ${recipients.length} recipients`);
  
  if (failed > 0) {
    const failures = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'rejected' ? r.reason : r.value.error);
    console.error('❌ Failures:', failures);
  }
}

// Optimized function to update existing room
async function updateExistingRoom(url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, recipientId) {
  const updates = [
    {
      operation: "MAP_SET",
      path: `${roomId}`,
      data: { key: "latestMessagePreview", value: { string: messagePreview } }
    },
    {
      operation: "MAP_SET", 
      path: `${roomId}`,
      data: { key: "latestMessageSender", value: { string: senderId } }
    },
    {
      operation: "MAP_SET",
      path: `${roomId}`,
      data: { key: "latestMessageTimestamp", value: { string: timestamp } }
    },
    {
      operation: "MAP_SET",
      path: `${roomId}`,
      data: { key: "participants", value: { string: recipients.join(',') } }
    },
    {
      operation: "COUNTER_INC",
      path: `${roomId}.unreadMessageCount`,
      data: { number: 1 }
    }
  ];
  
  try {
    // Try batch update first
    const batchResponse = await makeAblyRequest(url, updates, ABLY_API_KEY);
    return { recipientId, success: true, method: 'batch' };
    
  } catch (batchError) {
    // Handle counter creation if needed
    const counterOperation = updates.find(op => op.operation === 'COUNTER_INC');
    let counterCreateNeeded = false;
    
    if (counterOperation && batchError.message.includes('unreadMessageCount')) {
      try {
        const createCounterOperation = {
          operation: "COUNTER_CREATE",
          path: `${roomId}.unreadMessageCount`,
          data: { number: 1 }
        };
        
        await makeAblyRequest(url, createCounterOperation, ABLY_API_KEY);
        counterCreateNeeded = true;
        
      } catch (createError) {
        console.error(`❌ Failed to create counter for ${recipientId}:`, createError.message);
      }
    }
    
    // Send remaining operations individually
    const operationsToSend = counterCreateNeeded 
      ? updates.filter(op => op.operation !== 'COUNTER_INC')
      : updates;
    
    const individualResults = await Promise.allSettled(
      operationsToSend.map(update => makeAblyRequest(url, update, ABLY_API_KEY))
    );
    
    const failed = individualResults.filter(r => r.status === 'rejected').length;
    
    return { 
      recipientId, 
      success: failed === 0, 
      method: 'individual',
      failed,
      total: operationsToSend.length
    };
  }
}

// Optimized function to create new room
async function createNewRoom(url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, recipientId) {
  const createOperations = [
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
        participants: { string: recipients.join(',') }
      }
    },
    {
      operation: "COUNTER_CREATE",
      path: `${roomId}.unreadMessageCount`,
      data: { number: 1 }
    }
  ];
  
  try {
    // Create room first
    await makeAblyRequest(url, createOperations[0], ABLY_API_KEY);
    
    // Small delay to ensure room is ready (optimized from 100ms)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Create counter
    await makeAblyRequest(url, createOperations[1], ABLY_API_KEY);
    
    return { recipientId, success: true, method: 'create' };
    
  } catch (error) {
    return { recipientId, success: false, method: 'create', error: error.message };
  }
}

// Legacy function - kept for backward compatibility
// NOTE: This function is deprecated in favor of the optimized createNewRoom function
async function createLiveObjectForRecipient(recipientId, roomId, messagePreview, senderId, timestamp, recipients) {
  console.log(`⚠️ Using legacy createLiveObjectForRecipient - consider updating to use createNewRoom`);
  
  const ABLY_API_KEY = "ALwA2Q.4QI37w:D_h8yJGTdcH5Xp8ZB9d7Tt9Zbp7QjfuXTdAL3HLBV1Y";
  const channelName = `roomslist:${recipientId.trim()}`;
  const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
  
  // Use the optimized createNewRoom function
  const result = await createNewRoom(url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, recipientId);
  
  if (!result.success) {
    console.error(`❌ Legacy room creation failed for ${recipientId}:`, result.error);
  } else {
    console.log(`✅ Legacy room creation succeeded for ${recipientId}`);
  }
  
  return result;
}