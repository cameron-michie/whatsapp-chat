export const handler = async (event) => {
  try {
    // Debug: Log the complete incoming request structure
    console.log('=== INCOMING WEBHOOK PAYLOAD ===');
    console.log('Full event:', JSON.stringify(event, null, 2));

    // Parse the incoming webhook payload
    let payload;
    if (event.body) {
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
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

    for (const [index, rawMessage] of messages.entries()) {
      console.log(`Processing message ${index + 1}:`, JSON.stringify(rawMessage, null, 2));

      const { data, name, timestamp, clientId, summary, action } = rawMessage;
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

      let hasReactions = false;
      let isReactionEvent = false;
      let reactionPreview = '';
      let actualSenderId = clientId; // Default to original message sender

      if (summary && summary['reaction:distinct.v1']) {
        hasReactions = true;
        const reactions = summary['reaction:distinct.v1'];
        if (action === 4 && hasReactions) {
          isReactionEvent = true;
          
          // For reaction events, find the actual reactor from the reactions summary
          const reactionEmojis = Object.keys(reactions);
          const latestEmoji = reactionEmojis[reactionEmojis.length - 1];
          const latestReaction = reactions[latestEmoji];
          
          // Get the most recent reactor (last clientId in the array)
          if (latestReaction.clientIds && latestReaction.clientIds.length > 0) {
            actualSenderId = latestReaction.clientIds[latestReaction.clientIds.length - 1];
            console.log(`Reaction event: actual reactor is ${actualSenderId}, not original sender ${clientId}`);
          }
          
          const senderName = actualSenderId.includes('.') ? actualSenderId.split('.')[0].replace('_', ' ') : actualSenderId;
          const truncatedMessage = messageText.length > 30 ? messageText.substring(0, 27) + '...' : messageText;
          reactionPreview = ` reacted ${latestEmoji} to "${truncatedMessage}"`;
          console.log(`Detected reaction event: ${reactionPreview}`);
        } else {
          const reactionEntries = Object.entries(reactions).map(([emoji, data]) => `${emoji}(${data.total})`);
          reactionPreview = reactionEntries.join(' ');
          console.log(`Message has reactions: ${reactionPreview}`);
        }
      }

      console.log(`Parsed data:`, JSON.stringify(parsedData, null, 2));
      console.log(`Message text: "${messageText}"`);
      console.log(`Original sender (clientId): ${clientId}`);
      console.log(`Actual sender (for LiveObjects): ${actualSenderId}`);
      console.log(`Channel: ${channel}`);

      const roomId = channel.replace(/::?\$chat$/, '');
      console.log(`Extracted room ID: ${roomId}`);

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
        await updateLiveObjectsForRecipients(
          recipients,
          roomId,
          messageText,
          actualSenderId, // Use actualSenderId which is the reactor for reaction events
          timestamp,
          hasReactions,
          reactionPreview,
          isReactionEvent
        );
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
  console.log(`➡️ [makeAblyRequest] URL: ${url}`);
  console.log(`➡️ [makeAblyRequest] Operations: ${JSON.stringify(operations, null, 2)}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(operations)
  });

  console.log(`⬅️ [makeAblyRequest] Status: ${response.status}`);
  const resJson = await response.json().catch(() => ({}));
  console.log(`⬅️ [makeAblyRequest] Response: ${JSON.stringify(resJson, null, 2)}`);

  if (!response.ok) {
    throw new Error(`Ably API error: ${response.status} - ${JSON.stringify(resJson)}`);
  }

  return resJson;
}

async function updateLiveObjectsForRecipients(
  recipients,
  roomId,
  messageText,
  senderId,
  messageTimestamp,
  hasReactions = false,
  reactionPreview = '',
  isReactionEvent = false
) {
  const ABLY_API_KEY = "ALwA2Q.4QI37w:D_h8yJGTdcH5Xp8ZB9d7Tt9Zbp7QjfuXTdAL3HLBV1Y";
  const timestamp = messageTimestamp ? messageTimestamp.toString() : Date.now().toString();

  console.log(`🚀 Updating LiveObjects for ${recipients.length} recipients`);
  console.log(`🚀 roomId=${roomId}, senderId=${senderId}, isReactionEvent=${isReactionEvent}`);

  let messagePreview;
  if (isReactionEvent) {
    messagePreview = reactionPreview;
  } else {
    messagePreview = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;
    if (hasReactions && reactionPreview && !isReactionEvent) {
      messagePreview = `${messagePreview} • ${reactionPreview}`;
    }
  }

  console.log(`📌 Computed messagePreview: "${messagePreview}"`);

  const uniqueUsers = [...new Set(recipients.map(r => r.trim()))];
  console.log(`👥 Unique recipients: ${JSON.stringify(uniqueUsers)}`);

  const roomExistenceChecks = await Promise.allSettled(
    uniqueUsers.map(async (userId) => {
      const channelName = `roomslist:${userId}`;
      const url = `https://main.realtime.ably.net/channels/${encodeURIComponent(channelName)}/objects`;

      console.log(`🔍 Checking room existence for ${userId} at ${url}/root`);
      try {
        const rootResponse = await fetch(`${url}/root`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(ABLY_API_KEY).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`⬅️ Root check status for ${userId}: ${rootResponse.status}`);
        const rootData = await rootResponse.json().catch(() => ({}));
        console.log(`⬅️ Root data for ${userId}: ${JSON.stringify(rootData, null, 2)}`);

        const roomExists = !!rootData.map?.entries?.[roomId]?.data?.objectId;
        return { userId, exists: roomExists, url, rootData };
      } catch (error) {
        console.error(`❌ Error checking room existence for ${userId}: ${error.message}`);
        return { userId, exists: false, url, error: error.message };
      }
    })
  );

  const roomExistenceMap = new Map();
  roomExistenceChecks.forEach((result) => {
    if (result.status === 'fulfilled') {
      roomExistenceMap.set(result.value.userId, result.value);
    } else {
      console.error(`❌ Failed to check room existence:`, result.reason);
    }
  });

  const updatePromises = recipients.map(async (recipientId) => {
    const trimmedId = recipientId.trim();
    const roomInfo = roomExistenceMap.get(trimmedId);

    console.log(`📨 Starting LiveObjects update for ${trimmedId}`);

    if (!roomInfo) {
      console.error(`❌ No room info for recipient ${trimmedId}`);
      return { recipientId: trimmedId, success: false, error: 'No room info' };
    }

    try {
      if (roomInfo.exists) {
        console.log(`📝 Room exists for ${trimmedId}, updating...`);
        return await updateExistingRoom(roomInfo.url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, trimmedId, isReactionEvent);
      } else {
        console.log(`🏗️ Room does NOT exist for ${trimmedId}, creating...`);
        return await createNewRoom(roomInfo.url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, trimmedId, isReactionEvent);
      }
    } catch (error) {
      console.error(`❌ Error processing recipient ${trimmedId}:`, error.message);
      return { recipientId: trimmedId, success: false, error: error.message };
    }
  });

  const results = await Promise.allSettled(updatePromises);
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  console.log(`✅ LiveObjects summary: ${successful} successful, ${failed} failed`);

  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      console.log(`➡️ Recipient ${r.value.recipientId}: success=${r.value.success}, method=${r.value.method || 'unknown'}`);
    } else {
      console.log(`➡️ Recipient failed: ${r.reason}`);
    }
  });
}

// Optimized function to update existing room
async function updateExistingRoom(url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, recipientId, isReactionEvent = false) {
  // Extract user ID from senderId (remove prefix if present)
  const senderUserId = senderId.includes('.') ? senderId.split('.')[1] : senderId;
  const recipientUserId = recipientId.includes('.') ? recipientId.split('.')[1] : recipientId;

  // Don't increment unread counter for the sender themselves OR for reaction events
  const shouldIncrementCounter = (senderUserId !== recipientUserId) && !isReactionEvent;

  console.log(`📨 Processing recipient ${recipientId}: sender=${senderUserId}, recipient=${recipientUserId}, isReactionEvent=${isReactionEvent}, incrementCounter=${shouldIncrementCounter}`);

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
    }
  ];

  // Only increment unread counter if recipient is not the sender
  if (shouldIncrementCounter) {
    updates.push({
      operation: "COUNTER_INC",
      path: `${roomId}.unreadMessageCount`,
      data: { number: 1 }
    });
  }

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
          data: { number: shouldIncrementCounter ? 1 : 0 }
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
async function createNewRoom(url, roomId, messagePreview, senderId, timestamp, recipients, ABLY_API_KEY, recipientId, isReactionEvent = false) {
  // Extract user ID from senderId (remove prefix if present)
  const senderUserId = senderId.includes('.') ? senderId.split('.')[1] : senderId;
  const recipientUserId = recipientId.includes('.') ? recipientId.split('.')[1] : recipientId;

  // Don't increment unread counter for the sender themselves OR for reaction events
  const shouldIncrementCounter = (senderUserId !== recipientUserId) && !isReactionEvent;

  console.log(`🏗️ Creating room for recipient ${recipientId}: sender=${senderUserId}, recipient=${recipientUserId}, isReactionEvent=${isReactionEvent}, incrementCounter=${shouldIncrementCounter}`);

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
        avatarUrl: { string: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}` },
        participants: { string: recipients.join(',') }
      }
    },
    {
      operation: "COUNTER_CREATE",
      path: `${roomId}.unreadMessageCount`,
      data: { number: shouldIncrementCounter ? 1 : 0 }
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
