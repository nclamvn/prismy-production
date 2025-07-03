#!/usr/bin/env node

/**
 * 🩺 OAuth Monitoring & Alerting Setup (Simplified)
 */

const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content);
}

function generateMonitoringConfigs() {
  console.log('🔧 Generating monitoring configurations...');
  
  // Generate cron job configuration
  const cronConfig = `# OAuth Health Monitoring - Endoscope Method
# Runs every 5 minutes to check OAuth system health

# OAuth health check
*/5 * * * * cd ${process.cwd()} && npm run doctor > /tmp/oauth-health.log 2>&1 || echo "OAuth health check failed"

# OAuth flow test (every 15 minutes)
*/15 * * * * cd ${process.cwd()} && npm run test:oauth:prod > /tmp/oauth-test.log 2>&1 || echo "OAuth flow test failed"

# Daily health report (9 AM)
0 9 * * * cd ${process.cwd()} && npm run doctor && echo "Daily OAuth health check completed"
`;

  writeFile('monitoring/oauth-cron.txt', cronConfig);
  console.log('📅 Generated cron job configuration');

  // Generate simple health check script
  const healthScript = `#!/usr/bin/env node

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
`;

  writeFile('scripts/health-check.js', healthScript);
  console.log('🩺 Generated health check script');

  // Generate package.json monitoring scripts
  const monitoringScripts = {
    "monitor:health": "node scripts/health-check.js",
    "monitor:setup": "node scripts/monitoring-setup-simple.js",
    "monitor:cron": "cat monitoring/oauth-cron.txt"
  };

  console.log('📦 Add these scripts to package.json:');
  console.log(JSON.stringify(monitoringScripts, null, 2));

  // Generate monitoring README
  const readmeContent = `# OAuth Monitoring Setup

## Quick Start

1. **Install cron job:**
   \`\`\`bash
   crontab monitoring/oauth-cron.txt
   \`\`\`

2. **Manual health check:**
   \`\`\`bash
   npm run monitor:health
   \`\`\`

3. **Test OAuth flow:**
   \`\`\`bash
   npm run test:oauth:prod
   \`\`\`

## Files Generated

- \`monitoring/oauth-cron.txt\` - Cron job configuration
- \`scripts/health-check.js\` - Manual health check script
- \`monitoring/README.md\` - This file

## Monitoring Schedule

- **Every 5 minutes**: Basic health check
- **Every 15 minutes**: Full OAuth flow test  
- **Daily at 9 AM**: Comprehensive health report

## Alerts

Health checks will:
- Log results to \`/tmp/oauth-health.log\`
- Exit with error code if issues detected
- Output JSON status for integration with monitoring systems

## Integration

To integrate with your monitoring system:

1. **Slack/Discord**: Parse JSON output and send webhooks
2. **Email**: Use system mail command with health check results
3. **Dashboard**: Import JSON logs into monitoring dashboard
4. **PagerDuty**: Trigger alerts on non-zero exit codes
`;

  writeFile('monitoring/README.md', readmeContent);
  console.log('📚 Generated monitoring README');

  console.log('\\n✅ Monitoring setup complete!');
  console.log('📝 Next steps:');
  console.log('   1. Install cron job: crontab monitoring/oauth-cron.txt');
  console.log('   2. Test health check: npm run monitor:health');
  console.log('   3. Configure alerting webhooks as needed');
}

// Run setup
generateMonitoringConfigs();