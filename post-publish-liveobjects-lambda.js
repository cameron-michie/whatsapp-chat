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
  
  console.log(`Updating LiveObjects for ${recipients.length} recipients`);
  
  // Create message preview (first 50 characters)
  const messagePreview = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;
  
  for (const recipientId of recipients) {
    try {
      const channelName = `roomslist:${recipientId.trim()}`;
      const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
      
      console.log(`Updating LiveObject for recipient: ${recipientId}`);
      
      // First, get the root object to find the room's objectId
      const rootResponse = await fetch(`${url}/root`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(ABLY_API_KEY).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!rootResponse.ok) {
        console.error(`Failed to get root object for recipient ${recipientId}:`, rootResponse.status);
        continue;
      }
      
      const rootData = await rootResponse.json();
      const roomObjectId = rootData.map?.entries?.[roomId]?.data?.objectId;
      
      if (!roomObjectId) {
        console.log(`Room ${roomId} not found in root for recipient ${recipientId}, creating new room`);
        await createLiveObjectForRecipient(recipientId, roomId, messagePreview, senderId, timestamp, recipients);
        continue;
      }
      
      console.log(`Found room objectId: ${roomObjectId} for recipient ${recipientId}`);
      
      // Update the room object using the correct format - send each operation separately
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
      
      // Try to send operations as a batch first (more efficient)
      console.log('🚀 Attempting batch operations:', JSON.stringify(updates, null, 2));
      
      try {
        const batchResponse = await makeAblyRequest(url, updates, ABLY_API_KEY);
        console.log('✅ Batch update successful:', JSON.stringify(batchResponse, null, 2));
        
      } catch (batchError) {
        console.log('❌ Batch update failed, falling back to individual operations:', batchError.message);
        
        // Check if the error is counter-related and try to fix it
        const counterOperation = updates.find(op => op.operation === 'COUNTER_INC');
        let counterCreateNeeded = false;
        
        if (counterOperation && batchError.message.includes('unreadMessageCount')) {
          console.log('🔄 Attempting to create missing LiveCounter');
          
          try {
            // Try to create the counter first
            const createCounterOperation = {
              operation: "COUNTER_CREATE",
              path: `${roomId}.unreadMessageCount`,
              data: { number: 1 }
            };
            
            console.log('Creating missing counter:', JSON.stringify(createCounterOperation, null, 2));
            const counterResult = await makeAblyRequest(url, createCounterOperation, ABLY_API_KEY);
            console.log('✅ Counter created:', JSON.stringify(counterResult, null, 2));
            counterCreateNeeded = true;
            
          } catch (createError) {
            console.error('❌ Failed to create counter:', createError.message);
          }
        }
        
        // Send remaining operations individually (excluding counter if we just created it)
        const operationsToSend = counterCreateNeeded 
          ? updates.filter(op => op.operation !== 'COUNTER_INC')
          : updates;
          
        console.log('📤 Sending individual operations:', operationsToSend.length);
        
        for (const update of operationsToSend) {
          console.log(`Sending individual operation:`, JSON.stringify(update, null, 2));
          
          try {
            const successResponse = await makeAblyRequest(url, update, ABLY_API_KEY);
            console.log(`✅ Successfully updated ${update.path} for recipient ${recipientId}`);
          } catch (individualError) {
            console.error(`❌ Individual operation failed for ${update.path}:`, individualError.message);
          }
        }
      }
      
    } catch (error) {
      console.error(`Error updating LiveObject for recipient ${recipientId}:`, error);
    }
  }
}

async function createLiveObjectForRecipient(recipientId, roomId, messagePreview, senderId, timestamp, recipients) {
  const ABLY_API_KEY = "ALwA2Q.4QI37w:D_h8yJGTdcH5Xp8ZB9d7Tt9Zbp7QjfuXTdAL3HLBV1Y";
  const channelName = `roomslist:${recipientId.trim()}`;
  const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;
  
  console.log(`Creating new LiveObject for recipient: ${recipientId}`);
  
  // Create room objects using the correct format - send each operation separately
  const createOperations = [
    // Create the room map
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
    // Create the unread counter within the room
    {
      operation: "COUNTER_CREATE",
      path: `${roomId}.unreadMessageCount`,
      data: { number: 1 }
    }
  ];
  
  try {
    // Send each create operation separately (batching doesn't work for MAP_CREATE + COUNTER_CREATE)
    console.log(`🏗️ Creating room and counter separately for recipient: ${recipientId}`);
    
    for (const [index, createOp] of createOperations.entries()) {
      console.log(`📤 Sending create operation ${index + 1}/${createOperations.length}:`, JSON.stringify(createOp, null, 2));
      
      try {
        const successResponse = await makeAblyRequest(url, createOp, ABLY_API_KEY);
        console.log(`✅ Successfully created ${createOp.path} for recipient ${recipientId}`);
        console.log(`📋 Create success response:`, JSON.stringify(successResponse, null, 2));
        
        // Small delay between operations to ensure room is ready for counter
        if (createOp.operation === 'MAP_CREATE') {
          console.log('⏳ Brief pause before creating counter...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (operationError) {
        console.error(`❌ Operation failed for ${createOp.path}:`, operationError.message);
        
        // If room creation failed, don't attempt counter creation
        if (createOp.operation === 'MAP_CREATE') {
          console.error(`💥 Room creation error, skipping counter creation`);
          break;
        }
      }
    }
    
    console.log(`🏁 Completed room creation process for recipient: ${recipientId}`);
    
  } catch (error) {
    console.error(`❌ Error creating LiveObject for recipient ${recipientId}:`, error);
  }
}