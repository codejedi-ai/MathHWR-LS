import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/Navbar';
import { MIPS32CPU } from '../../emulator/MIPS32CPU';
import { MIPS32StateService } from '../../services/MIPS32StateService';
import styles from '../styles/features.module.css';

// ============================================================================
// Test Suite Component
// ============================================================================

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  message: string;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

export default function FeaturesPage() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cpu] = useState(() => new Darcy128CPU());
  const [stateService] = useState(() => new Darcy128StateService());

  // Test Hex Instruction Encoding/Decoding
  const testHexInstructions = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Test 1: Basic ADD instruction
    const start1 = performance.now();
    try {
      const addInstruction = new HexInstruction('0x00221820'); // ADD $3, $1, $2
      const decoded = addInstruction.decode();
      
      if (decoded.opcode === 0 && decoded.function === 0x20 && 
          decoded.rs === 1 && decoded.rt === 2 && decoded.rd === 3) {
        tests.push({
          name: 'ADD Instruction Encoding/Decoding',
          status: 'passed',
          message: 'Successfully encoded and decoded ADD instruction',
          duration: performance.now() - start1
        });
      } else {
        tests.push({
          name: 'ADD Instruction Encoding/Decoding',
          status: 'failed',
          message: 'Failed to decode ADD instruction correctly',
          duration: performance.now() - start1
        });
      }
    } catch (error) {
      tests.push({
        name: 'ADD Instruction Encoding/Decoding',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start1
      });
    }

    // Test 2: LW instruction with offset
    const start2 = performance.now();
    try {
      const lwInstruction = new HexInstruction('0x8C220004'); // LW $2, 4($1)
      const decoded = lwInstruction.decode();
      
      if (decoded.opcode === 0x23 && decoded.rs === 1 && 
          decoded.rt === 2 && decoded.immediate === 4) {
        tests.push({
          name: 'LW Instruction Encoding/Decoding',
          status: 'passed',
          message: 'Successfully encoded and decoded LW instruction',
          duration: performance.now() - start2
        });
      } else {
        tests.push({
          name: 'LW Instruction Encoding/Decoding',
          status: 'failed',
          message: 'Failed to decode LW instruction correctly',
          duration: performance.now() - start2
        });
      }
    } catch (error) {
      tests.push({
        name: 'LW Instruction Encoding/Decoding',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start2
      });
    }

    // Test 3: BEQ instruction
    const start3 = performance.now();
    try {
      const beqInstruction = new HexInstruction('0x10220008'); // BEQ $1, $2, 8
      const decoded = beqInstruction.decode();
      
      if (decoded.opcode === 0x04 && decoded.rs === 1 && 
          decoded.rt === 2 && decoded.immediate === 8) {
        tests.push({
          name: 'BEQ Instruction Encoding/Decoding',
          status: 'passed',
          message: 'Successfully encoded and decoded BEQ instruction',
          duration: performance.now() - start3
        });
      } else {
        tests.push({
          name: 'BEQ Instruction Encoding/Decoding',
          status: 'failed',
          message: 'Failed to decode BEQ instruction correctly',
          duration: performance.now() - start3
        });
      }
    } catch (error) {
      tests.push({
        name: 'BEQ Instruction Encoding/Decoding',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start3
      });
    }

    return tests;
  };

  // Test Memory Map Operations
  const testMemoryMap = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Test 1: Memory write and read
    const start1 = performance.now();
    try {
      const memory = cpu.getMemory();
      const testAddress = '0x1000';
      const testValue = '0x123456789ABCDEF0';
      
      memory.set(testAddress, testValue);
      const readValue = memory.get(testAddress);
      
      if (readValue === testValue) {
        tests.push({
          name: 'Memory Write/Read Operations',
          status: 'passed',
          message: 'Successfully wrote and read from memory map',
          duration: performance.now() - start1
        });
      } else {
        tests.push({
          name: 'Memory Write/Read Operations',
          status: 'failed',
          message: `Expected ${testValue}, got ${readValue}`,
          duration: performance.now() - start1
        });
      }
    } catch (error) {
      tests.push({
        name: 'Memory Write/Read Operations',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start1
      });
    }

    // Test 2: Memory alignment
    const start2 = performance.now();
    try {
      const memory = cpu.getMemory();
      const alignedAddress = '0x1000';
      const unalignedAddress = '0x1001';
      
      memory.set(alignedAddress, '0x123456789ABCDEF0');
      memory.set(unalignedAddress, '0xFEDCBA9876543210');
      
      const alignedValue = memory.get(alignedAddress);
      const unalignedValue = memory.get(unalignedAddress);
      
      if (alignedValue === '0x123456789ABCDEF0' && unalignedValue === '0xFEDCBA9876543210') {
        tests.push({
          name: 'Memory Alignment Support',
          status: 'passed',
          message: 'Memory map supports both aligned and unaligned access',
          duration: performance.now() - start2
        });
      } else {
        tests.push({
          name: 'Memory Alignment Support',
          status: 'failed',
          message: 'Memory alignment test failed',
          duration: performance.now() - start2
        });
      }
    } catch (error) {
      tests.push({
        name: 'Memory Alignment Support',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start2
      });
    }

    return tests;
  };

  // Test MIPS32 Compatibility
  const testMips32Compatibility = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Test 1: Basic arithmetic
    const start1 = performance.now();
    try {
      cpu.reset();
      
      // Set up registers
      cpu.setRegister(1, BigInt(100));
      cpu.setRegister(2, BigInt(200));
      
      // Execute ADD instruction
      const addInstruction = new HexInstruction('0x00221820'); // ADD $3, $1, $2
      cpu.executeInstruction(addInstruction);
      
      const result = cpu.getRegister(3);
      if (result === BigInt(300)) {
        tests.push({
          name: 'MIPS32 ADD Compatibility',
          status: 'passed',
          message: 'ADD instruction works correctly in DARCY128',
          duration: performance.now() - start1
        });
      } else {
        tests.push({
          name: 'MIPS32 ADD Compatibility',
          status: 'failed',
          message: `Expected 300, got ${result}`,
          duration: performance.now() - start1
        });
      }
    } catch (error) {
      tests.push({
        name: 'MIPS32 ADD Compatibility',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start1
      });
    }

    // Test 2: Memory operations
    const start2 = performance.now();
    try {
      cpu.reset();
      
      // Set up memory
      const memory = cpu.getMemory();
      memory.set('0x1000', '0x123456789ABCDEF0');
      
      // Execute LW instruction
      const lwInstruction = new HexInstruction('0x8C220000'); // LW $2, 0($1)
      cpu.setRegister(1, BigInt(0x1000));
      cpu.executeInstruction(lwInstruction);
      
      const result = cpu.getRegister(2);
      if (result === BigInt('0x123456789ABCDEF0')) {
        tests.push({
          name: 'MIPS32 LW Compatibility',
          status: 'passed',
          message: 'LW instruction works correctly in DARCY128',
          duration: performance.now() - start2
        });
      } else {
        tests.push({
          name: 'MIPS32 LW Compatibility',
          status: 'failed',
          message: `Expected 0x123456789ABCDEF0, got 0x${result.toString(16)}`,
          duration: performance.now() - start2
        });
      }
    } catch (error) {
      tests.push({
        name: 'MIPS32 LW Compatibility',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start2
      });
    }

    return tests;
  };

  // Test API Endpoints
  const testAPIEndpoints = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Test 1: Health Check
    const start1 = performance.now();
    try {
      const healthResponse = await stateService.healthCheck();
      if (healthResponse.status === 'healthy') {
        tests.push({
          name: 'Health Check Endpoint',
          status: 'passed',
          message: 'Health check endpoint is working',
          duration: performance.now() - start1
        });
      } else {
        tests.push({
          name: 'Health Check Endpoint',
          status: 'failed',
          message: 'Health check endpoint returned unhealthy status',
          duration: performance.now() - start1
        });
      }
    } catch (error) {
      tests.push({
        name: 'Health Check Endpoint',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start1
      });
    }

    // Test 2: Save State
    const start2 = performance.now();
    try {
      const cpuState = cpu.getState();
      const saveResponse = await stateService.saveState(cpuState, [], {});
      if (saveResponse.success) {
        tests.push({
          name: 'Save State Endpoint',
          status: 'passed',
          message: 'Save state endpoint is working',
          duration: performance.now() - start2
        });
      } else {
        tests.push({
          name: 'Save State Endpoint',
          status: 'failed',
          message: 'Save state endpoint failed',
          duration: performance.now() - start2
        });
      }
    } catch (error) {
      tests.push({
        name: 'Save State Endpoint',
        status: 'failed',
        message: `Error: ${error}`,
        duration: performance.now() - start2
      });
    }

    return tests;
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    const suites: TestSuite[] = [
      { name: 'Base 16 (Hex) Instruction Tests', tests: [], status: 'pending', totalTests: 0, passedTests: 0, failedTests: 0 },
      { name: 'Memory Map Tests', tests: [], status: 'pending', totalTests: 0, passedTests: 0, failedTests: 0 },
      { name: 'MIPS32 Compatibility Tests', tests: [], status: 'pending', totalTests: 0, passedTests: 0, failedTests: 0 },
      { name: 'State Persistence Tests', tests: [], status: 'pending', totalTests: 0, passedTests: 0, failedTests: 0 }
    ];
    setTestSuites(suites);

    // Run Hex Tests
    suites[0].status = 'running';
    setTestSuites([...suites]);
    suites[0].tests = await testHexInstructions();
    suites[0].status = 'completed';
    suites[0].totalTests = suites[0].tests.length;
    suites[0].passedTests = suites[0].tests.filter(t => t.status === 'passed').length;
    suites[0].failedTests = suites[0].tests.filter(t => t.status === 'failed').length;
    setTestSuites([...suites]);

    // Run Memory Map Tests
    suites[1].status = 'running';
    setTestSuites([...suites]);
    suites[1].tests = await testMemoryMap();
    suites[1].status = 'completed';
    suites[1].totalTests = suites[1].tests.length;
    suites[1].passedTests = suites[1].tests.filter(t => t.status === 'passed').length;
    suites[1].failedTests = suites[1].tests.filter(t => t.status === 'failed').length;
    setTestSuites([...suites]);

    // Run MIPS32 Compatibility Tests
    suites[2].status = 'running';
    setTestSuites([...suites]);
    suites[2].tests = await testMips32Compatibility();
    suites[2].status = 'completed';
    suites[2].totalTests = suites[2].tests.length;
    suites[2].passedTests = suites[2].tests.filter(t => t.status === 'passed').length;
    suites[2].failedTests = suites[2].tests.filter(t => t.status === 'failed').length;
    setTestSuites([...suites]);

    // Run State Persistence Tests
    suites[3].status = 'running';
    setTestSuites([...suites]);
    suites[3].tests = await testAPIEndpoints();
    suites[3].status = 'completed';
    suites[3].totalTests = suites[3].tests.length;
    suites[3].passedTests = suites[3].tests.filter(t => t.status === 'passed').length;
    suites[3].failedTests = suites[3].tests.filter(t => t.status === 'failed').length;
    setTestSuites([...suites]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page} style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <div className={styles.content}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ color: '#00ffff', fontSize: '32px', margin: 0 }}>DARCY128 Test Suite</h1>
                <p style={{ color: '#cccccc', marginTop: '10px' }}>
                  Comprehensive browser-based tests for base 16 (hex) instructions, map-based memory, and MIPS32 compatibility
                </p>
              </div>
              <button
                onClick={runAllTests}
                disabled={isRunning}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isRunning ? '#666' : '#0066ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
              </button>
            </div>

            {/* Test Summary */}
            {testSuites.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', border: '1px solid #333' }}>
                <h3 style={{ color: '#00ff00', marginTop: 0 }}>Test Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' }}>
                  {testSuites.map((suite, index) => (
                    <div key={index} style={{ padding: '10px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ccc', fontSize: '14px' }}>{suite.name}</span>
                        <span style={{ color: suite.status === 'completed' ? '#00ff00' : suite.status === 'running' ? '#ffaa00' : '#666' }}>
                          {getStatusIcon(suite.status)}
                        </span>
                      </div>
                      <div style={{ marginTop: '5px', fontSize: '12px', color: '#888' }}>
                        {suite.totalTests > 0 && (
                          <>
                            ✅ {suite.passedTests} | ❌ {suite.failedTests} | Total: {suite.totalTests}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Results */}
            {testSuites.map((suite, suiteIndex) => (
              <div key={suiteIndex} style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#00ffff', marginBottom: '10px' }}>
                  {getStatusIcon(suite.status)} {suite.name}
                </h3>
                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden' }}>
                  {suite.tests.map((test, testIndex) => (
                    <div key={testIndex} style={{ 
                      padding: '15px', 
                      borderBottom: testIndex < suite.tests.length - 1 ? '1px solid #333' : 'none',
                      backgroundColor: test.status === 'passed' ? 'rgba(0, 255, 0, 0.1)' : test.status === 'failed' ? 'rgba(255, 0, 0, 0.1)' : 'transparent'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>
                            {getStatusIcon(test.status)} {test.name}
                          </span>
                          <p style={{ color: '#ccc', margin: '5px 0 0 0', fontSize: '14px' }}>
                            {test.message}
                          </p>
                        </div>
                        <span style={{ color: '#888', fontSize: '12px' }}>
                          {test.duration.toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Instructions */}
            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', border: '1px solid #333' }}>
              <h3 style={{ color: '#00ff00', marginTop: 0 }}>Test Instructions</h3>
              <p style={{ color: '#ccc', marginBottom: '10px' }}>
                This comprehensive test suite validates the DARCY128 processor implementation:
              </p>
              <ul style={{ color: '#ccc', paddingLeft: '20px' }}>
                <li><strong>Base 16 (Hex) Instruction Tests:</strong> Validates instruction encoding and decoding</li>
                <li><strong>Memory Map Tests:</strong> Tests memory read/write operations and alignment</li>
                <li><strong>MIPS32 Compatibility Tests:</strong> Ensures backward compatibility with MIPS32</li>
                <li><strong>State Persistence Tests:</strong> Validates API endpoints for state management</li>
              </ul>
              <p style={{ color: '#888', fontSize: '14px', marginTop: '15px' }}>
                Click "Run All Tests" to execute the complete test suite and verify DARCY128 functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
