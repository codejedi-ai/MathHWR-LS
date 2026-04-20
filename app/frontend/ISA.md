# DARCY128 Instruction Set Architecture
## Complete Reference Manual

This repository includes the DARCY128 ISA reference provided by the user. For full details (opcodes, encodings, examples, calling convention, and future extensions), see the in-app documentation or the original specification shared in the project discussion.

Key highlights:
- 32 general-purpose 128-bit registers
- 128-bit memory words; 32-bit instruction encoding
- RISC load/store design; no branch delay slots
- Register-based jumps (jr, jalr); MIPS32 compatibility mode

Instruction categories implemented in the visual programmer:
- Arithmetic: add, sub, mult, multu, div, divu
- Moves: mfhi, mflo, lis
- Comparisons: slt, sltu
- Memory: lw, sw
- Branches: beq, bne
- Jumps: jr, jalr
