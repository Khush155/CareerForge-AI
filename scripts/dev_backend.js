#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const isWin = process.platform === 'win32';
const rootDir = process.cwd();

// Candidate virtual environment Python paths (Mac/Linux .venv/bin/python, Windows .venv/Scripts/python.exe)
const candidatePythons = [
  path.join(rootDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
  path.join(rootDir, 'backend', '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
];

let pythonCmd = null;
for (const candidate of candidatePythons) {
  if (fs.existsSync(candidate)) {
    pythonCmd = candidate;
    break;
  }
}

if (!pythonCmd) {
  pythonCmd = isWin ? 'python' : 'python3';
}

console.log(`[BACKEND] Starting CareerForge AI FastAPI server using: ${pythonCmd}`);

const env = { ...process.env };
// Ensure backend directory is in PYTHONPATH
const backendDir = path.join(rootDir, 'backend');
env.PYTHONPATH = backendDir + (env.PYTHONPATH ? path.delimiter + env.PYTHONPATH : '');

const child = spawn(
  pythonCmd,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000', '--app-dir', 'backend'],
  {
    stdio: 'inherit',
    env,
  }
);

child.on('error', (err) => {
  console.error('[BACKEND ERROR] Failed to start backend process:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
