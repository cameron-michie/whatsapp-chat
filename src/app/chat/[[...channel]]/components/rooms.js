import { usePresenceListener, useChannel, useAbly } from 'ably/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { clsx } from 'clsx';
// import { usePathname } from 'next/navigation';

const Rooms = () => {
    const { user } = useUser();
    const currentPath = usePathname();
    const [rooms, setRooms] = useState([]);
    const ably = useAbly();

    
    useEffect(() => {
        const fetchChannelsAndHistory = async () => {
            const channel = ably.channels.get(`${user.id}:notifications`);
            const historyPage = await channel.history();
            historyPage.items.forEach(message => {
                handleIncomingMessage(message);
            });
        };
        fetchChannelsAndHistory();
    }, [user.id, ably]);

    const handleIncomingMessage = (message) => {
        const members = message.data.members;
        // Data structure of message
          // data = {
            // const members = [
              // {userId: string,
              // avatarUrl: string,
              // fullName: string},
              // ...
            // ],
            // const label : string (optional, provided for groupchats),
          // }

        // For DMs
        // if (messageData.members.length === 1) {
        const otherUser = members; //(members[0].userId === user.id ? members[0] : members[1]);
        const roomId = generateRoomId([user.id, otherUser.userId]);
        const lastMessage = fetchLastMessage(roomId);
        const newRoom = {
            path: `/chat/${roomId}`,
            label: `${otherUser.fullName}`,
            avatarUrl: otherUser.avatarUrl,
            messagePreview: lastMessage
        };
        setRooms(prev => [newRoom, ...prev]);
        // }

        // For groupchats handle later
        // if (message.members.length > 1) {
          
        //   const roomId = generateRoomId(members.map((member) => member.userId));
        //   updateRooms({
        //               path: `/chat/${roomId}`,
        //               label: `${(message.data.label ?? members[0].fullName)}`
                      
        //   }); 
        // }
    };

    // const updateRooms = (newRoom) => {
    //     setRooms(prev => {
    //         const existingRoomIndex = prev.findIndex(room => room.path === newRoom.path);
    //         if (existingRoomIndex >= 0) {
    //             const updatedRooms = [...prev];
    //             updatedRooms[existingRoomIndex] = {
    //                 ...prev[existingRoomIndex],
    //                 messagePreview: newRoom.messagePreview,
    //             };
    //             return updatedRooms;
    //         }
    //         return [...prev, newRoom];
    //     });
    // };

    const fetchLastMessage = async (roomPath) => {
        const channel = ably.channels.get(roomPath);
        try {
            const lastMessage = await channel.history({ limit: 1, rewind: 1 });
            if (lastMessage.items.length > 0) {
                return lastMessage.items[0].data.text;             }
        } catch (error) {
            console.error(`Error fetching last message for ${roomPath}`, error);
        }
        return null; 
    };

    // useEffect(() => {
    //     fetchLastMessages();
    // }, [rooms]);

    const { channel } = useChannel(`${user.id}:notifications`, (message) => {
        handleIncomingMessage(message);
    });

    function generateRoomId(userIds) {
        const sortedIds = userIds.sort();
        const combinedId = sortedIds.join(''); 
        // const hash = sha1(combinedId); 
        return combinedId;
    }

    async function sha1(str) {
      const enc = new TextEncoder();
      const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
      return Array.from(new Uint8Array(hash))
        .map(v => v.toString(16).padStart(2, '0'))
        .join('');
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
                <span className="ml-2 text-gray-500">{room.messagePreview}</span> 
            </li>
        );
    };

    return <ul> {rooms.map(createLi)} </ul>;
};

export default Rooms;
