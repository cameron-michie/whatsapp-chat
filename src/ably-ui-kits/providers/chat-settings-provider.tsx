import React from 'react';
import type { ReactNode } from 'react';

import { 
  ChatSettingsContext, 
  DEFAULT_SETTINGS 
} from '../context/chat-settings-context.tsx';
import type {
  ChatSettingsContextType, 
  ChatSettings
} from '../context/chat-settings-context.tsx';

/**
 * Props for the ChatSettingsProvider component.
 *
 */
export interface ChatSettingsProviderProps {
  /** Child components that will have access to chat settings */
  children?: ReactNode;
  /**
   * Initial global settings. Will be merged with defaults.
   * @defaultValue `{}`
   */
  initialGlobalSettings?: Partial<ChatSettings>;
  /**
   * Initial room-specific settings mapping.
   * @defaultValue `{}`
   */
  initialRoomSettings?: Record<string, Partial<ChatSettings>>;
}

/**
 * Provider component that manages global and room-level chat settings.
 *
 * This component provides a context for managing chat functionality settings
 * across an application. It supports both global default settings and
 * room-specific overrides. The settings control whether certain UI features are enabled/disabled,
 * but do not affect the underlying Ably Chat functionality. If you wish to ensure no user can edit or delete messages,
 * you must also configure the Ably client capabilities accordingly.
 *
 *
 * @example
 * ```tsx
 * const globalSettings = {
 *   allowMessageEdits: false,
 *   allowMessageDeletes: true,
 *   allowMessageReactions: true
 * };
 *
 * const roomSettings = {
 *   'general': { allowMessageEdits: true },
 *   'announcements': {
 *     allowMessageEdits: false,
 *     allowMessageDeletes: false
 *   }
 * };
 *
 * <ChatSettingsProvider
 *   initialGlobalSettings={globalSettings}
 *   initialRoomSettings={roomSettings}
 * >
 *   <ChatApp />
 * </ChatSettingsProvider>
 * ```
 *
 * @param ChatSettingsProviderProps - Props for the provider component
 * @returns {@link ChatSettingsProvider} component that wraps children components.
 *
 * @public
 */
export const ChatSettingsProvider = ({
  initialGlobalSettings = {},
  initialRoomSettings = {},
  children,
}: ChatSettingsProviderProps) => {
  // Merge initial global settings with defaults
  const globalSettings: ChatSettings = {
    ...DEFAULT_SETTINGS,
    ...initialGlobalSettings,
  };

  /**
   * Get effective settings for a room by merging global and room-specific settings.
   * Returns a frozen copy to prevent accidental mutations.
   *
   * @param roomName - Optional room name to get settings for
   * @returns Effective chat settings (room-specific merged with global, or just global)
   */
  const getEffectiveSettings = (roomName?: string): ChatSettings => {
    // If no room is specified, return global settings
    if (!roomName) {
      return Object.freeze({ ...globalSettings });
    }

    // Get room-specific settings if they exist
    const roomSpecificSettings = initialRoomSettings[roomName];

    // Merge global settings with room-specific settings (room settings take precedence)
    return Object.freeze({
      ...globalSettings,
      ...roomSpecificSettings,
    });
  };

  const contextValue: ChatSettingsContextType = {
    globalSettings: Object.freeze({ ...globalSettings }),
    roomSettings: initialRoomSettings,
    getEffectiveSettings,
  };

  return (
    <ChatSettingsContext.Provider value={contextValue}>{children}</ChatSettingsContext.Provider>
  );
};
