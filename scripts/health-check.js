#!/usr/bin/env node

const { exec } = require('child_process');

function runHealthCheck() {
  console.log('🩺 Running OAuth health check...');
  
  exec('npm run doctor', (error, stdout, stderr) => {
    const timestamp = new Date().toISOString();
    const success = !error && !stdout.includes('❌');
    
    const result = {
      timestamp,
      status: success ? 'healthy' : 'warning',
      output: stdout,
      error: stderr
    };
    
    console.log(JSON.stringify(result, null, 2));
    
    if (!success) {
      console.error('⚠️ OAuth health check failed');
      process.exit(1);
    } else {
      console.log('✅ OAuth health check passed');
    }
  });
}

runHealthCheck();
