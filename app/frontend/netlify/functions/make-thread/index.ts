import { 
  NetlifyEvent, 
  NetlifyContext, 
  UpdateWorkerRequest, 
  UpdateWorkerResponse, 
  ErrorResponse 
} from '../shared/models';

const handler = async (event: NetlifyEvent, context: NetlifyContext) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Only allow POST and PATCH methods
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PATCH') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Method not allowed',
        error: 'Only POST and PATCH methods are allowed'
      };
      
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify(errorResponse)
      };
    }

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { pageId, x, y }: UpdateWorkerRequest = body;

    // Validate required fields
    if (!pageId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Missing required field',
        error: 'pageId is required'
      };
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(errorResponse)
      };
    }

    // Set default values for x and y if not provided
    const finalX = x !== undefined ? x : 0;
    const finalY = y !== undefined ? y : 0;

    // Get environment variables
    const NOTION_TOKEN = process.env.NOTION_TOKEN;

    if (!NOTION_TOKEN) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Missing required environment variable',
        error: 'NOTION_TOKEN is not configured'
      };
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify(errorResponse)
      };
    }

    // Notion API endpoint for updating page
    const url = `https://api.notion.com/v1/pages/${pageId}`;

    const notionHeaders = {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    };

    // Prepare the update payload
    const updatePayload = {
      properties: {
        // Write to your configured fields first: pos_x/pos_y
        "pos_x": { "number": finalX },
        "pos_y": { "number": finalY }
      }
    };

    // Make request to Notion API to update the page
    console.log(`Updating Notion page ${pageId} to X=${finalX}, Y=${finalY}`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const updatedData = await response.json();
    console.log(`Updated Notion page ${pageId} OK`);
    
    const responseData: UpdateWorkerResponse = {
      success: true,
      message: 'Successfully updated worker coordinates',
      pageId: pageId,
      x: finalX,
      y: finalY
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Error in update-worker function:', error);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Failed to update worker',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};

export { handler };
