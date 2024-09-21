import { usePresenceListener, usePresence, useRoom } from '@ably/chat/react';
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

const Rooms =() => {

    const { user } = useUser()

    // const { leave, update, isPresent } = usePresence({});

    const { leave, update, isPresent } = usePresence({
        enterWithData: { fullName: user.fullName, status: "Present" },
        leaveWithData: { fullName: user.fullName, status: "Left" },
      });

    const { presenceData } = usePresenceListener({
        listener: (event) => {
            console.log('Presence event: ', event);
        },
    });
    
    const rooms = [
        { path: "/chat/general", label: "# General" },
        ...(presenceData && presenceData.length > 0 
            ? presenceData
                .filter(item => item.clientId !== user.id)
                .map(item => ({
                    path: `/chat/${item.clientId}`,
                    label: item.data && item.data.fullName ? `# ${item.data.fullName}` : 'Unknown'
                }))
            : []
        )
    ];
    

    const currentPath = usePathname()

    const createLi = room => {
        return <li key={room.path}>
          <Link
            href={room.path}
            className={clsx('flex items-center', { 'font-bold': currentPath === room.path })}>
            {room.label}
          </Link>
        </li >
      }

      return <ul> {rooms.map(createLi)} </ul>
}

export default Rooms;