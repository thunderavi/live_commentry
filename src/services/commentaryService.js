import { commentaryAPI } from './api';

class CommentaryService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isReconnecting = false; // ✅ Prevent multiple reconnect attempts
    this.currentMatchId = null; // ✅ Track current match
    this.intentionalDisconnect = false; // ✅ Track intentional disconnects
  }

  /**
   * Connect to SSE stream for a match
   */
  connectToMatch(matchId, onEvent, onError) {
    // ✅ Prevent duplicate connections
    if (this.eventSource && this.currentMatchId === matchId) {
      console.log('⚠️ Already connected to this match, skipping duplicate connection');
      return this.eventSource;
    }

    // ✅ Close existing connection if switching matches
    if (this.eventSource && this.currentMatchId !== matchId) {
      console.log('🔄 Switching matches, closing existing connection');
      this.disconnect();
    }

    this.currentMatchId = matchId;
    this.intentionalDisconnect = false;
    
    const streamURL = commentaryAPI.getStreamURL(matchId);
    console.log('🔌 Connecting to SSE:', streamURL);

    try {
      this.eventSource = new EventSource(streamURL, {
        withCredentials: true,
      });

      this.eventSource.onopen = () => {
        console.log('✅ SSE Connection opened');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 SSE Event received:', data.type, data);

          if (onEvent) {
            onEvent(data);
          }

          this.triggerListeners(data.type, data);

        } catch (error) {
          console.error('❌ Error parsing SSE data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE Connection error:', error);

        // ✅ Don't reconnect if intentionally disconnected
        if (this.intentionalDisconnect) {
          console.log('ℹ️ Intentional disconnect, not reconnecting');
          return;
        }

        if (this.eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 SSE Connection closed');
          
          // ✅ Prevent multiple simultaneous reconnect attempts
          if (this.isReconnecting) {
            console.log('⏳ Reconnect already in progress...');
            return;
          }
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.isReconnecting = true;
            this.reconnectAttempts++;
            
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
              this.isReconnecting = false;
              this.connectToMatch(matchId, onEvent, onError);
            }, delay);
          } else {
            console.error('❌ Max reconnect attempts reached');
            if (onError) {
              onError(new Error('Failed to connect after multiple attempts'));
            }
          }
        }

        if (onError) {
          onError(error);
        }
      };

      return this.eventSource;

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }

  /**
   * Add event listener for specific event types
   */
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Trigger all listeners for an event type
   */
  triggerListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect() {
    if (this.eventSource) {
      console.log('🔌 Disconnecting SSE');
      this.intentionalDisconnect = true; // ✅ Mark as intentional
      this.eventSource.close();
      this.eventSource = null;
      this.listeners.clear();
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.currentMatchId = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN;
  }


  getState() {
    if (!this.eventSource) return 'CLOSED';
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'CONNECTING';
      case EventSource.OPEN:
        return 'OPEN';
      case EventSource.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Get current match ID
   */
  getCurrentMatchId() {
    return this.currentMatchId;
  }

  /**
   * Get reconnect status
   */
  getReconnectStatus() {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      isReconnecting: this.isReconnecting
    };
  }
}

// Export singleton instance
export const commentaryService = new CommentaryService();

export default commentaryService;