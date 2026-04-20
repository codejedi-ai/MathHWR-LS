import React, { useRef, useEffect, useState } from "react";
import Navbar from "./navbar/Navbar";

interface MipsInstruction {
  address: number;
  instruction: string;
  opcode: string;
  operands: string[];
  description: string;
}

interface MipsEmulatorProps {
  screenWidth: number;
}

export default function MipsEmulator({ screenWidth }: MipsEmulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [instructions, setInstructions] = useState<MipsInstruction[]>([
    { address: 0x00400000, instruction: "addi $t0, $zero, 5", opcode: "addi", operands: ["$t0", "$zero", "5"], description: "Load immediate value 5 into $t0" },
    { address: 0x00400004, instruction: "addi $t1, $zero, 10", opcode: "addi", operands: ["$t1", "$zero", "10"], description: "Load immediate value 10 into $t1" },
    { address: 0x00400008, instruction: "add $t2, $t0, $t1", opcode: "add", operands: ["$t2", "$t0", "$t1"], description: "Add $t0 and $t1, store result in $t2" },
    { address: 0x0040000c, instruction: "sub $t3, $t1, $t0", opcode: "sub", operands: ["$t3", "$t1", "$t0"], description: "Subtract $t0 from $t1, store result in $t3" },
    { address: 0x00400010, instruction: "beq $t2, $t1, label", opcode: "beq", operands: ["$t2", "$t1", "label"], description: "Branch if $t2 equals $t1" },
    { address: 0x00400014, instruction: "j exit", opcode: "j", operands: ["exit"], description: "Jump to exit label" },
  ]);
  
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [registers, setRegisters] = useState<{ [key: string]: number }>({
    "$zero": 0,
    "$t0": 0,
    "$t1": 0,
    "$t2": 0,
    "$t3": 0,
    "$t4": 0,
    "$t5": 0,
    "$t6": 0,
    "$t7": 0,
    "$t8": 0,
    "$t9": 0,
  });
  const [memory, setMemory] = useState<{ [key: number]: number }>({});
  const [executionHistory, setExecutionHistory] = useState<string[]>([]);

  // Setup canvas for visual representation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth - 4;
      canvas.height = window.innerHeight - (screenWidth < 768 ? 60 : 70);
    };
    
    updateCanvasSize();

    // Draw function
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw instruction list
      const instructionWidth = canvas.width * 0.4;
      const instructionHeight = 40;
      const startY = 50;
      
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(10, 10, instructionWidth, canvas.height - 20);
      
      // Draw instruction header
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 16px monospace";
      ctx.fillText("MIPS Instructions", 20, 35);
      
      // Draw instructions
      instructions.forEach((inst, index) => {
        const y = startY + (index * instructionHeight);
        
        // Highlight current instruction
        if (index === currentInstructionIndex) {
          ctx.fillStyle = "#ff69b4";
          ctx.fillRect(15, y - 5, instructionWidth - 10, instructionHeight - 5);
          
          // Draw arrow pointing to current instruction
          ctx.fillStyle = "#ff69b4";
          ctx.beginPath();
          ctx.moveTo(instructionWidth + 20, y + instructionHeight / 2);
          ctx.lineTo(instructionWidth + 40, y + instructionHeight / 2 - 10);
          ctx.lineTo(instructionWidth + 40, y + instructionHeight / 2 + 10);
          ctx.closePath();
          ctx.fill();
        }
        
        // Draw instruction address
        ctx.fillStyle = "#888";
        ctx.font = "12px monospace";
        ctx.fillText(`0x${inst.address.toString(16).padStart(8, '0')}`, 20, y + 15);
        
        // Draw instruction text
        ctx.fillStyle = index === currentInstructionIndex ? "#000" : "#fff";
        ctx.font = "14px monospace";
        ctx.fillText(inst.instruction, 20, y + 30);
      });
      
      // Draw registers panel
      const registersX = instructionWidth + 60;
      const registersWidth = canvas.width - registersX - 20;
      
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(registersX, 10, registersWidth, canvas.height - 20);
      
      // Draw registers header
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 16px monospace";
      ctx.fillText("Registers", registersX + 10, 35);
      
      // Draw registers
      const registerEntries = Object.entries(registers);
      registerEntries.forEach(([reg, value], index) => {
        const y = startY + (index * 25);
        
        ctx.fillStyle = "#fff";
        ctx.font = "12px monospace";
        ctx.fillText(`${reg}:`, registersX + 10, y + 15);
        
        ctx.fillStyle = "#8a2be2";
        ctx.fillText(`0x${value.toString(16).padStart(8, '0')}`, registersX + 80, y + 15);
        
        ctx.fillStyle = "#888";
        ctx.fillText(`(${value})`, registersX + 180, y + 15);
      });
      
      // Draw execution history
      const historyY = startY + (registerEntries.length * 25) + 30;
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 14px monospace";
      ctx.fillText("Execution History", registersX + 10, historyY);
      
      executionHistory.slice(-10).forEach((entry, index) => {
        const y = historyY + 20 + (index * 18);
        ctx.fillStyle = "#fff";
        ctx.font = "11px monospace";
        ctx.fillText(entry, registersX + 10, y);
      });
      
      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [instructions, currentInstructionIndex, registers, executionHistory, screenWidth]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth - 4;
        canvas.height = window.innerHeight - (window.innerWidth < 768 ? 60 : 70);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const executeInstruction = (instruction: MipsInstruction) => {
    const newRegisters = { ...registers };
    let newHistory = [...executionHistory];
    
    switch (instruction.opcode) {
      case "addi":
        const dest = instruction.operands[0];
        const src = instruction.operands[1];
        const imm = parseInt(instruction.operands[2]);
        newRegisters[dest] = newRegisters[src] + imm;
        newHistory.push(`Executed: ${instruction.instruction} -> ${dest} = ${newRegisters[dest]}`);
        break;
        
      case "add":
        const destAdd = instruction.operands[0];
        const src1 = instruction.operands[1];
        const src2 = instruction.operands[2];
        newRegisters[destAdd] = newRegisters[src1] + newRegisters[src2];
        newHistory.push(`Executed: ${instruction.instruction} -> ${destAdd} = ${newRegisters[destAdd]}`);
        break;
        
      case "sub":
        const destSub = instruction.operands[0];
        const src1Sub = instruction.operands[1];
        const src2Sub = instruction.operands[2];
        newRegisters[destSub] = newRegisters[src1Sub] - newRegisters[src2Sub];
        newHistory.push(`Executed: ${instruction.instruction} -> ${destSub} = ${newRegisters[destSub]}`);
        break;
        
      case "beq":
        const src1Beq = instruction.operands[0];
        const src2Beq = instruction.operands[1];
        if (newRegisters[src1Beq] === newRegisters[src2Beq]) {
          newHistory.push(`Branch taken: ${instruction.instruction} (${newRegisters[src1Beq]} == ${newRegisters[src2Beq]})`);
          // In a real emulator, this would jump to the label
        } else {
          newHistory.push(`Branch not taken: ${instruction.instruction} (${newRegisters[src1Beq]} != ${newRegisters[src2Beq]})`);
        }
        break;
        
      case "j":
        newHistory.push(`Jump to: ${instruction.operands[0]}`);
        break;
        
      default:
        newHistory.push(`Unknown instruction: ${instruction.instruction}`);
    }
    
    setRegisters(newRegisters);
    setExecutionHistory(newHistory);
  };

  const stepForward = () => {
    if (currentInstructionIndex < instructions.length - 1) {
      const nextIndex = currentInstructionIndex + 1;
      setCurrentInstructionIndex(nextIndex);
      executeInstruction(instructions[nextIndex]);
    }
  };

  const stepBackward = () => {
    if (currentInstructionIndex > 0) {
      setCurrentInstructionIndex(currentInstructionIndex - 1);
    }
  };

  const reset = () => {
    setCurrentInstructionIndex(0);
    setRegisters({
      "$zero": 0,
      "$t0": 0,
      "$t1": 0,
      "$t2": 0,
      "$t3": 0,
      "$t4": 0,
      "$t5": 0,
      "$t6": 0,
      "$t7": 0,
      "$t8": 0,
      "$t9": 0,
    });
    setExecutionHistory([]);
  };

  const runAll = () => {
    setIsRunning(true);
    setIsPaused(false);
    
    const runStep = () => {
      if (currentInstructionIndex < instructions.length - 1 && !isPaused) {
        setTimeout(() => {
          stepForward();
          runStep();
        }, 1000); // 1 second delay between steps
      } else {
        setIsRunning(false);
      }
    };
    
    runStep();
  };

  const pause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  return (
    <div style={{ 
      margin: 0, 
      padding: 0, 
      overflow: "auto",
      boxSizing: "border-box",
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh'
    }}>
      <Navbar screenWidth={screenWidth} />
      
      <div style={{ 
        position: "fixed",
        top: screenWidth < 768 ? "60px" : "70px",
        left: 0,
        width: "100vw",
        height: `calc(100vh - ${screenWidth < 768 ? "60px" : "70px"})`,
        overflow: "hidden"
      }}>
        {/* Title */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10
        }}>
          <h1 style={{ 
            color: "#00ffff", 
            fontSize: "28px", 
            fontWeight: "bold", 
            margin: 0,
            textShadow: "0 0 10px rgba(0, 255, 255, 0.5)"
          }}>
            DARCY128 MIPS32 Emulator
          </h1>
        </div>
      <canvas
        ref={canvasRef}
        width={window.innerWidth - 4}
        height={window.innerHeight - (screenWidth < 768 ? 60 : 70)}
        style={{
          display: "block",
          width: "calc(100% - 4px)",
          height: "calc(100% - 4px)",
          margin: "2px",
          background: "#1a1a1a"
        }}
      />
      
      {/* Control Panel */}
      <div style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0, 0, 0, 0.8)",
        padding: "10px 20px",
        borderRadius: "8px",
        display: "flex",
        gap: "10px",
        zIndex: 1000
      }}>
        <button
          onClick={stepBackward}
          disabled={currentInstructionIndex === 0}
          style={{
            padding: "8px 16px",
            background: currentInstructionIndex === 0 ? "#333" : "#8a2be2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: currentInstructionIndex === 0 ? "not-allowed" : "pointer"
          }}
        >
          ⬅️ Step Back
        </button>
        
        <button
          onClick={stepForward}
          disabled={currentInstructionIndex >= instructions.length - 1}
          style={{
            padding: "8px 16px",
            background: currentInstructionIndex >= instructions.length - 1 ? "#333" : "#ff69b4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: currentInstructionIndex >= instructions.length - 1 ? "not-allowed" : "pointer"
          }}
        >
          Step Forward ➡️
        </button>
        
        <button
          onClick={runAll}
          disabled={isRunning}
          style={{
            padding: "8px 16px",
            background: isRunning ? "#333" : "#00ffff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isRunning ? "not-allowed" : "pointer"
          }}
        >
          ▶️ Run All
        </button>
        
        <button
          onClick={pause}
          disabled={!isRunning}
          style={{
            padding: "8px 16px",
            background: !isRunning ? "#333" : "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: !isRunning ? "not-allowed" : "pointer"
          }}
        >
          ⏸️ Pause
        </button>
        
        <button
          onClick={reset}
          style={{
            padding: "8px 16px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          🔄 Reset
        </button>
      </div>
      
      {/* Current Instruction Info */}
      <div style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.8)",
        padding: "15px",
        borderRadius: "8px",
        color: "white",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 1000,
        maxWidth: "300px"
      }}>
        <div style={{ color: "#00ffff", fontWeight: "bold", marginBottom: "10px" }}>
          Current Instruction
        </div>
        <div style={{ marginBottom: "5px" }}>
          <strong>Address:</strong> 0x{instructions[currentInstructionIndex]?.address.toString(16).padStart(8, '0')}
        </div>
        <div style={{ marginBottom: "5px" }}>
          <strong>Instruction:</strong> {instructions[currentInstructionIndex]?.instruction}
        </div>
        <div style={{ marginBottom: "5px" }}>
          <strong>Opcode:</strong> {instructions[currentInstructionIndex]?.opcode}
        </div>
        <div>
          <strong>Description:</strong> {instructions[currentInstructionIndex]?.description}
        </div>
      </div>
    </div>
    </div>
  );
}
