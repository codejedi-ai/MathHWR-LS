import { render } from 'preact';
import Router from './Router';
import { CPUContext, useProvideCPU } from './emulator/CPUContext';
import { InstructionProvider } from './emulator/InstructionContext';

function AppRoot() {
  const cpu = useProvideCPU();
  return (
    <CPUContext.Provider value={cpu}>
      <InstructionProvider>
        <Router />
      </InstructionProvider>
    </CPUContext.Provider>
  );
}

render(<AppRoot />, document.getElementById('app'));
