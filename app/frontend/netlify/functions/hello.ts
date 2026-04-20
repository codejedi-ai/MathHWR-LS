interface NetlifyEvent {
  httpMethod: string;
  queryStringParameters: { [key: string]: string } | null;
  body: string | null;
}

interface NetlifyContext {
  [key: string]: any;
}

interface HelloResponse {
  message: string;
  paperId: string;
  timestamp: string;
  method: string;
  success: boolean;
}

interface ErrorResponse {
  message: string;
  error: string;
  success: boolean;
}

const handler = async (event: NetlifyEvent, context: NetlifyContext) => {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get the paper ID from query parameters or body
    let paperId: string | null = null;
    
    if (event.httpMethod === 'GET') {
      paperId = event.queryStringParameters?.paperId || null;
    } else if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      paperId = body.paperId || null;
    }

    // Return hello world response with paper ID
    const response: HelloResponse = {
      message: 'Hello World from Netlify API!',
      paperId: paperId || 'unknown',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      success: true
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error in hello function:', error);
    
    const errorResponse: ErrorResponse = {
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};

export { handler };
