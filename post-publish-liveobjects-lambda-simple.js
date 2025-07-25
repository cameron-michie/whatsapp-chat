export const handler = async (event) => {
  try {
    console.log('=== SIMPLE LAMBDA PROCESSING ===');
    
    // Parse the incoming webhook payload
    let payload;
    if (event.body) {
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      payload = event;
    }
    
    const { messages } = payload;
    
    if (!messages || messages.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'success', message: 'No messages to process' })
      };
    }
    
    // Process each message
    for (const rawMessage of messages) {
      const { data, clientId } = rawMessage;
      
      // Parse message data
      let parsedData = {};
      try {
        if (typeof data === 'string') {
          parsedData = JSON.parse(data);
        } else if (data && typeof data === 'object') {
          parsedData = data;
        }
      } catch (error) {
        console.log('Error parsing message data:', error);
        continue;
      }
      
      const messageText = parsedData.text || '';
      
      // Extract recipients
      let recipients = [];
      if (parsedData.metadata && parsedData.metadata.recipients) {
        const recipientsStr = parsedData.metadata.recipients;
        recipients = recipientsStr.split(',').map(r => r.trim()).filter(r => r);
      }
      
      console.log(`Message: "${messageText}" from ${clientId} to [${recipients.join(', ')}]`);
      
      if (recipients.length > 0) {
        await updateRecipientsSimple(recipients, messageText, clientId);
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', processed: messages.length })
    };
    
  } catch (error) {
    console.error('Error in lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', message: error.message })
    };
  }
};

async function updateRecipientsSimple(recipients, messageText, senderId) {
  const ABLY_API_KEY = "ALwA2Q.4QI37w:D_h8yJGTdcH5Xp8ZB9d7Tt9Zbp7QjfuXTdAL3HLBV1Y";
  const messagePreview = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;
  const timestamp = Date.now().toString();
  
  // Process recipients one by one (simple and reliable)
  for (const recipientId of recipients) {
    console.log(`Processing recipient: ${recipientId}`);
    
    try {
      const channelName = `roomslist:${recipientId.trim()}`;
      const url = `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/objects`;
      
      // Try to increment counter first (most common case)
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(ABLY_API_KEY).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: "COUNTER_INC",
            path: `room-${senderId}__${recipientId}.unreadMessageCount`,
            data: { number: 1 }
          })
        });
        
        console.log(`✅ Updated counter for ${recipientId}`);
        
      } catch (counterError) {
        console.log(`Counter update failed for ${recipientId}, will handle room creation later`);
        // Don't create room here, let the UI handle it
      }
      
    } catch (error) {
      console.error(`Error processing ${recipientId}:`, error.message);
    }
  }
}