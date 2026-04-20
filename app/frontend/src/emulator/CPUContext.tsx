import { createContext } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import { MIPS32CPU, defaultMemory } from '@emulator/MIPS32CPU';

export const CPUContext = createContext<MIPS32CPU | null>(null);

export function useProvideCPU(): MIPS32CPU {
  const ref = useRef<MIPS32CPU | null>(null);
  if (ref.current === null) {
    ref.current = new MIPS32CPU(defaultMemory);
  }
  return ref.current;
}

export function useCPU(): MIPS32CPU {
  const cpu = useContext(CPUContext);
  if (!cpu) throw new Error('CPUContext not provided');
  return cpu;
}


