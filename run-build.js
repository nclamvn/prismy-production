const { spawn } = require('child_process');
const path = require('path');

const projectPath = '/Users/mac/prismy/prismy-production';
process.chdir(projectPath);

console.log('Starting npm build...');
console.log('Current directory:', process.cwd());

const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  cwd: projectPath
});

buildProcess.on('close', (code) => {
  console.log(`Build process exited with code ${code}`);
  process.exit(code);
});

buildProcess.on('error', (error) => {
  console.error('Build process error:', error);
  process.exit(1);
});