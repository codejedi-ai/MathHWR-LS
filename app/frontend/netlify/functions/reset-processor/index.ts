// DARCY128 Reset Processor Endpoint
// Resets the CPU to initial state with MIPS32 backward compatibility
// Uses base 32 instruction storage and map-based memory

import { Handler } from '@netlify/functions';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface Darcy128Register {
  name: string;
  value: string; // 128-bit value as hex string
  type: 'general' | 'special';
}

interface Darcy128CPUState {
  registers: Darcy128Register[];
  pc: string;
  hi: string;
  lo: string;
  running: boolean;
  memory: Map<string, string>; // Memory as map/dictionary
}

interface ResetProcessorResponse {
  success: boolean;
  cpu_state: Darcy128CPUState;
  execution_history: string[];
  performance_metrics: {
    instructions_executed: number;
    simd_utilization: number;
    crypto_acceleration: number;
    memory_bandwidth: number;
  };
  message: string;
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
  
  static add(a: bigint, b: bigint): bigint {
    return a + b;
  }
  
  static sub(a: bigint, b: bigint): bigint {
    return a - b;
  }
  
  static mul(a: bigint, b: bigint): { hi: bigint; lo: bigint } {
    const result = a * b;
    const mask = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
    return {
      lo: result & mask,
      hi: (result >> BigInt(128)) & mask
    };
  }
  
  static div(a: bigint, b: bigint): { quotient: bigint; remainder: bigint } {
    if (b === BigInt(0)) {
      throw new Error('Division by zero');
    }
    return {
      quotient: a / b,
      remainder: a % b
    };
  }
  
  static compare(a: bigint, b: bigint): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  
  static signExtend16(value: number): bigint {
    const signBit = (value >> 15) & 1;
    if (signBit) {
      return BigInt(value) | BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000');
    }
    return BigInt(value);
  }
  
  static signExtend32(value: number): bigint {
    const signBit = (value >> 31) & 1;
    if (signBit) {
      return BigInt(value) | BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFF00000000');
    }
    return BigInt(value);
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
  
  // Clear all memory
  clear(): void {
    this.memory.clear();
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
  
  reset(): void {
    // Clear all registers
    this.registers.fill(BigInt(0));
    
    // Reset special registers
    this.pc = BigInt(0);
    this.hi = BigInt(0);
    this.lo = BigInt(0);
    
    // Reset execution state
    this.running = false;
    this.executionHistory = [];
    this.instructionsExecuted = 0;
    
    // Reset to MIPS32 compatibility mode
    this.executionMode = 'mips32';
    
    // Clear memory (optional - you might want to preserve loaded programs)
    // this.memory.clear();
    
    // Add reset entry to history
    this.addExecutionHistory(`[${this.executionMode}] CPU RESET - All registers cleared, PC=0, execution mode=${this.executionMode}`);
  }
  
  setExecutionMode(mode: 'mips32' | 'darcy128'): void {
    this.executionMode = mode;
  }
  
  getExecutionMode(): 'mips32' | 'darcy128' {
    return this.executionMode;
  }
  
  readReg(reg: number): bigint {
    if (reg === 0) return BigInt(0);
    if (reg >= 32) throw new Error('Invalid register');
    return this.registers[reg];
  }
  
  writeReg(reg: number, value: bigint): void {
    if (reg === 0) return;
    if (reg >= 32) throw new Error('Invalid register');
    this.registers[reg] = value;
  }
  
  getPC(): bigint { return this.pc; }
  setPC(value: bigint): void { this.pc = value; }
  
  getHI(): bigint { return this.hi; }
  setHI(value: bigint): void { this.hi = value; }
  
  getLO(): bigint { return this.lo; }
  setLO(value: bigint): void { this.lo = value; }
  
  getMemory(): Darcy128Memory { return this.memory; }
  
  isRunning(): boolean { return this.running; }
  stop(): void { this.running = false; }
  
  fetch(): number {
    const instruction = this.memory.fetchInstruction(Number(this.pc));
    this.pc += BigInt(4);
    return instruction;
  }
  
  addExecutionHistory(entry: string): void {
    this.executionHistory.push(entry);
    if (this.executionHistory.length > 100) {
      this.executionHistory.shift();
    }
  }
  
  getState(): Darcy128CPUState {
    const registers: Darcy128Register[] = [];
    for (let i = 0; i < 32; i++) {
      registers.push({
        name: `$${i}`,
        value: Int128.toString(this.registers[i]),
        type: 'general'
      });
    }
    
    return {
      registers,
      pc: Int128.toString(this.pc),
      hi: Int128.toString(this.hi),
      lo: Int128.toString(this.lo),
      running: this.running,
      memory: this.memory.toObject()
    };
  }
  
  getExecutionHistory(): string[] {
    return [...this.executionHistory];
  }
  
  getPerformanceMetrics() {
    return {
      instructions_executed: this.instructionsExecuted,
      simd_utilization: Math.min(100, this.instructionsExecuted * 2),
      crypto_acceleration: Math.min(500, this.instructionsExecuted * 5),
      memory_bandwidth: Math.min(100, this.instructionsExecuted * 1.5)
    };
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
    
    // Perform reset
    cpu.reset();
    
    const response: ResetProcessorResponse = {
      success: true,
      cpu_state: cpu.getState(),
      execution_history: cpu.getExecutionHistory(),
      performance_metrics: cpu.getPerformanceMetrics(),
      message: 'DARCY128 processor reset successfully. All registers cleared, PC=0, execution mode=MIPS32'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    const errorResponse: ResetProcessorResponse = {
      success: false,
      cpu_state: getCPU().getState(),
      execution_history: getCPU().getExecutionHistory(),
      performance_metrics: getCPU().getPerformanceMetrics(),
      message: 'Failed to reset processor',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};