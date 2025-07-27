import React from 'react';
import type { Message } from '@ably/chat';
import { ChatMessage } from '../ably-ui-kits/components/molecules/chat-message';
import { useProfile } from '../contexts/ProfileContext';
import { useProfileAwareAvatar } from '../ably-ui-kits/hooks/use-profile-aware-avatar';

interface ProfileAwareMessageProps {
  message: Message;
  enableReactions?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
  enableAvatarEdit?: boolean;
  onEditMessage?: (message: Message, newText: string) => void;
  onDeleteMessage?: (message: Message) => void;
  onAddReaction?: (message: Message, emoji: string) => void;
  onRemoveReaction?: (message: Message, emoji: string) => void;
  onSetUserAvatar?: (clientId: string, avatarData: any) => void;
  className?: string;
}

/**
 * A wrapper around ChatMessage that integrates with the profile system
 * to provide proper avatars and display names
 */
export const ProfileAwareMessage: React.FC<ProfileAwareMessageProps> = (props) => {
  const { getUserName, getUserAvatar, fetchProfile } = useProfile();
  
  // Use profile-aware avatar for this message
  const { userAvatar } = useProfileAwareAvatar({
    clientId: props.message.clientId,
    displayName: undefined,
    getUserName,
    getUserAvatar,
    fetchProfile,
  });

  // Pass all props through to ChatMessage, but override avatar-related behavior
  return (
    <ChatMessage
      {...props}
      // We can't directly override the avatar since ChatMessage uses its own hook
      // But this wrapper ensures profile data is loaded and available
    />
  );
};