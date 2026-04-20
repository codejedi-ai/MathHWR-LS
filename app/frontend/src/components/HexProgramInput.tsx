import React, { useState, useEffect } from 'react';
import Navbar from './navbar/Navbar';
import { useCPU } from '../emulator/CPUContext';

export default function HexProgramInput() {
  const cpu = useCPU();
  const [hexInput, setHexInput] = useState('');
  const [programLoaded, setProgramLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [cpuState, setCpuState] = useState(cpu.getState());
  const [executionHistory, setExecutionHistory] = useState<string[]>([]);
  const [currentPC, setCurrentPC] = useState(0x00400000);

  // Example program text to show format
  const exampleProgram = `// Example MIPS32 Program (hex format)
// Each line should contain one 32-bit instruction in hex
0x20080005  // addi $t0, $zero, 5     - Load 5 into $t0
0x2009000A  // addi $t1, $zero, 10    - Load 10 into $t1  
0x012A5020  // add $t2, $t1, $t0      - Add $t1 + $t0 -> $t2
0x012A5822  // sub $t3, $t1, $t0      - Sub $t1 - $t0 -> $t3
0x08100006  // j 0x400018             - Jump to address
0x00000000  // nop                    - No operation`;

  useEffect(() => {
    // Update CPU state when it changes
    setCpuState(cpu.getState());
    setCurrentPC(cpu.getPC());
  }, [cpu]);

  const parseHexProgram = (input: string): number[] => {
    const instructions: number[] = [];
    const lines = input.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) continue;
      
      // Extract hex instruction (before any comment)
      const hexMatch = trimmed.match(/^(0x[0-9A-Fa-f]{8})/);
      if (hexMatch) {
        const hexValue = hexMatch[1];
        const instruction = parseInt(hexValue, 16);
        instructions.push(instruction);
      }
    }
    
    return instructions;
  };

  const loadProgram = () => {
    try {
      const instructions = parseHexProgram(hexInput);
      if (instructions.length === 0) {
        alert('No valid hex instructions found. Please check your format.');
        return;
      }
      
      cpu.reset();
      cpu.loadProgram(instructions);
      setProgramLoaded(true);
      setCpuState(cpu.getState());
      setExecutionHistory([`Loaded ${instructions.length} instructions`]);
      alert(`Successfully loaded ${instructions.length} instructions!`);
    } catch (error) {
      alert(`Error loading program: ${error}`);
    }
  };

  const stepExecution = () => {
    if (!programLoaded) {
      alert('Please load a program first.');
      return;
    }
    
    try {
      const success = cpu.step();
      if (success) {
        const newState = cpu.getState();
        setCpuState(newState);
        setCurrentPC(cpu.getPC());
        setExecutionHistory(prev => [...prev, `Executed instruction at PC: 0x${currentPC.toString(16)}`]);
      } else {
        setExecutionHistory(prev => [...prev, 'Execution stopped or error occurred']);
      }
    } catch (error) {
      setExecutionHistory(prev => [...prev, `Error: ${error}`]);
    }
  };

  const runProgram = () => {
    if (!programLoaded) {
      alert('Please load a program first.');
      return;
    }
    
    setIsRunning(true);
    cpu.start();
    
    // Simple execution loop (in real implementation, you might want to use workers or intervals)
    const executeStep = () => {
      if (cpu.getState().running) {
        const success = cpu.step();
        setCpuState(cpu.getState());
        setCurrentPC(cpu.getPC());
        
        if (success && cpu.getState().running) {
          setTimeout(executeStep, 100); // 100ms delay between instructions
        } else {
          setIsRunning(false);
          setExecutionHistory(prev => [...prev, 'Program execution completed']);
        }
      } else {
        setIsRunning(false);
      }
    };
    
    executeStep();
  };

  const resetCPU = () => {
    cpu.reset();
    setCpuState(cpu.getState());
    setCurrentPC(0x00400000);
    setProgramLoaded(false);
    setIsRunning(false);
    setExecutionHistory([]);
  };

  const formatRegisterValue = (value: number): string => {
    return `0x${value.toString(16).padStart(8, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      <Navbar />
      <div style={{ paddingTop: '80px', padding: '20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>MIPS32 Hex Program Input</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Left Panel - Program Input */}
            <div>
              <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>Program Input</h2>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                  Enter your MIPS32 program in hexadecimal format:
                </label>
                <textarea
                  value={hexInput}
                  onChange={(e) => setHexInput((e.target as HTMLTextAreaElement).value)}
                  placeholder={exampleProgram}
                  style={{
                    width: '100%',
                    height: '300px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={loadProgram}
                  disabled={isRunning}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007acc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.6 : 1
                  }}
                >
                  Load Program
                </button>
                
                <button
                  onClick={stepExecution}
                  disabled={!programLoaded || isRunning}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (!programLoaded || isRunning) ? 'not-allowed' : 'pointer',
                    opacity: (!programLoaded || isRunning) ? 0.6 : 1
                  }}
                >
                  Step
                </button>
                
                <button
                  onClick={runProgram}
                  disabled={!programLoaded || isRunning}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (!programLoaded || isRunning) ? 'not-allowed' : 'pointer',
                    opacity: (!programLoaded || isRunning) ? 0.6 : 1
                  }}
                >
                  {isRunning ? 'Running...' : 'Run'}
                </button>
                
                <button
                  onClick={resetCPU}
                  disabled={isRunning}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.6 : 1
                  }}
                >
                  Reset
                </button>
              </div>
              
              {/* Execution History */}
              <div>
                <h3 style={{ color: '#00ff00', marginBottom: '10px' }}>Execution History</h3>
                <div style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '12px',
                  height: '150px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}>
                  {executionHistory.length === 0 ? (
                    <div style={{ color: '#666' }}>No execution history yet...</div>
                  ) : (
                    executionHistory.map((entry, index) => (
                      <div key={index} style={{ marginBottom: '4px', color: '#ccc' }}>
                        {entry}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Panel - CPU State */}
            <div>
              <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>CPU State</h2>
              
              {/* Special Registers */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#ffa500', marginBottom: '10px' }}>Special Registers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '12px' }}>PC</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {formatRegisterValue(cpuState.pc)}
                    </div>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '12px' }}>HI</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {formatRegisterValue(cpuState.hi)}
                    </div>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '12px' }}>LO</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {formatRegisterValue(cpuState.lo)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* General Purpose Registers */}
              <div>
                <h3 style={{ color: '#ffa500', marginBottom: '10px' }}>General Purpose Registers</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {cpuState.registers.map((reg, index) => (
                    <div key={index} style={{ 
                      padding: '6px', 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333', 
                      borderRadius: '4px' 
                    }}>
                      <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '11px' }}>
                        {reg.name}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ccc' }}>
                        {formatRegisterValue(reg.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Status */}
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#ffa500', marginBottom: '10px' }}>Status</h3>
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333', 
                  borderRadius: '6px' 
                }}>
                  <div style={{ marginBottom: '5px' }}>
                    <span style={{ color: '#00ff00' }}>Running: </span>
                    <span style={{ color: cpuState.running ? '#28a745' : '#dc3545' }}>
                      {cpuState.running ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#00ff00' }}>Program Loaded: </span>
                    <span style={{ color: programLoaded ? '#28a745' : '#dc3545' }}>
                      {programLoaded ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Help Section */}
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
            <h3 style={{ color: '#ffa500', marginBottom: '15px' }}>Help & Instructions</h3>
            <div style={{ color: '#ccc', lineHeight: '1.6' }}>
              <p><strong>Input Format:</strong> Each line should contain one 32-bit MIPS instruction in hexadecimal format (0x00000000).</p>
              <p><strong>Comments:</strong> Lines starting with '//' are ignored and can be used for comments.</p>
              <p><strong>Example Instructions:</strong></p>
              <ul style={{ marginLeft: '20px' }}>
                <li><code>0x20080005</code> - addi $t0, $zero, 5 (load immediate 5 into $t0)</li>
                <li><code>0x012A5020</code> - add $t2, $t1, $t0 (add $t1 and $t0, store in $t2)</li>
                <li><code>0x08100006</code> - j 0x400018 (jump to address 0x400018)</li>
              </ul>
              <p><strong>Controls:</strong></p>
              <ul style={{ marginLeft: '20px' }}>
                <li><strong>Load Program:</strong> Parse and load your hex program into memory</li>
                <li><strong>Step:</strong> Execute one instruction at a time</li>
                <li><strong>Run:</strong> Execute the entire program continuously</li>
                <li><strong>Reset:</strong> Reset CPU to initial state</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}