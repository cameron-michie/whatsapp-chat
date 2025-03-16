import { usePresenceListener, usePresence } from 'ably/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { clsx } from 'clsx'

const WhosOnlineList = () => {
    const { user } = useUser()    
    const currentPath = usePathname();
    const {updateStatus} = usePresence('presence', {fullName: user.fullName, avatarUrl: user.imageUrl, status: 'Present'})
    const { presenceData } = usePresenceListener('presence');
    function generateRoomId(userId1, userId2) {
        const sortedIds = [userId1.slice(5), userId2.slice(5)].sort();
        return `${sortedIds[0]}x${sortedIds[1]}`;
    }    
    
    console.log("user: ", user)
    const onlineList = [
        ...(presenceData && presenceData.length > 0
          ? presenceData
              .filter((item) => item.clientId !== user.id)
              .map((item) => ({
                path: `/chat/${generateRoomId(user.id, item.clientId)}`,
                label: item.data?.fullName || 'Unknown',
                avatarUrl: item.data?.avatarUrl || null,
                status: item.data?.status || 'Away',
              }))
          : []),
      ];


    const createLi = (onlineMember) => {
        return (
          <li key={onlineMember.path} className="flex items-center space-x-2">
            <Link href={onlineMember.path} className={clsx('flex items-center', { 'font-bold': currentPath === onlineMember.path })}>
              {onlineMember.avatarUrl && (
                <img
                  src={onlineMember.avatarUrl}
                  alt={`${onlineMember.label}'s avatar`}
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              {onlineMember.label}
            </Link>
            {/* Show status dot */}
            <span
              className={clsx(
                'w-2 h-2 rounded-full ml-2',
                onlineMember.status === 'Present' ? 'bg-green-500' : 'bg-gray-400'
              )}
              title={onlineMember.status} // Tooltip for clarity
            />
          </li>
        );
      };

    return <ul> {onlineList.map(createLi)} </ul>;
}

export default WhosOnlineList;

