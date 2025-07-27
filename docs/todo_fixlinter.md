
src/ably-ui-kits/components/atoms/app-loading.tsx:2:8 - error TS6133: 'React' is declared but its value is never read.

2 import React, { useMemo } from 'react';
         ~~~~~

src/ably-ui-kits/components/atoms/avatar.tsx:1:8 - error TS6133: 'React' is declared but its value is never read.

1 import React, { useEffect, useState } from 'react';
         ~~~~~

src/ably-ui-kits/components/molecules/avatar-editor.tsx:3:18 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { Avatar, AvatarData } from '../atoms/avatar.tsx';
                   ~~~~~~~~~~

src/ably-ui-kits/components/molecules/chat-message-list.tsx:1:10 - error TS1484: 'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { Message } from '@ably/chat';
           ~~~~~~~

src/ably-ui-kits/components/molecules/chat-message.tsx:1:10 - error TS1484: 'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { Message } from '@ably/chat';
           ~~~~~~~

src/ably-ui-kits/components/molecules/emoji-burst.tsx:1:8 - error TS6133: 'React' is declared but its value is never read.

1 import React, { useEffect, useState } from 'react';
         ~~~~~

src/ably-ui-kits/components/molecules/emoji-picker.tsx:1:8 - error TS6133: 'React' is declared but its value is never read.

1 import React, { useCallback, useEffect, useMemo, useState } from 'react';
         ~~~~~

src/ably-ui-kits/components/molecules/emoji-wheel.tsx:1:8 - error TS6133: 'React' is declared but its value is never read.

1 import React, { useEffect, useState } from 'react';
         ~~~~~

src/ably-ui-kits/components/molecules/message-actions.tsx:1:1 - error TS6133: 'React' is declared but its value is never read.

1 import React from 'react';
  ~~~~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/message-input.tsx:1:10 - error TS1485: 'ErrorInfo' resolves to a type-only declaration and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { ErrorInfo, Message } from '@ably/chat';
           ~~~~~~~~~

  node_modules/@ably/chat/dist/chat/core/index.d.ts:34:15
    34 export type { ErrorInfo, RealtimePresenceParams } from 'ably';
                     ~~~~~~~~~
    'ErrorInfo' was exported here.

src/ably-ui-kits/components/molecules/message-input.tsx:1:21 - error TS1484: 'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { ErrorInfo, Message } from '@ably/chat';
                      ~~~~~~~

src/ably-ui-kits/components/molecules/message-input.tsx:4:17 - error TS1484: 'ChangeEvent' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

4 import React, { ChangeEvent, KeyboardEvent, useCallback, useRef, useState } from 'react';
                  ~~~~~~~~~~~

src/ably-ui-kits/components/molecules/message-input.tsx:4:30 - error TS1484: 'KeyboardEvent' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

4 import React, { ChangeEvent, KeyboardEvent, useCallback, useRef, useState } from 'react';
                               ~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/message-input.tsx:188:70 - error TS2339: Property 'timeserial' does not exist on type 'Message'.

188           console.log("Chat message sent successfully:", sentMessage.timeserial);
                                                                         ~~~~~~~~~~

src/ably-ui-kits/components/molecules/message-reactions.tsx:1:10 - error TS1484: 'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { Message } from '@ably/chat';
           ~~~~~~~

src/ably-ui-kits/components/molecules/message-reactions.tsx:2:1 - error TS6133: 'React' is declared but its value is never read.

2 import React from 'react';
  ~~~~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/participant-list.tsx:1:10 - error TS1484: 'PresenceMember' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { PresenceMember } from '@ably/chat';
           ~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/participant-list.tsx:2:1 - error TS6133: 'React' is declared but its value is never read.

2 import React from 'react';
  ~~~~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/participant.tsx:1:1 - error TS6133: 'React' is declared but its value is never read.

1 import React from 'react';
  ~~~~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/participant.tsx:4:18 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

4 import { Avatar, AvatarData } from '../atoms/avatar.tsx';
                   ~~~~~~~~~~

src/ably-ui-kits/components/molecules/presence-count.tsx:1:10 - error TS1484: 'PresenceMember' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { PresenceMember } from '@ably/chat';
           ~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/presence-count.tsx:2:1 - error TS6133: 'React' is declared but its value is never read.

2 import React from 'react';
  ~~~~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/presence-indicators.tsx:2:8 - error TS6133: 'React' is declared but its value is never read.

2 import React, { useEffect, useState } from 'react';
         ~~~~~

src/ably-ui-kits/components/molecules/presence-list.tsx:1:10 - error TS1484: 'PresenceMember' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { PresenceMember } from '@ably/chat';
           ~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-info.tsx:6:18 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

6 import { Avatar, AvatarData } from '../atoms/avatar.tsx';
                   ~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-list-item.tsx:126:10 - error TS6133: 'formatMessagePreview' is declared but its value is never read.

126 function formatMessagePreview(
             ~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-list-item.tsx:278:11 - error TS6133: 'propAvatar' is declared but its value is never read.

278   avatar: propAvatar,
              ~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-list-item.tsx:280:3 - error TS6133: 'typingIndicatorsEnabled' is declared but its value is never read.

280   typingIndicatorsEnabled = true,
      ~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-list-item.tsx:319:58 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.

319   console.log("useProfile(particpantuserid)", getProfile(participantUserId));
                                                             ~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-list-item.tsx:332:9 - error TS6133: 'isActive' is declared but its value is never read.

332   const isActive = isOnline || hasUnreadMessages; // Show as active if online OR has unread messages
            ~~~~~~~~

src/ably-ui-kits/components/molecules/room-list.tsx:2:1 - error TS6133: 'React' is declared but its value is never read.

2 import React from 'react';
  ~~~~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-list.tsx:80:3 - error TS6133: 'defaultRoomOptions' is declared but its value is never read.

80   defaultRoomOptions,
     ~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-reaction.tsx:1:10 - error TS1484: 'RoomReactionEvent' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { RoomReactionEvent } from '@ably/chat';
           ~~~~~~~~~~~~~~~~~

src/ably-ui-kits/components/molecules/room-reaction.tsx:4:8 - error TS6133: 'React' is declared but its value is never read.

4 import React, { useCallback, useEffect, useRef, useState } from 'react';
         ~~~~~

src/ably-ui-kits/components/molecules/typing-indicators.tsx:3:8 - error TS6133: 'React' is declared but its value is never read.

3 import React, { ReactNode, useEffect } from 'react';
         ~~~~~

src/ably-ui-kits/components/molecules/typing-indicators.tsx:3:17 - error TS1484: 'ReactNode' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import React, { ReactNode, useEffect } from 'react';
                  ~~~~~~~~~

src/ably-ui-kits/context/avatar-context.tsx:3:10 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { AvatarData } from '../components/atoms/avatar.tsx';
           ~~~~~~~~~~

src/ably-ui-kits/context/avatar-context.tsx:4:10 - error TS1484: 'AvatarChangeCallback' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

4 import { AvatarChangeCallback, PersistedAvatarData } from '../providers/avatar-provider.tsx';
           ~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/context/avatar-context.tsx:4:32 - error TS1484: 'PersistedAvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

4 import { AvatarChangeCallback, PersistedAvatarData } from '../providers/avatar-provider.tsx';
                                 ~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/context/theme-context.tsx:8:10 - error TS1484: 'ThemeChangeCallback' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

8 import { ThemeChangeCallback, ThemeType } from '../providers/theme-provider.tsx';
           ~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/context/theme-context.tsx:8:31 - error TS1484: 'ThemeType' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

8 import { ThemeChangeCallback, ThemeType } from '../providers/theme-provider.tsx';
                                ~~~~~~~~~

src/ably-ui-kits/hooks/use-chat-settings.tsx:3:31 - error TS1484: 'ChatSettingsContextType' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { ChatSettingsContext, ChatSettingsContextType } from '../context/chat-settings-context.tsx';
                                ~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/hooks/use-message-window.tsx:1:10 - error TS1484: 'ChatMessageEvent' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { ChatMessageEvent, ChatMessageEventType, Message, PaginatedResult } from '@ably/chat';
           ~~~~~~~~~~~~~~~~

src/ably-ui-kits/hooks/use-message-window.tsx:1:50 - error TS1484: 'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { ChatMessageEvent, ChatMessageEventType, Message, PaginatedResult } from '@ably/chat';
                                                   ~~~~~~~

src/ably-ui-kits/hooks/use-message-window.tsx:1:59 - error TS1484: 'PaginatedResult' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import { ChatMessageEvent, ChatMessageEventType, Message, PaginatedResult } from '@ably/chat';
                                                            ~~~~~~~~~~~~~~~

src/ably-ui-kits/hooks/use-profile-aware-avatar.tsx:2:10 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

2 import { AvatarData } from '../components/atoms/avatar.tsx';
           ~~~~~~~~~~

src/ably-ui-kits/hooks/use-room-avatar.tsx:3:10 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { AvatarData } from '../components/atoms/avatar.tsx';
           ~~~~~~~~~~

src/ably-ui-kits/hooks/use-theme.tsx:3:24 - error TS1484: 'ThemeContextType' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { ThemeContext, ThemeContextType } from '../context/theme-context.tsx';
                         ~~~~~~~~~~~~~~~~

src/ably-ui-kits/hooks/use-user-avatar.tsx:3:10 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { AvatarData } from '../components/atoms/avatar.tsx';
           ~~~~~~~~~~

src/ably-ui-kits/index.ts:6:15 - error TS2307: Cannot find module './app/index.js' or its corresponding type declarations.

6 export * from './app/index.js';
                ~~~~~~~~~~~~~~~~

src/ably-ui-kits/providers/avatar-provider.tsx:3:10 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { AvatarData } from '../components/atoms/avatar.tsx';
           ~~~~~~~~~~

src/ably-ui-kits/providers/chat-settings-provider.tsx:1:8 - error TS6133: 'React' is declared but its value is never read.

1 import React, { ReactNode } from 'react';
         ~~~~~

src/ably-ui-kits/providers/chat-settings-provider.tsx:1:17 - error TS1484: 'ReactNode' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import React, { ReactNode } from 'react';
                  ~~~~~~~~~

src/ably-ui-kits/providers/chat-settings-provider.tsx:5:3 - error TS1484: 'ChatSettingsContextType' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

5   ChatSettingsContextType,
    ~~~~~~~~~~~~~~~~~~~~~~~

src/ably-ui-kits/providers/chat-settings-provider.tsx:6:3 - error TS1484: 'ChatSettings' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

6   ChatSettings,
    ~~~~~~~~~~~~

src/ably-ui-kits/providers/theme-provider.tsx:1:8 - error TS6133: 'React' is declared but its value is never read.

1 import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
         ~~~~~

src/ably-ui-kits/providers/theme-provider.tsx:1:17 - error TS1484: 'ReactNode' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

1 import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
                  ~~~~~~~~~

src/components/ChatWindow.tsx:1:17 - error TS6133: 'useCallback' is declared but its value is never read.

1 import React, { useCallback } from 'react';
                  ~~~~~~~~~~~

src/components/ChatWindow.tsx:12:9 - error TS6133: 'room' is declared but its value is never read.

12   const room = useRoom();
           ~~~~

src/components/ChatWindow.tsx:40:92 - error TS2339: Property 'length' does not exist on type 'Messages'.

40   console.log('ChatWindowContent render:', { roomId, displayName, messagesCount: messages?.length || 0 });
                                                                                              ~~~~~~

src/components/ChatWindow.tsx:50:7 - error TS2322: Type '{ roomName: string; displayName: string; enableTypingIndicators: true; autoEnterPresence: true; windowSize: number; className: string; style: { width: string; maxWidth: string; minWidth: number; }; errorHandling: { ...; }; }' is not assignable to type 'IntrinsicAttributes & ChatWindowProps'.
  Property 'style' does not exist on type 'IntrinsicAttributes & ChatWindowProps'.

50       style={{ width: '100%', maxWidth: 'none', minWidth: 0 }}
         ~~~~~

src/components/OnlinePresence.tsx:163:23 - error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.

163                       userFullName={user?.fullName}
                          ~~~~~~~~~~~~

  src/ably-ui-kits/components/molecules/room-list-item.tsx:223:3
    223   userFullName?: string;
          ~~~~~~~~~~~~
    The expected type comes from property 'userFullName' which is declared here on type 'IntrinsicAttributes & RoomListItemProps'

src/components/OnlinePresence.tsx:244:17 - error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.

244                 userFullName={user?.fullName}
                    ~~~~~~~~~~~~

  src/ably-ui-kits/components/molecules/room-list-item.tsx:223:3
    223   userFullName?: string;
          ~~~~~~~~~~~~
    The expected type comes from property 'userFullName' which is declared here on type 'IntrinsicAttributes & RoomListItemProps'

src/components/ProfileAwareMessage.tsx:2:10 - error TS1484: 'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

2 import { Message } from '@ably/chat';
           ~~~~~~~

src/components/ProfileAwareMessage.tsx:29:9 - error TS6133: 'userAvatar' is declared but its value is never read.

29   const { userAvatar } = useProfileAwareAvatar({
           ~~~~~~~~~~~~~~

src/components/RoomsList.tsx:40:24 - error TS6133: 'getUserAvatar' is declared but its value is never read.

40   const { getUserName, getUserAvatar } = useProfile();
                          ~~~~~~~~~~~~~

src/components/RoomsList.tsx:41:9 - error TS6133: 'getRoomDisplayInfo' is declared but its value is never read.

41   const { getRoomDisplayInfo } = useRoomParticipants();
           ~~~~~~~~~~~~~~~~~~~~~~

src/components/RoomsList.tsx:162:46 - error TS2345: Argument of type '([roomId, roomMap]: [any, any]) => Promise<any[] | null>' is not assignable to parameter of type '(value: unknown, index: number, array: unknown[]) => Promise<any[] | null>'.
  Types of parameters '__0' and 'value' are incompatible.
    Type 'unknown' is not assignable to type '[any, any]'.

162         const roomPromises = roomEntries.map(async ([roomId, roomMap]) => {
                                                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/components/RoomsList.tsx:175:19 - error TS2488: Type '{}' must have a '[Symbol.iterator]()' method that returns an iterator.

175             const [roomId, roomData] = result;
                      ~~~~~~~~~~~~~~~~~~

src/components/RoomsList.tsx:227:41 - error TS2339: Property 'subscribe' does not exist on type 'string | number | true | ArrayBuffer | LiveMap<LiveMapType> | Buffer<ArrayBufferLike> | LiveCounter'.
  Property 'subscribe' does not exist on type 'string'.

227           if (roomMap && typeof roomMap.subscribe === 'function') {
                                            ~~~~~~~~~

src/components/RoomsList.tsx:229:21 - error TS2339: Property 'subscribe' does not exist on type 'string | number | true | ArrayBuffer | LiveMap<LiveMapType> | Buffer<ArrayBufferLike> | LiveCounter'.
  Property 'subscribe' does not exist on type 'string'.

229             roomMap.subscribe((roomUpdate: any) => {
                        ~~~~~~~~~

src/components/RoomsList.tsx:270:41 - error TS2339: Property 'get' does not exist on type 'string | number | true | ArrayBuffer | LiveMap<LiveMapType> | Buffer<ArrayBufferLike> | LiveCounter'.
  Property 'get' does not exist on type 'string'.

270           const unreadCounter = roomMap.get('unreadMessageCount');
                                            ~~~

src/components/RoomsList.tsx:315:41 - error TS2339: Property 'get' does not exist on type 'string | number | true | ArrayBuffer | LiveMap<LiveMapType> | Buffer<ArrayBufferLike> | LiveCounter'.
  Property 'get' does not exist on type 'string'.

315           const unreadCounter = roomMap.get('unreadMessageCount');
                                            ~~~

src/components/RoomsList.tsx:523:10 - error TS2322: Type '{ rooms: Record<string, any>; activeRoomName: string | undefined; addRoom: (roomName: string) => void; setActiveRoom: (roomName?: string | undefined) => void; leaveRoom: (roomName: string) => void; userId: string; userFullName: string | ... 1 more ... | undefined; className: string; defaultRoomOptions: { ...; }; }' is not assignable to type 'SidebarProps'.
  Types of property 'userFullName' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.

523         <Sidebar {...sidebarProps} />
             ~~~~~~~

src/components/UserProfileHeader.tsx:86:15 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.

86               userFullName={user?.fullName}
                 ~~~~~~~~~~~~

  src/ably-ui-kits/components/molecules/room-list-item.tsx:223:3
    223   userFullName?: string;
          ~~~~~~~~~~~~
    The expected type comes from property 'userFullName' which is declared here on type 'IntrinsicAttributes & RoomListItemProps'

src/components/UserProfileHeader.tsx:187:13 - error TS2322: Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.

187             userFullName={user?.fullName}
                ~~~~~~~~~~~~

  src/ably-ui-kits/components/molecules/room-list-item.tsx:223:3
    223   userFullName?: string;
          ~~~~~~~~~~~~
    The expected type comes from property 'userFullName' which is declared here on type 'IntrinsicAttributes & RoomListItemProps'

src/hooks/CheckChatroomExists.ts:2:10 - error TS1484: 'Room' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

2 import { Room, Message } from '@ably/chat';
           ~~~~

src/hooks/CheckChatroomExists.ts:2:16 - error TS1484: 'Message' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

2 import { Room, Message } from '@ably/chat';
                 ~~~~~~~

src/hooks/CheckChatroomExists.ts:4:25 - error TS6133: 'createClientId' is declared but its value is never read.

4 import { parseClientId, createClientId } from '../utils/clientId';
                          ~~~~~~~~~~~~~~

src/hooks/CheckChatroomExists.ts:103:73 - error TS2339: Property 'roomId' does not exist on type 'Room'.

103       console.log('HandleFirstMessage: Processing room', { roomId: room.roomId, messageText: message.text });
                                                                            ~~~~~~

src/hooks/CheckChatroomExists.ts:106:43 - error TS2339: Property 'roomId' does not exist on type 'Room'.

106       const roomInfo = parseDMRoomId(room.roomId);
                                              ~~~~~~

src/hooks/CheckChatroomExists.ts:108:55 - error TS2339: Property 'roomId' does not exist on type 'Room'.

108         console.error('Invalid room ID format:', room.roomId);
                                                          ~~~~~~

src/hooks/CheckChatroomExists.ts:123:52 - error TS2339: Property 'roomId' does not exist on type 'Room'.

123       const otherUserId = getOtherParticipant(room.roomId, currentUserId);
                                                       ~~~~~~

src/hooks/CheckChatroomExists.ts:126:73 - error TS2339: Property 'roomId' does not exist on type 'Room'.

126         console.error('Could not find other participant in room:', room.roomId);
                                                                            ~~~~~~

src/hooks/CheckChatroomExists.ts:133:83 - error TS2339: Property 'roomId' does not exist on type 'Room'.

133       const otherUserChatroomExists = await checkChatroomExists(otherUserId, room.roomId);
                                                                                      ~~~~~~

src/hooks/CheckChatroomExists.ts:139:16 - error TS2339: Property 'roomId' does not exist on type 'Room'.

139           room.roomId,
                   ~~~~~~

src/hooks/CheckChatroomExists.ts:149:87 - error TS2339: Property 'roomId' does not exist on type 'Room'.

149       const currentUserChatroomExists = await checkChatroomExists(currentUserId, room.roomId);
                                                                                          ~~~~~~

src/hooks/CheckChatroomExists.ts:156:16 - error TS2339: Property 'roomId' does not exist on type 'Room'.

156           room.roomId,
                   ~~~~~~

src/hooks/CheckChatroomExists.ts:181:31 - error TS2345: Argument of type '(message: Message) => void' is not assignable to parameter of type 'MessageListener'.
  Types of parameters 'message' and 'event' are incompatible.
    Type 'ChatMessageEvent' is missing the following properties from type 'Message': serial, clientId, text, createdAt, and 21 more.

181       room.messages.subscribe(handleMessage);
                                  ~~~~~~~~~~~~~

src/hooks/CheckChatroomExists.ts:185:25 - error TS2551: Property 'unsubscribe' does not exist on type 'Messages'. Did you mean 'subscribe'?

185           room.messages.unsubscribe(handleMessage);
                            ~~~~~~~~~~~

  node_modules/@ably/chat/dist/chat/core/messages.d.ts:175:5
    175     subscribe(listener: MessageListener): MessageSubscriptionResponse;
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    'subscribe' is declared here.

src/hooks/useProfileAvatar.tsx:3:10 - error TS1484: 'AvatarData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.

3 import { AvatarData } from '../ably-ui-kits/components/atoms/avatar';
           ~~~~~~~~~~

src/hooks/useRoomParticipants.tsx:1:10 - error TS6133: 'useEffect' is declared but its value is never read.

1 import { useEffect, useState, useCallback } from 'react';
           ~~~~~~~~~

src/main.tsx:98:3 - error TS6133: 'isHomePage' is declared but its value is never read.

98   isHomePage,
     ~~~~~~~~~~

src/main.tsx:151:23 - error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.

151                       activeRoomId={activeRoomId}
                          ~~~~~~~~~~~~

  src/components/RoomsList.tsx:28:3
    28   activeRoomId?: string;
         ~~~~~~~~~~~~
    The expected type comes from property 'activeRoomId' which is declared here on type 'IntrinsicAttributes & RoomsListProps'

src/utils/roomUtils.ts:81:22 - error TS2304: Cannot find name 'parseDMRoomId'.

81     const roomInfo = parseDMRoomId(roomId);
                        ~~~~~~~~~~~~~

src/utils/roomUtils.ts:83:54 - error TS7006: Parameter 'id' implicitly has an 'any' type.

83       const otherUserId = roomInfo.participants.find(id => id !== currentUserId);
                                                        ~~


Found 96 errors.
