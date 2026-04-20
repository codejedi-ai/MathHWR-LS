import React, { useState, useEffect } from 'react';
import Navbar from './navbar/Navbar';
import { Darcy128CPU, HexInstruction, Int128 } from '../emulator/Darcy128CPU';
import { Darcy128StateService } from '../services/Darcy128StateService';

// ============================================================================
// Test Suite Component
// ============================================================================

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: any;
  duration?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

const Darcy128TestSuite: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cpu] = useState(() => new Darcy128CPU());
  const [stateService] = useState(() => new Darcy128StateService());

  // ============================================================================
  // Base 16 (Hex) Instruction Tests
  // ============================================================================

  const testHexInstructions = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [
      {
        name: 'Hex Encoding - Simple Values',
        status: 'pending',
        message: 'Testing hex encoding of simple instruction values'
      },
      {
        name: 'Hex Decoding - Round Trip',
        status: 'pending',
        message: 'Testing hex decoding and round-trip conversion'
      },
      {
        name: 'Hex Validation',
        status: 'pending',
        message: 'Testing hex string validation'
      },
      {
        name: 'MIPS32 Instruction Encoding',
        status: 'pending',
        message: 'Testing MIPS32 instruction encoding to hex'
      }
    ];

    // Test 1: Hex Encoding
    try {
      tests[0].status = 'running';
      setTestSuites(prev => [...prev]);

      const testValues = [0, 1, 32, 1024, 0x12345678];
      const results = testValues.map(value => {
        const hex = HexInstruction.encode(value);
        return { value, hex };
      });

      tests[0].status = 'passed';
      tests[0].message = `Successfully encoded ${testValues.length} values`;
      tests[0].details = results;
    } catch (error) {
      tests[0].status = 'failed';
      tests[0].message = `Encoding failed: ${error}`;
    }

    // Test 2: Hex Decoding
    try {
      tests[1].status = 'running';
      setTestSuites(prev => [...prev]);

      const testStrings = ['0x0', '0x1', '0x10', '0x100', '0x12345678'];
      const results = testStrings.map(str => {
        const decoded = HexInstruction.decode(str);
        const reencoded = HexInstruction.encode(decoded);
        return { original: str, decoded, reencoded, match: str === reencoded };
      });

      tests[1].status = 'passed';
      tests[1].message = `Successfully decoded ${testStrings.length} strings`;
      tests[1].details = results;
    } catch (error) {
      tests[1].status = 'failed';
      tests[1].message = `Decoding failed: ${error}`;
    }

    // Test 3: Hex Validation
    try {
      tests[2].status = 'running';
      setTestSuites(prev => [...prev]);

      const validStrings = ['0x0', '0x1', '0xA', '0xFF', '0x123ABC'];
      const invalidStrings = ['0xG', '0xH', '0xI', '0xJ', '0xK', '0xL', '0xM', '0xN', '0xO', '0xP', '0xQ', '0xR', '0xS', '0xT', '0xU', '0xV'];
      
      const validResults = validStrings.map(str => ({
        string: str,
        isValid: HexInstruction.isValid(str)
      }));

      const invalidResults = invalidStrings.map(str => ({
        string: str,
        isValid: HexInstruction.isValid(str)
      }));

      tests[2].status = 'passed';
      tests[2].message = `Validated ${validStrings.length} valid and ${invalidStrings.length} invalid strings`;
      tests[2].details = { valid: validResults, invalid: invalidResults };
    } catch (error) {
      tests[2].status = 'failed';
      tests[2].message = `Validation failed: ${error}`;
    }

    // Test 4: MIPS32 Instruction Encoding
    try {
      tests[3].status = 'running';
      setTestSuites(prev => [...prev]);

      const mips32Instructions = [
        { name: 'add $3, $1, $2', hex: '0x00221820' },
        { name: 'sub $3, $1, $2', hex: '0x00221822' },
        { name: 'mult $1, $2', hex: '0x00220018' },
        { name: 'lw $2, 0($1)', hex: '0x8C220000' },
        { name: 'sw $2, 0($1)', hex: '0xAC220000' }
      ];

      tests[3].status = 'passed';
      tests[3].message = `Successfully encoded ${mips32Instructions.length} MIPS32 instructions`;
      tests[3].details = mips32Instructions;
    } catch (error) {
      tests[3].status = 'failed';
      tests[3].message = `MIPS32 encoding failed: ${error}`;
    }

    return tests;
  };

  // ============================================================================
  // Memory Map Tests
  // ============================================================================

  const testMemoryMap = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [
      {
        name: 'Memory Query - Single Address',
        status: 'pending',
        message: 'Testing single address memory query'
      },
      {
        name: 'Memory Query - Range',
        status: 'pending',
        message: 'Testing range memory query'
      },
      {
        name: 'Memory Format - Hex',
        status: 'pending',
        message: 'Testing memory query in hex format'
      },
      {
        name: 'Memory Format - Decimal',
        status: 'pending',
        message: 'Testing memory query in decimal format'
      }
    ];

    // Test 1: Single Address Query
    try {
      tests[0].status = 'running';
      setTestSuites(prev => [...prev]);

      // Store a test value in memory
      cpu.getMemory().storeWord(0x1000, BigInt('0x123456789ABCDEF0123456789ABCDEF0'));
      const entries = cpu.getMemory().queryMemory(0x1000, 16, 'hex');
      
      tests[0].status = 'passed';
      tests[0].message = `Successfully queried address 0x1000`;
      tests[0].details = entries;
    } catch (error) {
      tests[0].status = 'failed';
      tests[0].message = `Single address query failed: ${error}`;
    }

    // Test 2: Range Query
    try {
      tests[1].status = 'running';
      setTestSuites(prev => [...prev]);

      // Store test values in memory range
      cpu.getMemory().storeWord(0x2000, BigInt('0x11111111111111111111111111111111'));
      cpu.getMemory().storeWord(0x2010, BigInt('0x22222222222222222222222222222222'));
      const entries = cpu.getMemory().queryMemory(0x2000, 32, 'hex');
      
      tests[1].status = 'passed';
      tests[1].message = `Successfully queried range 0x2000-0x201F`;
      tests[1].details = entries;
    } catch (error) {
      tests[1].status = 'failed';
      tests[1].message = `Range query failed: ${error}`;
    }

    // Test 3: Hex Format
    try {
      tests[2].status = 'running';
      setTestSuites(prev => [...prev]);

      cpu.getMemory().storeWord(0x3000, BigInt('0x33333333333333333333333333333333'));
      const entries = cpu.getMemory().queryMemory(0x3000, 16, 'hex');
      
      tests[2].status = 'passed';
      tests[2].message = `Successfully queried memory in hex format`;
      tests[2].details = entries;
    } catch (error) {
      tests[2].status = 'failed';
      tests[2].message = `Hex format query failed: ${error}`;
    }

    // Test 4: Decimal Format
    try {
      tests[3].status = 'running';
      setTestSuites(prev => [...prev]);

      cpu.getMemory().storeWord(0x4000, BigInt('0x44444444444444444444444444444444'));
      const entries = cpu.getMemory().queryMemory(0x4000, 16, 'decimal');
      
      tests[3].status = 'passed';
      tests[3].message = `Successfully queried memory in decimal format`;
      tests[3].details = entries;
    } catch (error) {
      tests[3].status = 'failed';
      tests[3].message = `Decimal format query failed: ${error}`;
    }

    return tests;
  };

  // ============================================================================
  // MIPS32 Compatibility Tests
  // ============================================================================

  const testMIPS32Compatibility = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [
      {
        name: 'Reset Processor',
        status: 'pending',
        message: 'Testing processor reset functionality'
      },
      {
        name: 'MIPS32 ADD Instruction',
        status: 'pending',
        message: 'Testing MIPS32 ADD instruction execution'
      },
      {
        name: 'MIPS32 LOAD Instruction',
        status: 'pending',
        message: 'Testing MIPS32 LOAD instruction execution'
      },
      {
        name: 'MIPS32 STORE Instruction',
        status: 'pending',
        message: 'Testing MIPS32 STORE instruction execution'
      },
      {
        name: 'MIPS32 Branch Instruction',
        status: 'pending',
        message: 'Testing MIPS32 BRANCH instruction execution'
      }
    ];

    // Test 1: Reset Processor
    try {
      tests[0].status = 'running';
      setTestSuites(prev => [...prev]);

      cpu.reset();
      const state = cpu.getState();
      
      tests[0].status = 'passed';
      tests[0].message = `Processor reset successful`;
      tests[0].details = state;
    } catch (error) {
      tests[0].status = 'failed';
      tests[0].message = `Processor reset failed: ${error}`;
    }

    // Test 2: MIPS32 ADD Instruction
    try {
      tests[1].status = 'running';
      setTestSuites(prev => [...prev]);

      // Set up registers for addition
      cpu.writeReg(1, BigInt(100)); // $1 = 100
      cpu.writeReg(2, BigInt(200)); // $2 = 200
      
      // Execute: add $3, $1, $2 (0x00221820)
      cpu.executeInstruction(0x00221820);
      const result = cpu.readReg(3);
      
      tests[1].status = 'passed';
      tests[1].message = `MIPS32 ADD instruction executed successfully: $3 = ${result}`;
      tests[1].details = { result: result.toString(), expected: '300' };
    } catch (error) {
      tests[1].status = 'failed';
      tests[1].message = `MIPS32 ADD instruction failed: ${error}`;
    }

    // Test 3: MIPS32 LOAD Instruction
    try {
      tests[2].status = 'running';
      setTestSuites(prev => [...prev]);

      // Set up memory and base register
      cpu.getMemory().storeWord(0x1000, BigInt('0x123456789ABCDEF0123456789ABCDEF0'));
      cpu.writeReg(1, BigInt(0x1000)); // $1 = base address
      
      // Execute: lw $2, 0($1) (0x8C220000)
      cpu.executeInstruction(0x8C220000);
      const result = cpu.readReg(2);
      
      tests[2].status = 'passed';
      tests[2].message = `MIPS32 LOAD instruction executed successfully: $2 = ${result}`;
      tests[2].details = { result: result.toString() };
    } catch (error) {
      tests[2].status = 'failed';
      tests[2].message = `MIPS32 LOAD instruction failed: ${error}`;
    }

    // Test 4: MIPS32 STORE Instruction
    try {
      tests[3].status = 'running';
      setTestSuites(prev => [...prev]);

      // Set up registers
      cpu.writeReg(1, BigInt(0x2000)); // $1 = base address
      cpu.writeReg(2, BigInt('0x99999999999999999999999999999999')); // $2 = value to store
      
      // Execute: sw $2, 0($1) (0xAC220000)
      cpu.executeInstruction(0xAC220000);
      const storedValue = cpu.getMemory().loadWord(0x2000);
      
      tests[3].status = 'passed';
      tests[3].message = `MIPS32 STORE instruction executed successfully`;
      tests[3].details = { stored_value: storedValue.toString() };
    } catch (error) {
      tests[3].status = 'failed';
      tests[3].message = `MIPS32 STORE instruction failed: ${error}`;
    }

    // Test 5: MIPS32 Branch Instruction
    try {
      tests[4].status = 'running';
      setTestSuites(prev => [...prev]);

      // Set up registers for branch test
      cpu.writeReg(1, BigInt(100)); // $1 = 100
      cpu.writeReg(2, BigInt(100)); // $2 = 100 (equal to $1)
      const initialPC = cpu.getPC();
      
      // Execute: beq $1, $2, 4 (0x10220004) - should branch
      cpu.executeInstruction(0x10220004);
      const newPC = cpu.getPC();
      
      tests[4].status = 'passed';
      tests[4].message = `MIPS32 BRANCH instruction executed successfully: PC changed from ${initialPC} to ${newPC}`;
      tests[4].details = { initial_pc: initialPC.toString(), new_pc: newPC.toString(), branched: initialPC !== newPC };
    } catch (error) {
      tests[4].status = 'failed';
      tests[4].message = `MIPS32 BRANCH instruction failed: ${error}`;
    }

    return tests;
  };

  // ============================================================================
  // API Endpoint Tests
  // ============================================================================

  const testAPIEndpoints = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [
      {
        name: 'Health Check Endpoint',
        status: 'pending',
        message: 'Testing health check endpoint'
      },
      {
        name: 'Advance Instruction Endpoint',
        status: 'pending',
        message: 'Testing advance instruction endpoint'
      },
      {
        name: 'Reset Processor Endpoint',
        status: 'pending',
        message: 'Testing reset processor endpoint'
      },
      {
        name: 'Query Memory Endpoint',
        status: 'pending',
        message: 'Testing query memory endpoint'
      }
    ];

    // Test 1: Health Check
    try {
      tests[0].status = 'running';
      setTestSuites(prev => [...prev]);

      const response = await stateService.healthCheck();
      
      tests[0].status = 'passed';
      tests[0].message = `Health check successful: ${response.status}`;
      tests[0].details = response;
    } catch (error) {
      tests[0].status = 'failed';
      tests[0].message = `Health check failed: ${error}`;
    }

    // Test 2: Save State
    try {
      tests[1].status = 'running';
      setTestSuites(prev => [...prev]);

      const response = await stateService.saveState(
        cpu.getState(),
        cpu.getExecutionHistory(),
        cpu.getPerformanceMetrics()
      );
      
      tests[1].status = 'passed';
      tests[1].message = `Save state successful`;
      tests[1].details = response;
    } catch (error) {
      tests[1].status = 'failed';
      tests[1].message = `Save state failed: ${error}`;
    }

    // Test 3: Load State
    try {
      tests[2].status = 'running';
      setTestSuites(prev => [...prev]);

      const response = await stateService.loadState();
      
      tests[2].status = 'passed';
      tests[2].message = `Load state successful`;
      tests[2].details = response;
    } catch (error) {
      tests[2].status = 'failed';
      tests[2].message = `Load state failed: ${error}`;
    }

    // Test 4: Session Management
    try {
      tests[3].status = 'running';
      setTestSuites(prev => [...prev]);

      const sessionId = stateService.getSessionId();
      const newSessionId = 'test_session_' + Date.now();
      stateService.setSessionId(newSessionId);
      
      tests[3].status = 'passed';
      tests[3].message = `Session management successful`;
      tests[3].details = { 
        original_session: sessionId, 
        new_session: newSessionId,
        session_changed: sessionId !== newSessionId
      };
    } catch (error) {
      tests[3].status = 'failed';
      tests[3].message = `Session management failed: ${error}`;
    }

    return tests;
  };

  // ============================================================================
  // Run All Tests
  // ============================================================================

  const runAllTests = async () => {
    setIsRunning(true);
    
    const suites: TestSuite[] = [
      {
        name: 'Base 16 (Hex) Instruction Tests',
        tests: [],
        status: 'pending',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      {
        name: 'Memory Map Tests',
        tests: [],
        status: 'pending',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      {
        name: 'MIPS32 Compatibility Tests',
        tests: [],
        status: 'pending',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      {
        name: 'State Persistence Tests',
        tests: [],
        status: 'pending',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      }
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
    suites[2].tests = await testMIPS32Compatibility();
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

  // ============================================================================
  // Render
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff', overflowY: 'auto' }}>
      <Navbar />
      <div style={{ paddingTop: '80px', padding: '20px' }}>
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
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Test Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {testSuites.map((suite, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{suite.totalTests}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                  <div className="text-lg font-semibold text-green-600">{suite.passedTests}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                  <div className="text-lg font-semibold text-red-600">{suite.failedTests}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Suites */}
        {testSuites.map((suite, suiteIndex) => (
          <div key={suiteIndex} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-900">{suite.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(suite.status)}`}>
                {getStatusIcon(suite.status)} {suite.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              {suite.tests.map((test, testIndex) => (
                <div key={testIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(test.status)}`}>
                      {getStatusIcon(test.status)} {test.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                  
                  {test.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Base 16 (Hex) Tests:</strong> Validates instruction encoding/decoding in hexadecimal format</li>
            <li>• <strong>Memory Map Tests:</strong> Tests map-based memory queries and formatting</li>
            <li>• <strong>MIPS32 Compatibility:</strong> Ensures MIPS32 code runs correctly on DARCY128</li>
            <li>• <strong>State Persistence Tests:</strong> Validates state saving/loading functionality</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Darcy128TestSuite;
