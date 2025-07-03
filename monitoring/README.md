# OAuth Monitoring Setup

## Quick Start

1. **Install cron job:**
   ```bash
   crontab monitoring/oauth-cron.txt
   ```

2. **Manual health check:**
   ```bash
   npm run monitor:health
   ```

3. **Test OAuth flow:**
   ```bash
   npm run test:oauth:prod
   ```

## Files Generated

- `monitoring/oauth-cron.txt` - Cron job configuration
- `scripts/health-check.js` - Manual health check script
- `monitoring/README.md` - This file

## Monitoring Schedule

- **Every 5 minutes**: Basic health check
- **Every 15 minutes**: Full OAuth flow test  
- **Daily at 9 AM**: Comprehensive health report

## Alerts

Health checks will:
- Log results to `/tmp/oauth-health.log`
- Exit with error code if issues detected
- Output JSON status for integration with monitoring systems

## Integration

To integrate with your monitoring system:

1. **Slack/Discord**: Parse JSON output and send webhooks
2. **Email**: Use system mail command with health check results
3. **Dashboard**: Import JSON logs into monitoring dashboard
4. **PagerDuty**: Trigger alerts on non-zero exit codes
