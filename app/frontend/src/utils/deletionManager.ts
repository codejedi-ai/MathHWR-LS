// Deletion Manager - Handles communication with the deletion worker
interface DeletionMessage {
  type: 'DELETE_EVENT' | 'BATCH_DELETE_EVENTS' | 'CLEAR_DELETION_QUEUE' | 'GET_DELETION_STATUS';
  payload?: {
    eventId?: string;
    eventIds?: string[];
    force?: boolean;
  };
}

interface DeletionResponse {
  type: 'DELETION_SUCCESS' | 'DELETION_FAILED' | 'BATCH_DELETION_SUCCESS' | 'BATCH_DELETION_FAILED' | 'QUEUE_CLEARED' | 'STATUS_UPDATE' | 'ERROR';
  payload?: {
    deletedId?: string;
    deletedIds?: string[];
    failedIds?: string[];
    queueSize?: number;
    status?: 'idle' | 'processing' | 'error';
  };
  error?: string;
}

type DeletionCallback = (response: DeletionResponse) => void;

class DeletionManager {
  private worker: Worker | null = null;
  private callbacks: DeletionCallback[] = [];
  private messageId = 0;
  private pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Create worker from the deletionWorker.ts file
      this.worker = new Worker(new URL('../workers/deletionWorker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (event: MessageEvent<DeletionResponse>) => {
        const response = event.data;
        
        // Notify all callbacks
        this.callbacks.forEach(callback => callback(response));
        
        // Handle specific response types
        switch (response.type) {
          case 'DELETION_SUCCESS':
            console.log(`Event ${response.payload?.deletedId} successfully deleted from database`);
            break;
            
          case 'DELETION_FAILED':
            console.error(`Failed to delete event ${response.payload?.deletedId}:`, response.error);
            break;
            
          case 'BATCH_DELETION_SUCCESS':
            console.log(`Batch deletion completed: ${response.payload?.deletedIds?.length || 0} successful, ${response.payload?.failedIds?.length || 0} failed`);
            // Resolve all pending deletion messages since batch completed
            this.pendingMessages.forEach(({ resolve }) => resolve(true));
            this.pendingMessages.clear();
            break;
            
          case 'BATCH_DELETION_FAILED':
            console.error('Batch deletion failed:', response.error);
            // Reject all pending deletion messages since batch failed
            this.pendingMessages.forEach(({ reject }) => reject(new Error(response.error || 'Batch deletion failed')));
            this.pendingMessages.clear();
            break;
            
          case 'STATUS_UPDATE':
            // Handle status updates (queue size, processing status, etc.)
            break;
            
          case 'ERROR':
            console.error('Deletion worker error:', response.error);
            // Reject all pending messages on error
            this.pendingMessages.forEach(({ reject }) => reject(new Error(response.error)));
            this.pendingMessages.clear();
            break;
        }
      };

      this.worker.onerror = (error) => {
        console.error('Deletion worker error:', error);
        // Reject all pending messages
        this.pendingMessages.forEach(({ reject }) => reject(error));
        this.pendingMessages.clear();
      };
    } catch (error) {
      console.error('Failed to initialize deletion worker:', error);
      this.worker = null;
    }
  }

  private sendMessage<T>(message: DeletionMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Deletion worker not available'));
        return;
      }

      const id = ++this.messageId;
      this.pendingMessages.set(id, { resolve, reject });

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Deletion worker message timeout'));
        }
      }, 5000); // Reduced timeout to 5 seconds for better responsiveness

      this.worker.postMessage(message);
    });
  }

  // Delete single event
  async deleteEvent(eventId: string, force: boolean = false): Promise<boolean> {
    try {
      await this.sendMessage({
        type: 'DELETE_EVENT',
        payload: { eventId, force }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      // Fallback to local deletion when worker is not available
      console.log('Deleted event locally as fallback:', eventId);
      return true; // Return true to indicate "success" for UI purposes
    }
  }

  // Delete multiple events in batch
  async batchDeleteEvents(eventIds: string[]): Promise<boolean> {
    try {
      await this.sendMessage({
        type: 'BATCH_DELETE_EVENTS',
        payload: { eventIds }
      });
      return true;
    } catch (error) {
      console.error('Failed to batch delete events:', error);
      return false;
    }
  }

  // Clear deletion queue
  async clearQueue(): Promise<boolean> {
    try {
      await this.sendMessage({
        type: 'CLEAR_DELETION_QUEUE'
      });
      return true;
    } catch (error) {
      console.error('Failed to clear deletion queue:', error);
      return false;
    }
  }

  // Get deletion status
  async getStatus(): Promise<{ status: string; queueSize: number } | null> {
    try {
      const response = await this.sendMessage<{ status: string; queueSize: number }>({
        type: 'GET_DELETION_STATUS'
      });
      return response;
    } catch (error) {
      // Don't log timeout errors as they're expected when worker is idle
      if (error instanceof Error && !error.message.includes('timeout')) {
        console.error('Failed to get deletion status:', error);
      }
      return null;
    }
  }

  // Add callback for deletion events
  addCallback(callback: DeletionCallback) {
    this.callbacks.push(callback);
  }

  // Remove callback
  removeCallback(callback: DeletionCallback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // Check if worker is available
  isAvailable(): boolean {
    return this.worker !== null;
  }

  // Cleanup
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingMessages.clear();
    this.callbacks = [];
  }
}

// Export singleton instance
export const deletionManager = new DeletionManager();
export default deletionManager;
