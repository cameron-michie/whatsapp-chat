'use client';
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const MessageList = ({ messages, user }) => {
  const createLi = (message) => {
    return (
      <li key={message.timeserial} className="flex justify-between bg-slate-50 p-3 my-2 group">
        <div className="flex items-center">
          <Avatar className="mr-2">
            <AvatarImage src={message.metadata?.avatarUrl} />
          </Avatar>
          <p>{message.text}</p>
        </div>
      </li>
    );
  };

  return <ul>{messages.map(createLi)}</ul>;
};

export default MessageList;