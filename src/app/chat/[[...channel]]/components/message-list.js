'use client';
import { EllipsisVertical } from 'lucide-react';
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

const MessageList = ({ messages, user }) => {
  const createLi = (message) => (
    <li key={message.id} className="flex justify-between bg-slate-50 p-3 my-2 group">
      <div className="flex items-center">
        <Avatar className="mr-2">
          <AvatarImage src={message.data.metadata?.avatarUrl} />
        </Avatar>
        <p>{message.data.text}</p>
      </div>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer">
            <EllipsisVertical size={16} />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </li>
  );

  return <ul>{messages.map(createLi)}</ul>;
};

export default MessageList;
