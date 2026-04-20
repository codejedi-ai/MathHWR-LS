import { createContext } from 'preact';
import { useContext, useMemo, useRef, useState } from 'preact/hooks';

export interface ProgramInstruction {
  id: string;
  hexCode: string;
  assembly: string;
}

interface InstructionContextValue {
  program: ProgramInstruction[];
  loadProgram: (items: ProgramInstruction[]) => void;
  addInstruction: (item: ProgramInstruction) => void;
  removeAt: (index: number) => void;
  clear: () => void;
}

const InstructionContext = createContext<InstructionContextValue | null>(null);

export function useInstruction() {
  const ctx = useContext(InstructionContext);
  if (!ctx) throw new Error('InstructionContext not provided');
  return ctx;
}

const sampleProgram: ProgramInstruction[] = [
  { id: '1', hexCode: '0x00000814', assembly: 'lis $1, 100' },
  { id: '2', hexCode: '0x00001014', assembly: 'lis $2, 200' },
  { id: '3', hexCode: '0x00221820', assembly: 'add $3, $1, $2' },
  { id: '4', hexCode: '0x00000008', assembly: 'jr $0' }
];

export function InstructionProvider(props: { children: any }) {
  const [program, setProgram] = useState<ProgramInstruction[]>(sampleProgram);

  const value = useMemo<InstructionContextValue>(() => ({
    program,
    loadProgram: (items) => setProgram(items),
    addInstruction: (item) => setProgram(prev => [...prev, item]),
    removeAt: (index) => setProgram(prev => prev.filter((_, i) => i !== index)),
    clear: () => setProgram([])
  }), [program]);

  return (
    <InstructionContext.Provider value={value}>
      {props.children}
    </InstructionContext.Provider>
  );
}


