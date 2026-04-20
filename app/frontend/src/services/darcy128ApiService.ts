// MIPS32 API Service - Frontend to Backend Communication

export interface MIPS32Register {
  name: string;
  value: number; // 32-bit value
}

export interface MIPS32CPU {
  registers: MIPS32Register[];
  pc: number;
  hi: number;
  lo: number;
  running: boolean;
  memory: { [address: number]: number };
}

export interface MIPS32Instruction {
  address: number;
  instruction: number;
  opcode: number;
  operands: number[];
  description: string;
  category: 'arithmetic' | 'memory' | 'control' | 'logical';
  format: 'R' | 'I' | 'J';
}

export interface EmulatorRequest {
  action: 'execute' | 'step' | 'reset' | 'status' | 'load_program';
  instruction?: number;
  program?: number[];
  cpu_state?: MIPS32CPU;
}

export interface EmulatorResponse {
  success: boolean;
  cpu_state: MIPS32CPU;
  execution_history: string[];
  error?: string;
  performance_metrics?: {
    instructions_executed: number;
    cycles_executed: number;
    memory_accesses: number;
    branch_predictions: number;
  };
}

export class MIPS32ApiService {
  private baseUrl: string;

  constructor() {
    // Use Netlify functions URL in production, localhost in development
    this.baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8888/.netlify/functions'
      : '/.netlify/functions';
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Advance instruction - execute next instruction or specific instruction
  async advanceInstruction(instruction?: string): Promise<EmulatorResponse> {
    return this.makeRequest('/advance-instruction', 'POST', {
      instruction: instruction
    });
  }

  // Reset the processor
  async resetProcessor(): Promise<EmulatorResponse> {
    return this.makeRequest('/reset-processor', 'POST');
  }

  // Query memory contents
  async queryMemory(startAddress?: number, length?: number, singleAddress?: number): Promise<any> {
    if (singleAddress !== undefined) {
      return this.makeRequest(`/query-memory?address=${singleAddress.toString(16)}`, 'GET');
    } else {
      const params = new URLSearchParams();
      if (startAddress !== undefined) params.append('start', startAddress.toString(16));
      if (length !== undefined) params.append('length', length.toString());
      return this.makeRequest(`/query-memory?${params.toString()}`, 'GET');
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.makeRequest('/health-check', 'GET');
  }

  // Legacy methods for backward compatibility
  async getStatus(): Promise<EmulatorResponse> {
    return this.advanceInstruction();
  }

  async reset(): Promise<EmulatorResponse> {
    return this.resetProcessor();
  }

  async executeInstruction(instruction: string): Promise<EmulatorResponse> {
    return this.advanceInstruction(instruction);
  }

  async step(): Promise<EmulatorResponse> {
    return this.advanceInstruction();
  }

  // Helper method to convert instruction to hex
  static instructionToHex(instruction: string): string {
    // This is a simplified instruction encoder
    // In a real implementation, you'd have a proper assembler
    const instructionMap: { [key: string]: string } = {
      'add $3, $1, $2': '0x00221820',
      'sub $3, $1, $2': '0x00221822',
      'mult $1, $2': '0x00220018',
      'multu $1, $2': '0x00220019',
      'div $1, $2': '0x0022001A',
      'divu $1, $2': '0x0022001B',
      'mfhi $3': '0x00001810',
      'mflo $3': '0x00001812',
      'lis $1': '0x00000814',
      'jr $31': '0x03E00008',
      'jalr $1': '0x00200809',
      'slt $3, $1, $2': '0x0022182A',
      'sltu $3, $1, $2': '0x0022182B',
      'lw $2, 0($1)': '0x8C220000',
      'sw $2, 0($1)': '0xAC220000',
      'beq $1, $2, 4': '0x10220004',
      'bne $1, $0, 4': '0x14200004'
    };

    return instructionMap[instruction] || '0x00000000';
  }

  // Helper method to create sample programs
  static getSamplePrograms(): { name: string; description: string; program: string[] }[] {
    return [
      {
        name: 'Simple Addition',
        description: 'Add two 128-bit numbers: 100 + 200 = 300',
        program: [
          '0x00000814', // lis $1
          '100',        // .word 100
          '0x00001014', // lis $2
          '200',        // .word 200
          '0x00221820', // add $3, $1, $2
          '0xAC030000', // sw $3, 0($0)
          '0x00000008'  // jr $0 (halt)
        ]
      },
      {
        name: 'Multiplication Test',
        description: 'Multiply two numbers and store result',
        program: [
          '0x00000814', // lis $1
          '50',         // .word 50
          '0x00001014', // lis $2
          '3',          // .word 3
          '0x00220018', // mult $1, $2
          '0x00001812', // mflo $3
          '0xAC030000', // sw $3, 0($0)
          '0x00000008'  // jr $0 (halt)
        ]
      },
      {
        name: 'Division Test',
        description: 'Divide two numbers and store quotient and remainder',
        program: [
          '0x00000814', // lis $1
          '150',        // .word 150
          '0x00001014', // lis $2
          '4',          // .word 4
          '0x0022001A', // div $1, $2
          '0x00001812', // mflo $3 (quotient)
          '0x00002010', // mfhi $4 (remainder)
          '0xAC030000', // sw $3, 0($0)
          '0xAC040010', // sw $4, 16($0)
          '0x00000008'  // jr $0 (halt)
        ]
      },
      {
        name: 'Branch Test',
        description: 'Test branch instructions with a simple loop',
        program: [
          '0x00000814', // lis $1
          '10',         // .word 10 (counter)
          '0x00001014', // lis $2
          '0',          // .word 0 (sum)
          '0x00221820', // add $3, $2, $1 (sum += counter)
          '0x00411020', // add $2, $2, $1 (sum = sum + counter)
          '0x00000814', // lis $1
          '-1',         // .word -1
          '0x00210820', // add $1, $1, $1 (counter--)
          '0x14200004', // bne $1, $0, 4 (branch if counter != 0)
          '0xAC020000', // sw $2, 0($0) (store final sum)
          '0x00000008'  // jr $0 (halt)
        ]
      }
    ];
  }

  // Helper method to format 128-bit values for display
  static format128BitValue(value: string): { hex: string; decimal: string; binary: string } {
    try {
      const bigIntValue = BigInt(value);
      const hex = '0x' + bigIntValue.toString(16).padStart(32, '0');
      const decimal = bigIntValue.toString();
      const binary = bigIntValue.toString(2).padStart(128, '0');
      
      return { hex, decimal, binary };
    } catch (error) {
      return { hex: value, decimal: 'Invalid', binary: 'Invalid' };
    }
  }

  // Helper method to parse register values
  static parseRegisterValue(value: string): bigint {
    try {
      return BigInt(value);
    } catch (error) {
      return BigInt(0);
    }
  }

  // Helper method to get register name from index
  static getRegisterName(index: number): string {
    const registerNames = [
      '$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3',
      '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
      '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
      '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'
    ];
    return registerNames[index] || `$${index}`;
  }

  // Helper method to get register description
  static getRegisterDescription(index: number): string {
    const descriptions = [
      'Constant zero (always 0)',
      'Assembler temporary',
      'Return value 0',
      'Return value 1',
      'Argument 0',
      'Argument 1',
      'Argument 2',
      'Argument 3',
      'Temporary 0',
      'Temporary 1',
      'Temporary 2',
      'Temporary 3',
      'Temporary 4',
      'Temporary 5',
      'Temporary 6',
      'Temporary 7',
      'Saved register 0',
      'Saved register 1',
      'Saved register 2',
      'Saved register 3',
      'Saved register 4',
      'Saved register 5',
      'Saved register 6',
      'Saved register 7',
      'Temporary 8',
      'Temporary 9',
      'Kernel register 0',
      'Kernel register 1',
      'Global pointer',
      'Stack pointer',
      'Frame pointer',
      'Return address'
    ];
    return descriptions[index] || 'General purpose register';
  }
}

export default MIPS32ApiService;
