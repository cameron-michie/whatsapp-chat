import { ensureRoomExists } from './roomManagement';
import * as Ably from 'ably';

export const testDirectRoomAccess = async (userId: string, ablyClient: Ably.Realtime) => {
  console.log('Testing direct room access...');
  
  // Test creating a room via URL
  await ensureRoomExists(userId, 'test-room-123', ablyClient);
  
  console.log('Direct room access test completed');
};