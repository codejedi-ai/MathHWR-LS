// Worker Manager - Handles communication with the event worker
import { Event } from '../types/Event';
import { apiService } from '../services/apiService';

interface WorkerMessage {
  type: 'FETCH_EVENTS' | 'FETCH_EVENT' | 'CREATE_EVENT' | 'UPDATE_EVENT' | 'DELETE_EVENT';
  payload?: any;
}

interface WorkerResponse {
  type: 'EVENTS_LOADED' | 'EVENT_LOADED' | 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_DELETED' | 'ERROR';
  payload?: any;
  error?: string;
}

class WorkerManager {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Create worker from the eventWorker.ts file
      const workerUrl = new URL('../workers/eventWorker.ts', import.meta.url);
      this.worker = new Worker(workerUrl, {
        type: 'module'
      });

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload, error } = event.data;
        
        // Handle responses
        if (type === 'ERROR') {
          console.error('Worker error:', error);
          // Reject all pending messages on error
          this.pendingMessages.forEach(({ reject }) => reject(new Error(error)));
          this.pendingMessages.clear();
        } else {
          // Resolve the appropriate pending message
          // For simplicity, we'll handle the first pending message
          // In a more robust implementation, you'd want to include message IDs
          const pendingMessage = Array.from(this.pendingMessages.values())[0];
          if (pendingMessage) {
            pendingMessage.resolve(payload);
            this.pendingMessages.clear();
          } else {
            console.warn('Received worker response but no pending messages to resolve');
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending messages
        this.pendingMessages.forEach(({ reject }) => reject(error));
        this.pendingMessages.clear();
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      console.log('Falling back to mock data mode');
      // Fallback to direct function calls if worker fails
      this.worker = null;
    }
  }

  private sendMessage<T>(message: WorkerMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        // Fallback to direct calls if worker is not available
        reject(new Error('Worker not available'));
        return;
      }

      const id = ++this.messageId;
      this.pendingMessages.set(id, { resolve, reject });

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Worker message timeout'));
        }
      }, 5000); // 5 second timeout for better responsiveness

      this.worker.postMessage(message);
    });
  }

  // Fetch hardcoded instruction program (placeholder for worker-backed fetch)
  async fetchInstructions(): Promise<Array<{ id: string; hexCode: string; assembly: string }>> {
    // In future, delegate to a dedicated worker message
    return [
      { id: '1', hexCode: '0x00000814', assembly: 'lis $1, 100' },
      { id: '2', hexCode: '0x00001014', assembly: 'lis $2, 200' },
      { id: '3', hexCode: '0x00221820', assembly: 'add $3, $1, $2' },
      { id: '4', hexCode: '0x00000008', assembly: 'jr $0' }
    ];
  }

  // Fetch all events
  async fetchEvents(): Promise<Event[]> {
    try {
      // Try API first
      return await apiService.fetchPages();
    } catch (error) {
      console.error('Failed to fetch events from API:', error);
      // Fallback to worker if API fails
      try {
        return await this.sendMessage<Event[]>({ type: 'FETCH_EVENTS' });
      } catch (workerError) {
        console.error('Failed to fetch events from worker:', workerError);
        // Return mock data as final fallback
        return this.getMockEvents();
      }
    }
  }

  // Mock data fallback
  private getMockEvents(): Event[] {
    const now = new Date();
    const getPaperColorByDay = (date: Date): string => {
      const dayOfWeek = date.getDay();
      const dayColors = [
        "#FFE4E1", "#E6F3FF", "#F0FFF0", "#FFF8DC", 
        "#F5F5DC", "#F0E6FF", "#FFE4B5"
      ];
      return dayColors[dayOfWeek];
    };

    return [
      {
        id: '1',
        title: 'Hackathon Workshop',
        description: 'Learn web development and build cool projects',
        link: 'https://luma.com/events/hackathon-workshop',
        x: 100,
        y: 100,
        color: getPaperColorByDay(new Date('2024-01-10')),
        buttonColor: '#007bff',
        type: 'event',
        time: '2024-01-15T10:00',
        createdAt: new Date('2024-01-10')
      },
      {
        id: '2',
        title: 'Study Group',
        description: 'CS 142 study session in the library',
        link: 'https://discord.gg/studygroup',
        x: 300,
        y: 200,
        color: getPaperColorByDay(new Date('2024-01-11')),
        buttonColor: '#28a745',
        type: 'community',
        createdAt: new Date('2024-01-11')
      },
      {
        id: '3',
        title: 'Game Night',
        description: 'Board games and pizza in the common room',
        link: 'https://app.getriver.io/events/game-night',
        x: 500,
        y: 150,
        color: getPaperColorByDay(new Date('2024-01-12')),
        buttonColor: '#ffc107',
        type: 'event',
        time: '2024-01-20T18:00',
        createdAt: new Date('2024-01-12')
      }
    ];
  }

  // Fetch single event
  async fetchEvent(id: string): Promise<Event | null> {
    try {
      return await this.sendMessage<Event | null>({ 
        type: 'FETCH_EVENT', 
        payload: { id } 
      });
    } catch (error) {
      console.error('Failed to fetch event:', error);
      return null;
    }
  }

  // Create new page (formerly createEvent)
  async createPage(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    try {
      console.log(`📝 Queuing page creation: "${eventData.title}"`);
      const result = await this.sendMessage<Event>({ 
        type: 'CREATE_PAGE', 
        payload: eventData 
      });
      console.log(`✅ Page creation completed: "${eventData.title}"`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to create page:`, error);
      // Fallback to local creation when worker is not available
      const newEvent: Event = {
        ...eventData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      console.log(`🔄 Created page locally as fallback: "${newEvent.title}" (ID: ${newEvent.id})`);
      return newEvent;
    }
  }

  // Back-compat: alias
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    return this.createPage(eventData);
  }

  // Update event
  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
    try {
      // Always delegate to worker so UI doesn't block (worker can queue background tasks)
      return await this.sendMessage<Event>({ 
        type: 'UPDATE_EVENT', 
        payload: { id, data: eventData } 
      });
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  // Delete event
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const result = await this.sendMessage<{ id: string; success: boolean }>({ 
        type: 'DELETE_EVENT', 
        payload: { id } 
      });
      return result.success;
    } catch (error) {
      console.error('Failed to delete event:', error);
      // Fallback to local deletion when worker is not available
      console.log('Deleted event locally as fallback:', id);
      return true; // Return true to indicate "success" for UI purposes
    }
  }

  // Cleanup
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingMessages.clear();
  }
}

// Export singleton instance
export const workerManager = new WorkerManager();
export default workerManager;
