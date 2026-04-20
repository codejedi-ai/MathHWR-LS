// Simple MIPS32 CPU Emulator
// Implements basic MIPS32 instruction set architecture

export interface MIPS32Register {
  name: string;
  value: number; // 32-bit value
}

export interface MIPS32CPUState {
  registers: MIPS32Register[];
  pc: number;
  hi: number;
  lo: number;
  running: boolean;
  memory: MIPS32Memory;
}

export interface MemoryEntry {
  address: number;
  value: number;
  is_instruction: boolean;
  decoded_instruction?: string;
}

// Simple MIPS32 Memory class
export class MIPS32Memory {
  private memory: Map<number, number> = new Map(); // Address -> 32-bit value
  private readonly MEMORY_SIZE: number;
  
  // Memory sections (byte-addressed)
  public static readonly TEXT_START = 0x00400000;  // Standard MIPS text segment
  public static readonly TEXT_END   = 0x0FFFFFFF;
  public static readonly DATA_START = 0x10010000;  // Standard MIPS data segment
  public static readonly DATA_END   = 0x7FFFFFFF;
  
  constructor(sizeBytes: number = 1024 * 1024) { // 1MB default
    this.MEMORY_SIZE = sizeBytes;
  }
  
  loadWord(address: number): number {
    this.checkAddress(address);
    this.checkAlignment(address, 4);
    return this.memory.get(address) || 0;
  }
  
  storeWord(address: number, value: number): void {
    this.checkAddress(address);
    this.checkAlignment(address, 4);
    this.memory.set(address, value >>> 0); // Ensure 32-bit unsigned
  }
  
  loadByte(address: number): number {
    const wordAddr = address & ~3;
    const word = this.loadWord(wordAddr);
    const byteOffset = address & 3;
    return (word >>> (8 * (3 - byteOffset))) & 0xFF;
  }
  
  storeByte(address: number, value: number): void {
    const wordAddr = address & ~3;
    const word = this.loadWord(wordAddr);
    const byteOffset = address & 3;
    const mask = ~(0xFF << (8 * (3 - byteOffset)));
    const newWord = (word & mask) | ((value & 0xFF) << (8 * (3 - byteOffset)));
    this.storeWord(wordAddr, newWord);
  }
  
  private checkAddress(address: number): void {
    if (address < 0 || address >= this.MEMORY_SIZE) {
      throw new Error(`Memory access out of bounds: 0x${address.toString(16)}`);
    }
  }
  
  private checkAlignment(address: number, alignment: number): void {
    if (address % alignment !== 0) {
      throw new Error(`Unaligned memory access: 0x${address.toString(16)} (alignment: ${alignment})`);
    }
  }
  
  getMemoryEntries(): MemoryEntry[] {
    const entries: MemoryEntry[] = [];
    for (const [address, value] of this.memory.entries()) {
      entries.push({
        address,
        value,
        is_instruction: address >= MIPS32Memory.TEXT_START && address <= MIPS32Memory.TEXT_END,
        decoded_instruction: this.decodeInstruction(value)
      });
    }
    return entries.sort((a, b) => a.address - b.address);
  }
  
  private decodeInstruction(word: number): string {
    const opcode = (word >>> 26) & 0x3F;
    
    // R-type instructions (opcode = 0)
    if (opcode === 0) {
      const funct = word & 0x3F;
      const rs = (word >>> 21) & 0x1F;
      const rt = (word >>> 16) & 0x1F;
      const rd = (word >>> 11) & 0x1F;
      const shamt = (word >>> 6) & 0x1F;
      
      switch (funct) {
        case 0x20: return `add $${rd}, $${rs}, $${rt}`;
        case 0x21: return `addu $${rd}, $${rs}, $${rt}`;
        case 0x22: return `sub $${rd}, $${rs}, $${rt}`;
        case 0x23: return `subu $${rd}, $${rs}, $${rt}`;
        case 0x24: return `and $${rd}, $${rs}, $${rt}`;
        case 0x25: return `or $${rd}, $${rs}, $${rt}`;
        case 0x26: return `xor $${rd}, $${rs}, $${rt}`;
        case 0x27: return `nor $${rd}, $${rs}, $${rt}`;
        case 0x2A: return `slt $${rd}, $${rs}, $${rt}`;
        case 0x2B: return `sltu $${rd}, $${rs}, $${rt}`;
        case 0x00: return shamt === 0 ? `nop` : `sll $${rd}, $${rt}, ${shamt}`;
        case 0x02: return `srl $${rd}, $${rt}, ${shamt}`;
        case 0x03: return `sra $${rd}, $${rt}, ${shamt}`;
        case 0x08: return `jr $${rs}`;
        case 0x09: return `jalr $${rd}, $${rs}`;
        default: return `unknown_r(0x${funct.toString(16)})`;
      }
    }
    
    // J-type instructions
    if (opcode === 0x02) return `j 0x${((word & 0x3FFFFFF) << 2).toString(16)}`;
    if (opcode === 0x03) return `jal 0x${((word & 0x3FFFFFF) << 2).toString(16)}`;
    
    // I-type instructions
    const rs = (word >>> 21) & 0x1F;
    const rt = (word >>> 16) & 0x1F;
    const immediate = word & 0xFFFF;
    const signExtImm = immediate & 0x8000 ? immediate | 0xFFFF0000 : immediate;
    
    switch (opcode) {
      case 0x08: return `addi $${rt}, $${rs}, ${signExtImm}`;
      case 0x09: return `addiu $${rt}, $${rs}, ${signExtImm}`;
      case 0x0C: return `andi $${rt}, $${rs}, 0x${immediate.toString(16)}`;
      case 0x0D: return `ori $${rt}, $${rs}, 0x${immediate.toString(16)}`;
      case 0x0E: return `xori $${rt}, $${rs}, 0x${immediate.toString(16)}`;
      case 0x0F: return `lui $${rt}, 0x${immediate.toString(16)}`;
      case 0x23: return `lw $${rt}, ${signExtImm}($${rs})`;
      case 0x2B: return `sw $${rt}, ${signExtImm}($${rs})`;
      case 0x20: return `lb $${rt}, ${signExtImm}($${rs})`;
      case 0x28: return `sb $${rt}, ${signExtImm}($${rs})`;
      case 0x04: return `beq $${rs}, $${rt}, ${signExtImm}`;
      case 0x05: return `bne $${rs}, $${rt}, ${signExtImm}`;
      case 0x0A: return `slti $${rt}, $${rs}, ${signExtImm}`;
      case 0x0B: return `sltiu $${rt}, $${rs}, ${signExtImm}`;
      default: return `unknown(0x${opcode.toString(16)})`;
    }
  }
}

export class MIPS32CPU {
  private registers: number[] = Array.from({ length: 32 }, () => 0); // $0-$31
  private pc: number = MIPS32Memory.TEXT_START;
  private hi: number = 0;
  private lo: number = 0;
  private running: boolean = false;
  private memory: MIPS32Memory;
  
  // Register names for debugging
  private static readonly REGISTER_NAMES = [
    '$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3',
    '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
    '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
    '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'
  ];
  
  constructor(memory: MIPS32Memory) {
    this.memory = memory;
    this.registers[29] = MIPS32Memory.DATA_END; // Initialize stack pointer
  }
  
  getState(): MIPS32CPUState {
    const registerList: MIPS32Register[] = this.registers.map((value, index) => ({
      name: MIPS32CPU.REGISTER_NAMES[index],
      value
    }));
    
    return {
      registers: registerList,
      pc: this.pc,
      hi: this.hi,
      lo: this.lo,
      running: this.running,
      memory: this.memory
    };
  }
  
  start(): void {
    this.running = true;
  }
  
  stop(): void {
    this.running = false;
  }
  
  reset(): void {
    this.registers.fill(0);
    this.pc = MIPS32Memory.TEXT_START;
    this.hi = 0;
    this.lo = 0;
    this.running = false;
    this.registers[29] = MIPS32Memory.DATA_END; // Reset stack pointer
  }
  
  step(): boolean {
    if (!this.running) return false;
    
    try {
      const instruction = this.memory.loadWord(this.pc);
      this.executeInstruction(instruction);
      return true;
    } catch (error) {
      console.error('CPU execution error:', error);
      this.running = false;
      return false;
    }
  }
  
  private executeInstruction(word: number): void {
    const opcode = (word >>> 26) & 0x3F;
    
    // R-type instructions (opcode = 0)
    if (opcode === 0) {
      this.executeRType(word);
      return;
    }
    
    // J-type instructions
    if (opcode === 0x02 || opcode === 0x03) {
      this.executeJType(word);
      return;
    }
    
    // I-type instructions
    this.executeIType(word);
  }
  
  private executeRType(word: number): void {
    const funct = word & 0x3F;
    const rs = (word >>> 21) & 0x1F;
    const rt = (word >>> 16) & 0x1F;
    const rd = (word >>> 11) & 0x1F;
    const shamt = (word >>> 6) & 0x1F;
    
    const rsVal = this.registers[rs];
    const rtVal = this.registers[rt];
    
    switch (funct) {
      case 0x20: // add
        this.setRegister(rd, rsVal + rtVal);
        break;
      case 0x21: // addu
        this.setRegister(rd, (rsVal + rtVal) >>> 0);
        break;
      case 0x22: // sub
        this.setRegister(rd, rsVal - rtVal);
        break;
      case 0x23: // subu
        this.setRegister(rd, (rsVal - rtVal) >>> 0);
        break;
      case 0x24: // and
        this.setRegister(rd, rsVal & rtVal);
        break;
      case 0x25: // or
        this.setRegister(rd, rsVal | rtVal);
        break;
      case 0x26: // xor
        this.setRegister(rd, rsVal ^ rtVal);
        break;
      case 0x27: // nor
        this.setRegister(rd, ~(rsVal | rtVal));
        break;
      case 0x2A: // slt
        this.setRegister(rd, rsVal < rtVal ? 1 : 0);
        break;
      case 0x2B: // sltu
        this.setRegister(rd, (rsVal >>> 0) < (rtVal >>> 0) ? 1 : 0);
        break;
      case 0x00: // sll
        this.setRegister(rd, rtVal << shamt);
        break;
      case 0x02: // srl
        this.setRegister(rd, rtVal >>> shamt);
        break;
      case 0x03: // sra
        this.setRegister(rd, rtVal >> shamt);
        break;
      case 0x08: // jr
        this.pc = rsVal;
        return; // Don't increment PC
      case 0x09: // jalr
        this.setRegister(rd, this.pc + 4);
        this.pc = rsVal;
        return; // Don't increment PC
    }
    
    this.pc += 4;
  }
  
  private executeJType(word: number): void {
    const opcode = (word >>> 26) & 0x3F;
    const address = (word & 0x3FFFFFF) << 2;
    const jumpTarget = (this.pc & 0xF0000000) | address;
    
    if (opcode === 0x02) { // j
      this.pc = jumpTarget;
    } else if (opcode === 0x03) { // jal
      this.setRegister(31, this.pc + 4); // Save return address
      this.pc = jumpTarget;
    }
  }
  
  private executeIType(word: number): void {
    const opcode = (word >>> 26) & 0x3F;
    const rs = (word >>> 21) & 0x1F;
    const rt = (word >>> 16) & 0x1F;
    const immediate = word & 0xFFFF;
    const signExtImm = immediate & 0x8000 ? immediate | 0xFFFF0000 : immediate;
    
    const rsVal = this.registers[rs];
    
    switch (opcode) {
      case 0x08: // addi
        this.setRegister(rt, rsVal + signExtImm);
        break;
      case 0x09: // addiu
        this.setRegister(rt, (rsVal + signExtImm) >>> 0);
        break;
      case 0x0C: // andi
        this.setRegister(rt, rsVal & immediate);
        break;
      case 0x0D: // ori
        this.setRegister(rt, rsVal | immediate);
        break;
      case 0x0E: // xori
        this.setRegister(rt, rsVal ^ immediate);
        break;
      case 0x0F: // lui
        this.setRegister(rt, immediate << 16);
        break;
      case 0x23: // lw
        const loadAddr = rsVal + signExtImm;
        this.setRegister(rt, this.memory.loadWord(loadAddr));
        break;
      case 0x2B: // sw
        const storeAddr = rsVal + signExtImm;
        this.memory.storeWord(storeAddr, this.registers[rt]);
        break;
      case 0x20: // lb
        const byteAddr = rsVal + signExtImm;
        const byte = this.memory.loadByte(byteAddr);
        this.setRegister(rt, byte & 0x80 ? byte | 0xFFFFFF00 : byte);
        break;
      case 0x28: // sb
        const storeByteAddr = rsVal + signExtImm;
        this.memory.storeByte(storeByteAddr, this.registers[rt] & 0xFF);
        break;
      case 0x04: // beq
        if (rsVal === this.registers[rt]) {
          this.pc += (signExtImm << 2);
        }
        break;
      case 0x05: // bne
        if (rsVal !== this.registers[rt]) {
          this.pc += (signExtImm << 2);
        }
        break;
      case 0x0A: // slti
        this.setRegister(rt, rsVal < signExtImm ? 1 : 0);
        break;
      case 0x0B: // sltiu
        this.setRegister(rt, (rsVal >>> 0) < (signExtImm >>> 0) ? 1 : 0);
        break;
    }
    
    this.pc += 4;
  }
  
  private setRegister(reg: number, value: number): void {
    if (reg !== 0) { // $zero is always 0
      this.registers[reg] = value >>> 0; // Ensure 32-bit unsigned
    }
  }
  
  // Methods for external access
  getRegister(reg: number): number {
    return this.registers[reg] || 0;
  }
  
  setPC(address: number): void {
    this.pc = address;
  }
  
  getPC(): number {
    return this.pc;
  }
  
  loadProgram(instructions: number[], startAddr: number = MIPS32Memory.TEXT_START): void {
    for (let i = 0; i < instructions.length; i++) {
      this.memory.storeWord(startAddr + (i * 4), instructions[i]);
    }
    this.pc = startAddr;
  }
}

// Default memory instance
export const defaultMemory = new MIPS32Memory();