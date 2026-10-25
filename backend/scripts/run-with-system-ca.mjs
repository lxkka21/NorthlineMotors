import { spawn } from 'node:child_process';
import process from 'node:process';

const [, , ...command] = process.argv;
if (command.length === 0) throw new Error('A child command is required');

const existingOptions = process.env.NODE_OPTIONS?.trim();
const nodeOptions = existingOptions?.includes('--use-system-ca')
  ? existingOptions
  : `${existingOptions ?? ''} --use-system-ca`.trim();

const child = spawn(process.execPath, command, {
  cwd: process.cwd(),
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
