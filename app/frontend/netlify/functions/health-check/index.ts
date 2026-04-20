import { Handler } from '@netlify/functions';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  architecture: string;
  endpoints: {
    advance_instruction: string;
    reset_processor: string;
    query_memory: string;
    health_check: string;
  };
  system_info: {
    memory_size: string;
    register_count: number;
    word_size: string;
    instruction_set: string[];
  };
  uptime: number;
  message: string;
}

// ============================================================================
// Netlify Handler
// ============================================================================

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const startTime = Date.now();
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const response: HealthCheckResponse = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      architecture: 'DARCY128',
      endpoints: {
        advance_instruction: '/.netlify/functions/advance-instruction',
        reset_processor: '/.netlify/functions/reset-processor',
        query_memory: '/.netlify/functions/query-memory',
        health_check: '/.netlify/functions/health-check'
      },
      system_info: {
        memory_size: '8MB',
        register_count: 32,
        word_size: '128-bit',
        instruction_set: [
          'add', 'sub', 'mult', 'multu', 'div', 'divu',
          'mfhi', 'mflo', 'lis', 'jr', 'jalr',
          'slt', 'sltu', 'lw', 'sw', 'beq', 'bne'
        ]
      },
      uptime: Date.now() - startTime,
      message: 'DARCY128 processor emulator is running normally'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    const errorResponse: HealthCheckResponse = {
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      architecture: 'DARCY128',
      endpoints: {
        advance_instruction: '/.netlify/functions/advance-instruction',
        reset_processor: '/.netlify/functions/reset-processor',
        query_memory: '/.netlify/functions/query-memory',
        health_check: '/.netlify/functions/health-check'
      },
      system_info: {
        memory_size: '8MB',
        register_count: 32,
        word_size: '128-bit',
        instruction_set: []
      },
      uptime: 0,
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};

export { handler };
