/**
 * brain-client - Stub AI Assistant client for 37-data-model
 * 
 * Provides mock AI assistance features.
 * TODO: Connect to real EVA Brain v2 service
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: string;
}

export class BrainClient {
  async chat(message: string, sessionId?: string): Promise<ChatMessage> {
    // Mock response
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Mock response to: ${message}`,
      timestamp: new Date().toISOString(),
    };
  }

  async createSession(): Promise<ChatSession> {
    return {
      id: crypto.randomUUID(),
      messages: [],
      created_at: new Date().toISOString(),
    };
  }

  async getSession(id: string): Promise<ChatSession | null> {
    return null;
  }
}

// Singleton instance
export const brainClient = new BrainClient();
