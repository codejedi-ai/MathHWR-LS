// API Service for Notion integration
import { Event } from '../types/Event';

interface NotionPage {
  id: string;
  properties: {
    [key: string]: any;
  };
  created_time: string;
  last_edited_time: string;
}

interface FetchPagesResponse {
  success: boolean;
  pages: NotionPage[];
  count: number;
  message?: string;
}

interface UpdateWorkerResponse {
  success: boolean;
  message: string;
  pageId: string;
  x: number;
  y: number;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  error: string;
}

class ApiService {
  private baseUrl = '/api';

  // Fetch all pages from Notion
  async fetchPages(): Promise<Event[]> {
    try {
      const response = await fetch(`${this.baseUrl}/fetch-pages`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FetchPagesResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch pages');
      }

      // Map Notion pages to Event instances (preserve `this` context)
      return data.pages.map((page) => this.mapNotionPageToEvent(page));
    } catch (error) {
      console.error('Failed to fetch pages from API:', error);
      throw error;
    }
  }

  // Update worker coordinates
  async updateWorkerCoordinates(pageId: string, x: number, y: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/update-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          x,
          y
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UpdateWorkerResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update worker coordinates');
      }

      return true;
    } catch (error) {
      console.error('Failed to update worker coordinates:', error);
      throw error;
    }
  }

  // Map Notion page properties to Event interface
  private mapNotionPageToEvent(page: NotionPage): Event {
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

    // Helper to extract URL from either url or rich_text properties
    const extractUrl = (property: any): string => {
      if (!property) return '';
      if (typeof property.url === 'string') return property.url;
      if (Array.isArray(property.rich_text)) {
        return property.rich_text.map((t: any) => t.plain_text).join('');
      }
      return '';
    };

    // Helper to extract color value; prefer Notion select.color over name
    const extractColor = (property: any): string => {
      if (!property) return '';
      // Notion select color tokens → hex
      const selectColor = property?.select?.color || (Array.isArray(property?.multi_select) && property.multi_select[0]?.color);
      if (selectColor) {
        const map: Record<string, string> = {
          default: '#4CAF50',
          gray: '#9e9e9e',
          brown: '#8d6e63',
          orange: '#fb8c00',
          yellow: '#fbc02d',
          green: '#43a047',
          blue: '#1e88e5',
          purple: '#8e24aa',
          pink: '#d81b60',
          red: '#e53935'
        };
        return map[selectColor] || '#4CAF50';
      }
      // rich_text fallback (expects a literal hex or css color string)
      if (Array.isArray(property.rich_text)) {
        const raw = property.rich_text.map((t: any) => t.plain_text).join('').trim();
        if (!raw) return '';
        if (/^#?[0-9a-fA-F]{6}$/.test(raw)) return raw.startsWith('#') ? raw : `#${raw}`;
        return raw;
      }
      if (typeof property === 'string') return property;
      return '';
    };

    // Extract properties with fallbacks
    // Prefer the Notion page title; common property keys are "Name" or "Title"
    const title = extractTitle(properties.Title)
      || extractTitle(properties.Name)
      || extractText(properties.Title)
      || extractText(properties.Name)
      || 'Untitled Event';
    // Prefer `content` as the body shown on the paper, with fallbacks
    const description = extractText(properties.content)
      || extractText(properties.Content)
      || extractText(properties.Description)
      || '';
    // Support Link as url type or rich_text, and multiple casings/keys
    const link = extractUrl(properties.Link) 
      || extractUrl(properties.link) 
      || extractUrl(properties.URL) 
      || extractUrl(properties.url) 
      || '';
    const imageUrl = extractUrl(properties.image) || extractUrl(properties.Image) || '';
    const variantText = extractText(properties.variant) || extractText(properties.Variant) || '';
    const variant = (variantText === 'photo' || variantText === 'lined') ? (variantText as 'photo' | 'lined') : 'sticky';
    // Support custom coordinate fields with sensible fallbacks: pos_x/pos_y → x/y → X/Y
    const x = extractNumber(properties.pos_x ?? properties.x ?? properties.X);
    const y = extractNumber(properties.pos_y ?? properties.y ?? properties.Y);
    // Support button color from Notion: prefer snake_case 'button_color' (rich_text or select), fallback to 'Button Color'
    const buttonColor = extractColor(properties.button_color)
      || extractColor(properties['Button Color'])
      || '#4CAF50';
    const time = extractText(properties.Time) || undefined;

    // Generate color based on creation date
    const createdAt = new Date(page.created_time);
    const color = this.getPaperColorByDay(createdAt);

    return new Event({
      id: page.id,
      title,
      description,
      link,
      x,
      y,
      color,
      buttonColor,
      time,
      createdAt,
      imageUrl: imageUrl || undefined,
      variant
    });
  }

  // Helper function to get paper color based on day of week
  private getPaperColorByDay(date: Date): string {
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
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

