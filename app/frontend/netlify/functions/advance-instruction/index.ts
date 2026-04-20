// DARCY128 Advance Instruction Endpoint
// Executes a single instruction and returns updated CPU state
// Supports MIPS32 backward compatibility with base 32 instruction storage

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

interface AdvanceInstructionRequest {
  instruction?: string; // Hex encoded instruction
  mode?: 'mips32' | 'darcy128'; // Execution mode
  query_memory?: {
    address?: string; // Single address to query (hex)
    start?: string;   // Start address for range query (hex)
    length?: number;  // Number of bytes to read
    format?: 'hex' | 'decimal' | 'binary'; // Output format
  };
}

interface MemoryEntry {
  address: string;
  value: string;
  format: string;
  is_instruction: boolean;
  decoded_instruction?: string;
}

interface AdvanceInstructionResponse {
  success: boolean;
  cpu_state: Darcy128CPUState;
  execution_history: string[];
  performance_metrics: {
    instructions_executed: number;
    simd_utilization: number;
    crypto_acceleration: number;
    memory_bandwidth: number;
  };
  instruction_info?: {
    decoded: string;
    mode: string;
    hex_encoded: string;
  };
  memory_query?: {
    entries: MemoryEntry[];
    total_entries: number;
    query_info: {
      query_type: 'single' | 'range';
      address_range: string;
      format: string;
    };
  };
  error?: string;
}

// ============================================================================
// Base 16 (Hexadecimal) Instruction Utilities
// ============================================================================

class HexInstruction {
  static encode(instruction: number): string {
    return '0x' + instruction.toString(16).padStart(8, '0').toUpperCase();
  }
  
  static decode(hexString: string): number {
    // Remove 0x prefix if present
    const cleanHex = hexString.replace(/^0x/i, '');
    return parseInt(cleanHex, 16);
  }
  
  static isValid(hexString: string): boolean {
    const cleanHex = hexString.replace(/^0x/i, '');
    return /^[0-9A-Fa-f]+$/.test(cleanHex) && cleanHex.length <= 8;
  }
  
  static isInstruction(value: string): boolean {
    return HexInstruction.isValid(value) && value.length >= 6; // At least 3 bytes
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
  
  // Store instruction in hex format
  storeInstruction(address: number, instruction: number): void {
    this.checkAddress(address, 4);
    this.checkAlignment(address, 4);
    
    const hexInstruction = HexInstruction.encode(instruction);
    const addrStr = address.toString();
    this.memory.set(addrStr, hexInstruction);
  }
  
  fetchInstruction(address: number): number {
    this.checkAddress(address, 4);
    this.checkAlignment(address, 4);
    
    const addrStr = address.toString();
    const hexInstruction = this.memory.get(addrStr);
    
    if (hexInstruction) {
      return HexInstruction.decode(hexInstruction);
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
        
        // Check if this looks like an instruction (hex encoded)
        if (HexInstruction.isInstruction(value)) {
          isInstruction = true;
          const instruction = HexInstruction.decode(value);
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
    this.registers.fill(BigInt(0));
    this.pc = BigInt(0);
    this.hi = BigInt(0);
    this.lo = BigInt(0);
    this.running = false;
    this.executionHistory = [];
    this.instructionsExecuted = 0;
    this.executionMode = 'mips32'; // Reset to MIPS32 mode
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
  
  executeInstruction(instruction: number): void {
    const instr = this.decodeInstruction(instruction);
    instr.execute(this);
    this.instructionsExecuted++;
  }
  
  private decodeInstruction(word: number): Instruction {
    const opcode = (word >> 26) & 0x3F;
    
    if (opcode === 0x00) { // R-type
      const func = word & 0x3F;
      switch (func) {
        case 0x20: return new AddInstruction(word);
        case 0x22: return new SubInstruction(word);
        case 0x18: return new MultInstruction(word);
        case 0x19: return new MultuInstruction(word);
        case 0x1A: return new DivInstruction(word);
        case 0x1B: return new DivuInstruction(word);
        case 0x10: return new MfhiInstruction(word);
        case 0x12: return new MfloInstruction(word);
        case 0x14: return new LisInstruction(word);
        case 0x08: return new JrInstruction(word);
        case 0x09: return new JalrInstruction(word);
        case 0x2A: return new SltInstruction(word);
        case 0x2B: return new SltuInstruction(word);
        default:
          throw new Error(`Unknown R-type function: 0x${func.toString(16)}`);
      }
    } else { // I-type
      switch (opcode) {
        case 0x23: return new LwInstruction(word);
        case 0x2B: return new SwInstruction(word);
        case 0x04: return new BeqInstruction(word);
        case 0x05: return new BneInstruction(word);
        default:
          throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
      }
    }
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
// Instruction Classes - MIPS32 Compatible
// ============================================================================

abstract class Instruction {
  protected raw: number;
  
  constructor(instruction: number) {
    this.raw = instruction;
  }
  
  abstract execute(cpu: Darcy128CPU): void;
  abstract getName(): string;
  
  protected getOpcode(): number { return (this.raw >> 26) & 0x3F; }
  protected getRs(): number { return (this.raw >> 21) & 0x1F; }
  protected getRt(): number { return (this.raw >> 16) & 0x1F; }
  protected getRd(): number { return (this.raw >> 11) & 0x1F; }
  protected getShamt(): number { return (this.raw >> 6) & 0x1F; }
  protected getFunc(): number { return this.raw & 0x3F; }
  protected getImmediate(): number { return this.raw & 0xFFFF; }
  protected getAddress(): number { return this.raw & 0x3FFFFFF; }
}

// R-Type Instructions - MIPS32 Compatible
class AddInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.add(s, t);
    cpu.writeReg(this.getRd(), result);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] add $${this.getRd()}, $${this.getRs()}, $${this.getRt()} (${hex}) -> ${Int128.toString(result)}`);
  }
  getName(): string { return 'add'; }
}

class SubInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.sub(s, t);
    cpu.writeReg(this.getRd(), result);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] sub $${this.getRd()}, $${this.getRs()}, $${this.getRt()} (${hex}) -> ${Int128.toString(result)}`);
  }
  getName(): string { return 'sub'; }
}

class MultInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.mul(s, t);
    cpu.setLO(result.lo);
    cpu.setHI(result.hi);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] mult $${this.getRs()}, $${this.getRt()} (${hex}) -> HI:LO = ${Int128.toString(result.hi)}:${Int128.toString(result.lo)}`);
  }
  getName(): string { return 'mult'; }
}

class MultuInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.mul(s, t);
    cpu.setLO(result.lo);
    cpu.setHI(result.hi);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] multu $${this.getRs()}, $${this.getRt()} (${hex}) -> HI:LO = ${Int128.toString(result.hi)}:${Int128.toString(result.lo)}`);
  }
  getName(): string { return 'multu'; }
}

class DivInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.div(s, t);
    cpu.setLO(result.quotient);
    cpu.setHI(result.remainder);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] div $${this.getRs()}, $${this.getRt()} (${hex}) -> LO=${Int128.toString(result.quotient)}, HI=${Int128.toString(result.remainder)}`);
  }
  getName(): string { return 'div'; }
}

class DivuInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.div(s, t);
    cpu.setLO(result.quotient);
    cpu.setHI(result.remainder);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] divu $${this.getRs()}, $${this.getRt()} (${hex}) -> LO=${Int128.toString(result.quotient)}, HI=${Int128.toString(result.remainder)}`);
  }
  getName(): string { return 'divu'; }
}

class MfhiInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const hi = cpu.getHI();
    cpu.writeReg(this.getRd(), hi);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] mfhi $${this.getRd()} (${hex}) -> ${Int128.toString(hi)}`);
  }
  getName(): string { return 'mfhi'; }
}

class MfloInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const lo = cpu.getLO();
    cpu.writeReg(this.getRd(), lo);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] mflo $${this.getRd()} (${hex}) -> ${Int128.toString(lo)}`);
  }
  getName(): string { return 'mflo'; }
}

class LisInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const nextWord = cpu.getMemory().fetchInstruction(Number(cpu.getPC()));
    cpu.setPC(cpu.getPC() + BigInt(4));
    const value = BigInt(nextWord);
    cpu.writeReg(this.getRd(), value);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] lis $${this.getRd()} (${hex}) -> ${Int128.toString(value)}`);
  }
  getName(): string { return 'lis'; }
}

class JrInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const target = cpu.readReg(this.getRs());
    cpu.setPC(target);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] jr $${this.getRs()} (${hex}) -> PC = ${Int128.toString(target)}`);
  }
  getName(): string { return 'jr'; }
}

class JalrInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const target = cpu.readReg(this.getRs());
    cpu.writeReg(31, cpu.getPC());
    cpu.setPC(target);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] jalr $${this.getRs()} (${hex}) -> PC = ${Int128.toString(target)}, $31 = ${Int128.toString(cpu.getPC())}`);
  }
  getName(): string { return 'jalr'; }
}

class SltInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.compare(s, t) < 0 ? BigInt(1) : BigInt(0);
    cpu.writeReg(this.getRd(), result);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] slt $${this.getRd()}, $${this.getRs()}, $${this.getRt()} (${hex}) -> ${result}`);
  }
  getName(): string { return 'slt'; }
}

class SltuInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    const result = Int128.compare(s, t) < 0 ? BigInt(1) : BigInt(0);
    cpu.writeReg(this.getRd(), result);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] sltu $${this.getRd()}, $${this.getRs()}, $${this.getRt()} (${hex}) -> ${result}`);
  }
  getName(): string { return 'sltu'; }
}

// I-Type Instructions - MIPS32 Compatible
class LwInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const base = cpu.readReg(this.getRs());
    const offset = Int128.signExtend16(this.getImmediate());
    const address = Number(base + offset);
    
    const value = cpu.getMemory().loadWord(address);
    cpu.writeReg(this.getRt(), value);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] lw $${this.getRt()}, ${this.getImmediate()}($${this.getRs()}) (${hex}) -> ${Int128.toString(value)}`);
  }
  getName(): string { return 'lw'; }
}

class SwInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const base = cpu.readReg(this.getRs());
    const offset = Int128.signExtend16(this.getImmediate());
    const address = Number(base + offset);
    
    const value = cpu.readReg(this.getRt());
    cpu.getMemory().storeWord(address, value);
    
    const mode = cpu.getExecutionMode();
    const hex = HexInstruction.encode(this.raw);
    cpu.addExecutionHistory(`[${mode}] sw $${this.getRt()}, ${this.getImmediate()}($${this.getRs()}) (${hex}) -> Memory[${address}] = ${Int128.toString(value)}`);
  }
  getName(): string { return 'sw'; }
}

class BeqInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    if (s === t) {
      const offset = Int128.signExtend16(this.getImmediate());
      cpu.setPC(cpu.getPC() + (offset * BigInt(4)));
      
      const mode = cpu.getExecutionMode();
      const hex = HexInstruction.encode(this.raw);
      cpu.addExecutionHistory(`[${mode}] beq $${this.getRs()}, $${this.getRt()}, ${this.getImmediate()} (${hex}) -> Branch taken to ${Int128.toString(cpu.getPC())}`);
    } else {
      const mode = cpu.getExecutionMode();
      const hex = HexInstruction.encode(this.raw);
      cpu.addExecutionHistory(`[${mode}] beq $${this.getRs()}, $${this.getRt()}, ${this.getImmediate()} (${hex}) -> Branch not taken`);
    }
  }
  getName(): string { return 'beq'; }
}

class BneInstruction extends Instruction {
  execute(cpu: Darcy128CPU): void {
    const s = cpu.readReg(this.getRs());
    const t = cpu.readReg(this.getRt());
    if (s !== t) {
      const offset = Int128.signExtend16(this.getImmediate());
      cpu.setPC(cpu.getPC() + (offset * BigInt(4)));
      
      const mode = cpu.getExecutionMode();
      const hex = HexInstruction.encode(this.raw);
      cpu.addExecutionHistory(`[${mode}] bne $${this.getRs()}, $${this.getRt()}, ${this.getImmediate()} (${hex}) -> Branch taken to ${Int128.toString(cpu.getPC())}`);
    } else {
      const mode = cpu.getExecutionMode();
      const hex = HexInstruction.encode(this.raw);
      cpu.addExecutionHistory(`[${mode}] bne $${this.getRs()}, $${this.getRt()}, ${this.getImmediate()} (${hex}) -> Branch not taken`);
    }
  }
  getName(): string { return 'bne'; }
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
    let request: AdvanceInstructionRequest = {};

    if (event.httpMethod === 'POST') {
      request = JSON.parse(event.body || '{}');
    }

    let response: AdvanceInstructionResponse;

    try {
      let instruction: number;
      let instructionInfo: any = {};

      if (request.instruction) {
        // Execute specific instruction (hex encoded)
        if (HexInstruction.isValid(request.instruction)) {
          instruction = HexInstruction.decode(request.instruction);
          instructionInfo = {
            decoded: `0x${instruction.toString(16).padStart(8, '0')}`,
            mode: request.mode || 'mips32',
            hex_encoded: request.instruction
          };
        } else {
          // Try as raw number if not valid hex
          instruction = parseInt(request.instruction, 16);
          instructionInfo = {
            decoded: `0x${instruction.toString(16).padStart(8, '0')}`,
            mode: request.mode || 'mips32',
            hex_encoded: HexInstruction.encode(instruction)
          };
        }
        
        if (request.mode) {
          cpu.setExecutionMode(request.mode);
        }
        
        cpu.executeInstruction(instruction);
      } else {
        // Fetch and execute next instruction
        instruction = cpu.fetch();
        instructionInfo = {
          decoded: `0x${instruction.toString(16).padStart(8, '0')}`,
          mode: cpu.getExecutionMode(),
          hex_encoded: HexInstruction.encode(instruction)
        };
        cpu.executeInstruction(instruction);
      }

      response = {
        success: true,
        cpu_state: cpu.getState(),
        execution_history: cpu.getExecutionHistory(),
        performance_metrics: cpu.getPerformanceMetrics(),
        instruction_info: instructionInfo
      };
    } catch (error) {
      response = {
        success: false,
        cpu_state: cpu.getState(),
        execution_history: cpu.getExecutionHistory(),
        performance_metrics: cpu.getPerformanceMetrics(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    const errorResponse: AdvanceInstructionResponse = {
      success: false,
      cpu_state: getCPU().getState(),
      execution_history: getCPU().getExecutionHistory(),
      performance_metrics: getCPU().getPerformanceMetrics(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};