// Netlify Event and Context interfaces
export interface NetlifyEvent {
  httpMethod: string;
  queryStringParameters: { [key: string]: string } | null;
  body: string | null;
}

export interface NetlifyContext {
  [key: string]: any;
}

// Notion API Models
export interface NotionPage {
  id: string;
  properties: {
    [key: string]: any;
  };
  created_time: string;
  last_edited_time: string;
}

export interface NotionDatabaseQuery {
  results: NotionPage[];
  has_more: boolean;
  next_cursor?: string;
}

// API Request/Response Models
export interface FetchPagesResponse {
  success: boolean;
  pages: NotionPage[];
  count: number;
  message?: string;
}

export interface UpdateWorkerRequest {
  pageId: string;
  x?: number;
  y?: number;
}

export interface UpdateWorkerResponse {
  success: boolean;
  message: string;
  pageId: string;
  x: number;
  y: number;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  error: string;
}

// Notion API Property Models
export interface NotionNumberProperty {
  number: number;
}

export interface NotionTextProperty {
  rich_text: Array<{
    text: {
      content: string;
    };
  }>;
}

export interface NotionTitleProperty {
  title: Array<{
    text: {
      content: string;
    };
  }>;
}
