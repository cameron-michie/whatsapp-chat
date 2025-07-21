The plan for this project is to demo an innovative new use case for LiveObjects which is going to extend the capabilities of Ably Chat to be useable in a Whatsapp / Slack type experience. 

The Ably Chat SDK is very well suited to chat when all users are present and available, but the main issue to be dealt with here is notifying users that new messaging have come in. The Chat SDK includes support for message editing, deleting, reactions, and moderation.

The good news is you don't need to implement basically any of that. You just need to use the UI kits which are readily provided for you in the '~/ably-chat-react-ui-components' directory. You should access this via relative paths: i.e. '../../ably-chat-react-ui-components'.

Your job is to set up a Slack or WhatsApp style experience, and this means splitting the page into two halves: a left-hand side which handles recent conversations with in an ordered list including message text previews and avatars, and a right-hand side which shows the existing chat window open including past chat history. Either side of the page has their own separate <AblyClient> provider and therefore is accessing Ably via a different Ably Realtime instance.

The Open Chat Window (right-hand side) is conceptually easy, it is simply an instance of the Ably Chat SDK open and connected, and the state of that chat window is stored also as path the URL. The room name will follow the pattern 'room:{roomId}' where 'roomId' is a hash of the numerically sorted userIds who have access to the chat.

The Rooms List (left-hand side) is managed by an Ably LiveObject which is hosted on a private Ably channel for that user, with channel name 'roomslist:{userId}'. The LiveObject is a LiveMap with the following schema:

{
  "roomId": {
    "chatRoomType": "DM" // Could be "topic" or "groupDM"
    "unreadMessageCount": "1",
    "lastMessageSeenCursor": "Hi",
    "latestMessagePreview": "Hi Cam, how are you?",
    "latestMessageSender": "John Smith",
    "latestMessageTimestamp": "1751471547",
    "displayMacroUrl": "www.example.com/JohnSmithAvatar.png",
    "participants": "Cam_Michie,John_Smith"
  },
  "roomId": {
    "chatRoomType": "DM"
    "unreadMessageCount": "0",
    "lastMessageSeenCursor": "Not much, what's up with you?",
    "latestMessagePreview": "Not much, what's up with you?",
    "latestMessageSender": "Cam Michie",
    "latestMessageTimestamp": "175147279",
    "displayMacroUrl": "www.example.com/DanJenkinsAvatar.png"
    "participants": "Cam_Michie,Dan_Jenkins"
  },
}

These are used in this way:
'roomId' is the LiveMap key, and is a hash of the numerically sorted userIds who have access to the chat.
- "chatRoomType" could be topic, DM, or groupDM which effects how to display
- "unreadMessageCount" is a LiveCounter, increment when new message arrives, set to zero when latestMessagePreview = lastMessageSeenCursor
- Cursor for this users last seen message
- The latest message on the channel, but slice first 50 chars + '...'
- Who did the latest message on the channel come from?
- What timestamp did the latest message arrive?
- "displayMacroUrl" will link to the recipient avatar for DM, and could link to some API for other groupDMs or topics
- "participants" is a string containing a list of user names, or could be userIds.

The general flow for a chat lifecycle is outlined here. A new chat will appear in the Roomslist if a different user updates the LiveMap via an Ably LiveObjects REST API request. The LiveMap will be displayed clientside in the order of latestMessageTimestamp descending. For each LiveMap element representing a chat room, the RoomsList component will attach to the Ably Chat room, but will do so via the Ably Pub/Sub API. This means it will attach to the Ably Channel 'room:{roomId}$$chat'. The channel subscription will be used with appropriate listeners to continually update the LiveMap with the latest information, updating in particular the latestMessagePreview, latestMessageTimestamp, latestMessageSender, and incrementing the unreadMessageCount in a single batch LiveObject call. When new chats are published in the chat window, they will be added to the Ably LiveMap via the LiveObjects REST API. The RoomsList will display the LiveMaps in order of latestMessageTimestamp descending.

When a room from RoomsList is selected, the webpage should navigate to its roomId in the URL path, and in the ChatWindow component the roomId should be opened.

In order to set this up in this React + Vite app, you should implement the two components RoomsList and ChatWindow, using if at all possible the building blocks described in the '~/ably-chat-react-ui-components'.

Where possible, you should use the Ably React hooks, but you should note that a) these do not yet exist for LiveObjects and b) when managing a dynamic list of Ably subscriptions as in RoomsList then this would be illadvised to do with hooks and providers, you should make your own hook for that.
