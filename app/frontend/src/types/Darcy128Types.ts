// Darcy128 Processor Types
// Revolutionary 128-bit processor architecture

export interface Darcy128Register {
  name: string;
  value: bigint; // 128-bit value stored as BigInt
  type: 'general' | 'vector' | 'crypto' | 'control';
  width: 128;
}

export interface Darcy128VectorRegister {
  name: string;
  // SIMD data - can hold multiple values
  fp32: number[]; // 4x 32-bit floats
  fp16: number[]; // 8x 16-bit floats  
  int32: number[]; // 4x 32-bit integers
  int16: number[]; // 8x 16-bit integers
  int8: number[];  // 16x 8-bit integers
}

export interface Darcy128Instruction {
  address: number;
  instruction: string;
  opcode: string;
  operands: string[];
  description: string;
  category: 'arithmetic' | 'simd' | 'crypto' | 'memory' | 'control' | 'quad-precision';
  width: 32 | 64 | 128; // Instruction width mode
}

export interface Darcy128Memory {
  [address: number]: bigint; // 128-bit memory words
}

export interface Darcy128ExecutionState {
  pc: number; // Program counter
  mode: '32bit' | '64bit' | '128bit'; // Execution mode
  flags: {
    zero: boolean;
    carry: boolean;
    overflow: boolean;
    sign: boolean;
  };
  simdMode: 'fp32' | 'fp16' | 'int32' | 'int16' | 'int8';
}

// Darcy128-specific data types
export interface QuadPrecisionFloat {
  sign: boolean;
  exponent: number; // 15 bits
  mantissa: bigint; // 113 bits
}

export interface CryptoBlock {
  data: bigint; // 128-bit block
  key: bigint;  // 128-bit key
}

export interface UUID {
  data: bigint; // Native 128-bit UUID
}

export interface IPv6Address {
  data: bigint; // Native 128-bit IPv6
}

// Performance metrics for Darcy128
export interface Darcy128Metrics {
  instructionsPerCycle: number;
  simdUtilization: number;
  cryptoAcceleration: number;
  quadPrecisionOps: number;
  memoryBandwidthUtilization: number;
}
