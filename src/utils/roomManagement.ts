import * as Ably from 'ably';

export const ensureRoomExists = async (userId: string, roomId: string, ablyClient: Ably.Realtime) => {
  console.log('Ensuring room exists:', roomId, 'for user:', userId);

  const channelOptions = { 
    modes: ['OBJECT_SUBSCRIBE', 'OBJECT_PUBLISH'] as any 
  };
  const channel = ablyClient.channels.get(`roomslist:${userId}`, channelOptions);
  
  try {
    await channel.attach();
    const root = await channel.objects.getRoot();
    
    // Check if room already exists
    const existingRoom = root.get(roomId);
    if (existingRoom) {
      console.log('Room already exists:', roomId);
      return;
    }
    
    console.log('Creating new room:', roomId);
    
    // Create new room with default data
    const roomMap = await channel.objects.createMap();
    const unreadCounter = await channel.objects.createCounter(0);
    
    // Set default room properties
    await roomMap.set('chatRoomType', 'DM');
    await roomMap.set('lastMessageSeenCursor', '');
    await roomMap.set('latestMessagePreview', 'Room created');
    await roomMap.set('latestMessageSender', 'System');
    await roomMap.set('latestMessageTimestamp', Date.now().toString());
    await roomMap.set('displayMacroUrl', `https://api.dicebear.com/7.x/avataaars/svg?seed=${roomId}`);
    await roomMap.set('participants', userId);
    await roomMap.set('unreadMessageCount', unreadCounter);
    
    // Add the room to the root
    await root.set(roomId, roomMap);
    
    console.log('Room created successfully:', roomId);
    
  } catch (error) {
    console.error('Error ensuring room exists:', error);
  }
};

export const addUserToRoom = async (userId: string, roomId: string, otherUserId: string, ablyClient: Ably.Realtime) => {
  console.log('Adding user to room:', otherUserId, 'in room:', roomId);

  const channelOptions = { 
    modes: ['OBJECT_SUBSCRIBE', 'OBJECT_PUBLISH'] as any 
  };
  const channel = ablyClient.channels.get(`roomslist:${userId}`, channelOptions);
  
  try {
    await channel.attach();
    const root = await channel.objects.getRoot();
    const roomMap = root.get(roomId) as any;
    
    if (roomMap) {
      const currentParticipants = roomMap.get('participants') || '';
      const participantsList = currentParticipants.split(',').filter((p: string) => p.trim() !== '');
      
      if (!participantsList.includes(otherUserId)) {
        participantsList.push(otherUserId);
        await roomMap.set('participants', participantsList.join(','));
        console.log('User added to room participants:', otherUserId);
      }
    }
    
  } catch (error) {
    console.error('Error adding user to room:', error);
  }
};

export const updateRoomMetadata = async (userId: string, roomId: string, updates: {
  chatRoomType?: 'DM' | 'topic' | 'groupDM';
  latestMessagePreview?: string;
  latestMessageSender?: string;
  displayMacroUrl?: string;
  participants?: string;
}, ablyClient: Ably.Realtime) => {
  console.log('Updating room metadata:', roomId, updates);

  const channelOptions = { 
    modes: ['OBJECT_SUBSCRIBE', 'OBJECT_PUBLISH'] as any 
  };
  const channel = ablyClient.channels.get(`roomslist:${userId}`, channelOptions);
  
  try {
    await channel.attach();
    const root = await channel.objects.getRoot();
    const roomMap = root.get(roomId) as any;
    
    if (roomMap) {
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          await roomMap.set(key, value);
        }
      }
      
      // Always update timestamp when metadata changes
      await roomMap.set('latestMessageTimestamp', Date.now().toString());
      
      console.log('Room metadata updated successfully');
    }
    
  } catch (error) {
    console.error('Error updating room metadata:', error);
  }
};