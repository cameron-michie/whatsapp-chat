import { usePresenceListener, usePresence } from 'ably/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { clsx } from 'clsx'

const Rooms = () => {

    const { user } = useUser()    
    const currentPath = usePathname();
    const {updateStatus} = usePresence('presence', {fullName: user.fullName, avatarUrl: user.avatarUrl, status: 'Present'})
    const { presenceData } = usePresenceListener('presence');
    function generateRoomId(userId1, userId2) {
        const sortedIds = [userId1.slice(5), userId2.slice(5)].sort();
        return `${sortedIds[0]}x${sortedIds[1]}`;
    }    
    
    const rooms = [
        {
          path: '/chat/general',
          label: 'General',
          avatarUrl: 'https://link.assetfile.io/3YmUfatmXGqATIA000502Q/ably-motif-col-rgb.png',
        },
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


    const createLi = (room) => {
        return (
          <li key={room.path} className="flex items-center space-x-2">
            <Link href={room.path} className={clsx('flex items-center', { 'font-bold': currentPath === room.path })}>
              {room.avatarUrl && (
                <img
                  src={room.avatarUrl}
                  alt={`${room.label}'s avatar`}
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              {room.label}
            </Link>
            {/* Show status dot */}
            <span
              className={clsx(
                'w-2 h-2 rounded-full ml-2',
                room.status === 'Present' ? 'bg-green-500' : 'bg-gray-400'
              )}
              title={room.status} // Tooltip for clarity
            />
          </li>
        );
      };

    return <ul> {rooms.map(createLi)} </ul>;
}

export default Rooms;
