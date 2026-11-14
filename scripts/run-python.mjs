#!/usr/bin/env node
// Runs a Python script with whichever Python is installed: python3 (macOS/Linux), python or py (Windows).
import { spawnSync } from 'node:child_process';
const [script, ...args] = process.argv.slice(2);
for (const cmd of ['python3', 'python', 'py']) {
  const r = spawnSync(cmd, [script, ...args], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.error || (r.status === 9009 || r.status === 127)) continue; // command not found → try the next one
  process.exit(r.status ?? 0);
}
console.error('Python 3 was not found. Install it from https://www.python.org/downloads/ and try again.');
process.exit(1);
