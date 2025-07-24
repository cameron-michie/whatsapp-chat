import React, { useEffect } from 'react';
import { usePresence } from 'ably/react';
import { useUser } from '@clerk/clerk-react';

/**
 * Component to handle app-level presence - enters presence when mounted
 * This should be placed at the app level so users are always in presence when online
 */
export const AppPresence: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { updateStatus } = usePresence('presence');

  // Enter presence when component mounts and user is available
  useEffect(() => {
    if (user) {
      const userData = {
        userId: user.id,
        fullName: user.fullName || 'Unknown User',
        avatarUrl: user.imageUrl,
        timestamp: Date.now()
      };

      console.log('App-level entering presence with data:', userData);
      
      updateStatus(userData).then(() => {
        console.log('Successfully entered app-level presence');
      }).catch((error) => {
        console.error('Failed to enter app-level presence:', error);
      });
    }

    // Leave presence when component unmounts (app closes)
    return () => {
      if (user) {
        console.log('Leaving app-level presence');
        updateStatus(null);
      }
    };
  }, [user, updateStatus]);

  return <>{children}</>;
};