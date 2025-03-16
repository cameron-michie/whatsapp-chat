import { usePresenceListener, useChannel } from 'ably/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { clsx } from 'clsx';

const Rooms = () => {

    const { user } = useUser()    
    const currentPath = usePathname();
    const [rooms, setRooms] = useState([{
          path: '/chat/general',
          label: 'General',
          avatarUrl: 'https://link.assetfile.io/3YmUfatmXGqATIA000502Q/ably-motif-col-rgb.png',
        }]
    );

    useEffect(() => {
      const fetchChannelHistory = async () => {
          const historyPage = await channel.history({ limit: 20 });      
      };
      fetchChannelHistory();
    }, [channel]);

    // // notifications message data structure
    // const data = {
    //    userId: string,
    //    avatarUrl: string,
    //    fullName: string
    // }
    const { channel } = useChannel('${user.id}:notifications', (message) => {
      const roomId = generateRoomId(user.userId, )
      const newRoom = {
        path: '/chat/'+roomId,
        label: message.data.fullName,
        avatarUrl: message.data.avatarUrl,
      }
      setRooms((prev) => [...prev, newRoom]);
    });
    
    function generateRoomId(userId1, userId2) {
        const sortedIds = [userId1.slice(5), userId2.slice(5)].sort();
        return `${sortedIds[0]}x${sortedIds[1]}`;
    }
    
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
