// DARCY128 Query Memory Endpoint
// Inspects memory contents with base 32 instruction support
// Uses map/dictionary memory representation

import { Handler } from '@netlify/functions';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface MemoryQueryRequest {
  address?: string; // Single address to query (hex)
  start?: string;   // Start address for range query (hex)
  length?: number;   // Number of bytes to read
  format?: 'hex' | 'decimal' | 'binary' | 'base32'; // Output format
}

interface MemoryEntry {
  address: string;
  value: string;
  format: string;
  is_instruction: boolean;
  decoded_instruction?: string;
}

interface MemoryQueryResponse {
  success: boolean;
  entries: MemoryEntry[];
  total_entries: number;
  memory_info: {
    total_size: string;
    used_addresses: number;
    memory_type: string;
  };
  query_info: {
    query_type: 'single' | 'range';
    address_range: string;
    format: string;
  };
  error?: string;
}

// ============================================================================
// Base 32 Instruction Utilities
// ============================================================================

class Base32Instruction {
  private static readonly BASE32_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
  
  static encode(instruction: number): string {
    let result = '';
    let value = instruction;
    
    if (value === 0) return '0';
    
    while (value > 0) {
      result = Base32Instruction.BASE32_CHARS[value % 32] + result;
      value = Math.floor(value / 32);
    }
    
    return result;
  }
  
  static decode(base32String: string): number {
    let result = 0;
    let power = 1;
    
    for (let i = base32String.length - 1; i >= 0; i--) {
      const char = base32String[i];
      const value = Base32Instruction.BASE32_CHARS.indexOf(char);
      if (value === -1) {
        throw new Error(`Invalid base 32 character: ${char}`);
      }
      result += value * power;
      power *= 32;
    }
    
    return result;
  }
  
  static isValid(base32String: string): boolean {
    for (const char of base32String) {
      if (!Base32Instruction.BASE32_CHARS.includes(char)) {
        return false;
      }
    }
    return true;
  }
  
  static isInstruction(value: string): boolean {
    // Check if value looks like a base 32 encoded instruction
    return Base32Instruction.isValid(value) && value.length <= 8;
  }
}

// ============================================================================
// 128-bit Arithmetic Utilities
// ============================================================================

class Int128 {
  static fromString(value: string): bigint {
    if (value.startsWith('0x')) {
      return BigInt(value);
    }
    return BigInt(value);
  }
  
  static toString(value: bigint): string {
    return '0x' + value.toString(16).padStart(32, '0');
  }
  
  static toDecimal(value: bigint): string {
    return value.toString();
  }
  
  static toBinary(value: bigint): string {
    return value.toString(2).padStart(128, '0');
  }
  
  static toBase32(value: bigint): string {
    return Base32Instruction.encode(Number(value));
  }
}

// ============================================================================
// Memory System - Map/Dictionary Based
// ============================================================================

class Darcy128Memory {
  private memory: Map<string, string> = new Map(); // Address -> Value mapping
  private readonly MEMORY_SIZE = 8 * 1024 * 1024; // 8MB
  
  // Memory-mapped I/O addresses
  private static readonly MMIO_OUTPUT_QWORD = 0xffff0018;
  private static readonly MMIO_INPUT_QWORD = 0xffff0010;
  
  loadWord(address: number): bigint {
    if (address === Darcy128Memory.MMIO_INPUT_QWORD) {
      return BigInt('0x' + Math.random().toString(16).substring(2).repeat(8).substring(0, 32));
    }
    
    this.checkAddress(address, 16);
    this.checkAlignment(address, 16);
    
    const addrStr = address.toString();
    const value = this.memory.get(addrStr);
    return value ? Int128.fromString(value) : BigInt(0);
  }
  
  storeWord(address: number, value: bigint): void {
    if (address === Darcy128Memory.MMIO_OUTPUT_QWORD) {
      console.log(`Output: ${Int128.toString(value)}`);
      return;
    }
    
    this.checkAddress(address, 16);
    this.checkAlignment(address, 16);
    
    const addrStr = address.toString();
    this.memory.set(addrStr, Int128.toString(value));
  }
  
  // Store instruction in base 32 format
  storeInstruction(address: number, instruction: number): void {
    this.checkAddress(address, 4);
    this.checkAlignment(address, 4);
    
    const base32Instruction = Base32Instruction.encode(instruction);
    const addrStr = address.toString();
    this.memory.set(addrStr, base32Instruction);
  }
  
  fetchInstruction(address: number): number {
    this.checkAddress(address, 4);
    this.checkAlignment(address, 4);
    
    const addrStr = address.toString();
    const base32Instruction = this.memory.get(addrStr);
    
    if (base32Instruction) {
      return Base32Instruction.decode(base32Instruction);
    }
    
    return 0; // NOP instruction
  }
  
  private checkAddress(address: number, size: number): void {
    if (address >= 0xffff0000) return;
    if (address + size > this.MEMORY_SIZE) {
      throw new Error(`Memory access out of bounds: 0x${address.toString(16)}`);
    }
  }
  
  private checkAlignment(address: number, alignment: number): void {
    if (address % alignment !== 0) {
      throw new Error(`Unaligned memory access at 0x${address.toString(16)}`);
    }
  }
  
  // Convert memory map to object for JSON serialization
  toObject(): { [address: string]: string } {
    const obj: { [address: string]: string } = {};
    for (const [key, value] of this.memory.entries()) {
      obj[key] = value;
    }
    return obj;
  }
  
  // Load memory from object (for JSON deserialization)
  fromObject(obj: { [address: string]: string }): void {
    this.memory.clear();
    for (const [key, value] of Object.entries(obj)) {
      this.memory.set(key, value);
    }
  }
  
  // Query memory with detailed formatting
  queryMemory(startAddr: number, length: number, format: string = 'hex'): MemoryEntry[] {
    const entries: MemoryEntry[] = [];
    
    for (let i = 0; i < length; i += 16) { // 128-bit word alignment
      const addr = startAddr + i;
      const addrStr = addr.toString();
      const value = this.memory.get(addrStr);
      
      if (value) {
        const bigintValue = Int128.fromString(value);
        let formattedValue: string;
        let isInstruction = false;
        let decodedInstruction: string | undefined;
        
        // Check if this looks like an instruction (base 32 encoded)
        if (Base32Instruction.isInstruction(value)) {
          isInstruction = true;
          const instruction = Base32Instruction.decode(value);
          decodedInstruction = `0x${instruction.toString(16).padStart(8, '0')}`;
        }
        
        switch (format) {
          case 'hex':
            formattedValue = Int128.toString(bigintValue);
            break;
          case 'decimal':
            formattedValue = Int128.toDecimal(bigintValue);
            break;
          case 'binary':
            formattedValue = Int128.toBinary(bigintValue);
            break;
          case 'base32':
            formattedValue = Base32Instruction.encode(Number(bigintValue));
            break;
          default:
            formattedValue = Int128.toString(bigintValue);
        }
        
        entries.push({
          address: `0x${addr.toString(16).padStart(8, '0')}`,
          value: formattedValue,
          format: format,
          is_instruction: isInstruction,
          decoded_instruction: decodedInstruction
        });
      }
    }
    
    return entries;
  }
  
  // Get memory statistics
  getMemoryInfo() {
    return {
      total_size: '8MB',
      used_addresses: this.memory.size,
      memory_type: 'Map/Dictionary based with base 32 instruction storage'
    };
  }
  
  dump(start: number, length: number): { [address: string]: string } {
    const result: { [address: string]: string } = {};
    for (let i = 0; i < length; i += 16) {
      const addr = start + i;
      const addrStr = addr.toString();
      const value = this.memory.get(addrStr) || Int128.toString(BigInt(0));
      result[addrStr] = value;
    }
    return result;
  }
}

// ============================================================================
// CPU Core - MIPS32 Compatible
// ============================================================================

class Darcy128CPU {
  private registers: bigint[] = new Array(32).fill(BigInt(0));
  private pc: bigint = BigInt(0);
  private hi: bigint = BigInt(0);
  private lo: bigint = BigInt(0);
  private memory: Darcy128Memory;
  private running: boolean = false;
  private executionHistory: string[] = [];
  private instructionsExecuted: number = 0;
  private executionMode: 'mips32' | 'darcy128' = 'mips32'; // Default to MIPS32 compatibility
  
  constructor() {
    this.memory = new Darcy128Memory();
  }
  
  getMemory(): Darcy128Memory { return this.memory; }
  
  getExecutionMode(): 'mips32' | 'darcy128' {
    return this.executionMode;
  }
}

// ============================================================================
// Global CPU Instance
// ============================================================================

let globalCPU: Darcy128CPU | null = null;

function getCPU(): Darcy128CPU {
  if (!globalCPU) {
    globalCPU = new Darcy128CPU();
  }
  return globalCPU;
}

// ============================================================================
// Netlify Handler
// ============================================================================

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const cpu = getCPU();
    const memory = cpu.getMemory();
    
    let request: MemoryQueryRequest = {};
    
    // Parse request from query parameters or body
    if (event.httpMethod === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters || '');
      request = {
        address: params.get('address') || undefined,
        start: params.get('start') || undefined,
        length: params.get('length') ? parseInt(params.get('length')!) : undefined,
        format: (params.get('format') as any) || 'hex'
      };
    } else if (event.httpMethod === 'POST') {
      request = JSON.parse(event.body || '{}');
    }
    
    let entries: MemoryEntry[] = [];
    let queryType: 'single' | 'range' = 'single';
    let addressRange = '';
    
    if (request.address) {
      // Single address query
      const address = parseInt(request.address, 16);
      const length = request.length || 16; // Default to one word
      entries = memory.queryMemory(address, length, request.format || 'hex');
      queryType = 'single';
      addressRange = `${request.address} - 0x${(address + length - 1).toString(16)}`;
    } else if (request.start) {
      // Range query
      const startAddr = parseInt(request.start, 16);
      const length = request.length || 256; // Default to 256 bytes
      entries = memory.queryMemory(startAddr, length, request.format || 'hex');
      queryType = 'range';
      addressRange = `${request.start} - 0x${(startAddr + length - 1).toString(16)}`;
    } else {
      // Default: query first 256 bytes
      entries = memory.queryMemory(0, 256, request.format || 'hex');
      queryType = 'range';
      addressRange = '0x00000000 - 0x000000FF';
    }
    
    const response: MemoryQueryResponse = {
      success: true,
      entries,
      total_entries: entries.length,
      memory_info: memory.getMemoryInfo(),
      query_info: {
        query_type: queryType,
        address_range: addressRange,
        format: request.format || 'hex'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    const errorResponse: MemoryQueryResponse = {
      success: false,
      entries: [],
      total_entries: 0,
      memory_info: {
        total_size: '8MB',
        used_addresses: 0,
        memory_type: 'Map/Dictionary based'
      },
      query_info: {
        query_type: 'single',
        address_range: '0x00000000 - 0x00000000',
        format: 'hex'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};