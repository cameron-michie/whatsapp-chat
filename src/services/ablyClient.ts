import { ChatClient } from '@ably/chat';
import * as Ably from 'ably';
import Objects from 'ably/objects';

const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY as string;

interface AblyClients {
  ablyClient1: Ably.Realtime;
  ablyClient2: Ably.Realtime;
  chatClient: ChatClient;
}

/**
 * Singleton class to manage Ably client connections
 */
class AblyClientManager {
  private static instance: AblyClientManager;
  private clients: AblyClients | null = null;
  private currentClientId: string | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AblyClientManager {
    if (!AblyClientManager.instance) {
      AblyClientManager.instance = new AblyClientManager();
    }
    return AblyClientManager.instance;
  }

  /**
   * Gets or creates Ably clients for the given clientId.
   * Reuses existing clients if the clientId hasn't changed.
   * Creates new clients if clientId changes (user switch).
   */
  public getClients(clientId: string): AblyClients {
    // If we have existing clients for the same clientId, reuse them
    if (this.clients && this.currentClientId === clientId) {
      console.log(`[AblyClientSingleton] Reusing existing clients for clientId: ${clientId}`);
      return this.clients;
    }

    // If clientId changed, dispose of old clients
    if (this.clients && this.currentClientId !== clientId) {
      console.log(`[AblyClientSingleton] ClientId changed from ${this.currentClientId} to ${clientId}, disposing old clients`);
      this.disposeClients();
    }

    console.log(`[AblyClientSingleton] Creating new Ably clients for clientId: ${clientId}`);

    // Create Ably Realtime client with LiveObjects plugin
    const ablyClient1 = new Ably.Realtime({
      key: ABLY_API_KEY,
      plugins: { Objects },
      clientId: clientId
    });

    // Create Ably Realtime client for Chat Window with authenticated clientId
    const ablyClient2 = new Ably.Realtime({
      key: ABLY_API_KEY,
      clientId: clientId,
    });

    // Create Chat client using the Ably client
    const chatClient = new ChatClient(ablyClient2);

    this.clients = {
      ablyClient1,
      ablyClient2,
      chatClient
    };

    this.currentClientId = clientId;

    return this.clients;
  }

  /**
   * Disposes of all current clients and clears the cache.
   * Call this when the user logs out or switches.
   */
  public disposeClients(): void {
    if (this.clients) {
      console.log('[AblyClientSingleton] Disposing Ably clients');

      try {
        this.clients.ablyClient1.close();
        this.clients.ablyClient2.close();
        // ChatClient doesn't have a close method, it will be cleaned up when ablyClient2 closes
      } catch (error) {
        console.error('[AblyClientSingleton] Error disposing clients:', error);
      }

      this.clients = null;
      this.currentClientId = null;
    }
  }

  /**
   * Returns the current clientId if clients exist
   */
  public getCurrentClientId(): string | null {
    return this.currentClientId;
  }
}

// Export convenience functions that use the singleton
const clientManager = AblyClientManager.getInstance();

/**
 * Gets or creates Ably clients for the given clientId using the singleton pattern.
 * This ensures the same clients are always returned for the same clientId,
 * regardless of how many times this function is called.
 */
export function getAblyClients(clientId: string): AblyClients {
  return clientManager.getClients(clientId);
}

/**
 * Disposes of all current clients and clears the cache.
 * Call this when the user logs out or switches.
 */
export function disposeClients(): void {
  clientManager.disposeClients();
}

/**
 * Returns the current clientId if clients exist
 */
export function getCurrentClientId(): string | null {
  return clientManager.getCurrentClientId();
}
