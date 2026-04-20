import React, { useEffect, useState } from 'react';
import Navbar from './navbar/Navbar';
import { useCPU } from '../emulator/CPUContext';

export default function RegisterView() {
  const cpu = useCPU();
  const [cpuState, setCpuState] = useState<any>(null);
  // Fixed 4-column layout for registers

  useEffect(() => {
    setCpuState(cpu.getState());
  }, []);

  // No responsive columns; always 4 columns

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff', overflowY: 'auto' }}>
      <Navbar />
      <div style={{ paddingTop: '80px', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>Register View</h1>

          {!cpuState ? (
            <div style={{ color: '#888' }}>Loading CPU state...</div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#00ff00', marginBottom: '10px' }}>General Registers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
                  {cpuState.registers.map((reg: any, idx: number) => (
                    <div key={idx} style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}>
                      <div style={{ color: '#00ff00', fontWeight: 'bold' }}>{reg.name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ccc', marginTop: '6px' }}>{reg.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#00ff00', marginBottom: '10px' }}>Special Registers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold' }}>PC</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ccc', marginTop: '6px' }}>{typeof cpuState.pc === 'string' ? cpuState.pc : `0x${Number(cpuState.pc).toString(16)}`}</div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold' }}>HI</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ccc', marginTop: '6px' }}>{cpuState.hi}</div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold' }}>LO</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ccc', marginTop: '6px' }}>{cpuState.lo}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
