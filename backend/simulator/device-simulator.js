import { readSimulatorConfig } from './simulator-config.js';
import { createSimulator } from './simulator-runtime.js';

let simulator;
try {
  simulator = createSimulator(readSimulatorConfig(process.env, process.argv));
  const stop = () => simulator.stop().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  const result = await simulator.start();
  if (result) process.exitCode = result.failed > 0 ? 1 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  await simulator?.stop();
}
