// Event Worker - Handles fetching and processing event data
import { Event } from '../types/Event';

// Notion API endpoints
const NOTION_API_BASE = '/api';

interface WorkerMessage {
  type: 'FETCH_EVENTS' | 'FETCH_EVENT' | 'CREATE_PAGE' | 'UPDATE_EVENT' | 'DELETE_EVENT';
  payload?: any;
}

interface WorkerResponse {
  type: 'EVENTS_LOADED' | 'EVENT_LOADED' | 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_DELETED' | 'ERROR';
  payload?: any;
  error?: string;
}

// Helper function to get paper color based on day of week
const getPaperColorByDay = (date: Date): string => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayColors = [
    "#FFE4E1", // Sunday - Light Pink
    "#E6F3FF", // Monday - Light Blue
    "#F0FFF0", // Tuesday - Light Green
    "#FFF8DC", // Wednesday - Light Yellow
    "#F5F5DC", // Thursday - Beige
    "#F0E6FF", // Friday - Light Purple
    "#FFE4B5"  // Saturday - Moccasin
  ];
  return dayColors[dayOfWeek];
};

// Map Notion page properties to Event interface
function mapNotionPageToEvent(page: any): Event {
  const properties = page.properties;
  
  // Helper function to extract text from Notion rich text property
  const extractText = (property: any): string => {
    if (!property || !property.rich_text) return '';
    return property.rich_text.map((text: any) => text.plain_text).join('');
  };

  // Helper function to extract title from Notion title property
  const extractTitle = (property: any): string => {
    if (!property || !property.title) return '';
    return property.title.map((text: any) => text.plain_text).join('');
  };

  // Helper function to extract number from Notion number property
  const extractNumber = (property: any): number => {
    return property?.number || 0;
  };

  // Extract properties with fallbacks
  const title = extractTitle(properties.Title) || extractText(properties.Name) || 'Untitled Event';
  const description = extractText(properties.Description) || '';
  const link = extractText(properties.Link) || '';
  const x = extractNumber(properties.X);
  const y = extractNumber(properties.Y);
  const buttonColor = extractText(properties['Button Color']) || '#4CAF50';
  const time = extractText(properties.Time) || undefined;

  // Generate color based on creation date
  const createdAt = new Date(page.created_time);
  const color = getPaperColorByDay(createdAt);

  return {
    id: page.id,
    title,
    description,
    link,
    x,
    y,
    color,
    buttonColor,
    time,
    createdAt
  };
}

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all events from Notion
async function fetchEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${NOTION_API_BASE}/fetch-pages`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch pages');
    }

    // Map Notion pages to Event objects
    return data.pages.map((page: any) => mapNotionPageToEvent(page));
  } catch (error) {
    console.error('Error fetching events from Notion:', error);
    throw new Error('Failed to fetch events');
  }
}

// Fetch single event by ID from Notion
async function fetchEvent(id: string): Promise<Event | null> {
  try {
    // For now, we'll fetch all events and find the one with matching ID
    // In a more optimized setup, you'd have a specific endpoint for single events
    const events = await fetchEvents();
    const event = events.find(e => e.id === id);
    return event || null;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to fetch event');
  }
}

// Create new page in Notion (persist first, then display)
async function createPage(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
  try {
    console.log(`Creating page: "${eventData.title}" in Notion`);

    const response = await fetch(`${NOTION_API_BASE}/create-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: eventData.title,
        description: eventData.description,
        link: eventData.link,
        x: eventData.x,
        y: eventData.y,
        buttonColor: eventData.buttonColor,
        time: eventData.time
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const page = result.page;
    const id = page?.id as string;
    const created_time = page?.created_time as string;

    const createdAt = created_time ? new Date(created_time) : new Date();
    const color = getPaperColorByDay(createdAt);

    const newEvent: Event = {
      ...eventData,
      id,
      color,
      createdAt
    };

    console.log(`✅ Created Notion page ${id} for "${eventData.title}"`);
    return newEvent;
  } catch (error) {
    console.error(`❌ Failed to create page "${eventData.title}":`, error);
    throw new Error('Failed to create page');
  }
}

// Update existing event: call Notion update immediately on release
async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
  try {
    if (eventData.x !== undefined || eventData.y !== undefined) {
      const x = eventData.x || 0;
      const y = eventData.y || 0;
      console.log(`📡 Worker immediate update Notion page ${id} → (${x}, ${y})`);
      // Fire-and-forget: do not await so UI remains snappy; errors logged in worker
      fetch(`${NOTION_API_BASE}/update-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: id, x, y })
      }).then(async (res) => {
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          console.error(`Update-worker HTTP ${res.status}: ${t}`);
        }
      }).catch((e) => console.error('Update-worker fetch failed:', e));
      return { id, ...eventData } as Event;
    }
    console.log(`Updated event ${id} with data:`, eventData);
    return { id, ...eventData } as Event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Failed to update event');
  }
}

// Delete event from Notion
async function deleteEvent(id: string): Promise<boolean> {
  try {
    console.log(`Deleting event ${id} from Notion`);
    
    // For now, we'll just log the deletion since we don't have a delete endpoint yet
    // In production, you'd call a Notion API endpoint to delete the page
    console.log(`✅ Successfully deleted event ${id} locally`);
    console.log('Note: To persist deletion to Notion, implement a delete-page API endpoint');
    
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Failed to delete event');
  }
}

// Handle worker messages
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    let response: WorkerResponse;
    
    switch (type) {
      case 'FETCH_EVENTS':
        const events = await fetchEvents();
        response = { type: 'EVENTS_LOADED', payload: events };
        break;
        
      case 'FETCH_EVENT':
        const event = await fetchEvent(payload.id);
        response = { type: 'EVENT_LOADED', payload: event };
        break;
        
      case 'CREATE_PAGE':
        const newEvent = await createPage(payload);
        response = { type: 'EVENT_CREATED', payload: newEvent };
        break;
        
      case 'UPDATE_EVENT':
        const updatedEvent = await updateEvent(payload.id, payload.data);
        response = { type: 'EVENT_UPDATED', payload: updatedEvent };
        break;
        
      case 'DELETE_EVENT':
        const deleted = await deleteEvent(payload.id);
        response = { type: 'EVENT_DELETED', payload: { id: payload.id, success: deleted } };
        break;
        
      default:
        response = { type: 'ERROR', error: 'Unknown message type' };
    }
    
    self.postMessage(response);
  } catch (error) {
    const errorResponse: WorkerResponse = {
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    self.postMessage(errorResponse);
  }
});

// Export for TypeScript
export {};
