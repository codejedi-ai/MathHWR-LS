// Shared models between frontend and Netlify functions

export interface NetlifyEvent {
  httpMethod: string;
  headers?: Record<string, string>;
  body?: string | null;
  queryStringParameters?: Record<string, string>;
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
}

// API shapes used by both frontend and functions
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


