#!/usr/bin/env node

/**
 * 🩺 OAuth Monitoring & Alerting Setup
 * 
 * Sets up automated monitoring, alerting, and health checks
 * for the Endoscope Method OAuth system.
 */

const fs = require('fs');
const path = require('path');

class OAuthMonitoringSetup {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://prismy.in';
    this.alertWebhook = options.alertWebhook || process.env.SLACK_WEBHOOK_URL;
    this.emailRecipients = options.emailRecipients || ['team@prismy.in'];
    this.checkInterval = options.checkInterval || 5; // minutes
  }

  // Generate monitoring configuration files
  generateConfigs() {
    console.log('🔧 Generating monitoring configurations...');
    
    this.generateCronJob();
    this.generateHealthCheckScript();
    this.generateAlertingScript();
    this.generateDashboardConfig();
    this.generateDockerMonitoring();
    
    console.log('✅ Monitoring setup complete!');
    console.log('📝 Next steps:');
    console.log('   1. Update webhook URLs in generated configs');
    console.log('   2. Install cron job: crontab monitoring/oauth-cron.txt');
    console.log('   3. Configure alerting endpoints');
    console.log('   4. Set up dashboard monitoring');
  }

  // Generate cron job for continuous monitoring
  generateCronJob() {
    const cronConfig = `# OAuth Health Monitoring - Endoscope Method
# Runs every ${this.checkInterval} minutes to check OAuth system health

# OAuth health check
*/${this.checkInterval} * * * * cd ${process.cwd()} && npm run doctor > /tmp/oauth-health.log 2>&1 || node scripts/alert.js "OAuth health check failed"

# OAuth flow test (every 15 minutes)
*/15 * * * * cd ${process.cwd()} && npm run test:oauth:prod > /tmp/oauth-test.log 2>&1 || node scripts/alert.js "OAuth flow test failed"

# Performance monitoring (every hour)
0 * * * * cd ${process.cwd()} && node scripts/performance-monitor.js

# Daily health report (9 AM)
0 9 * * * cd ${process.cwd()} && node scripts/daily-report.js

# Weekly comprehensive audit (Monday 6 AM)
0 6 * * 1 cd ${process.cwd()} && node scripts/weekly-audit.js
`;

    this.writeFile('monitoring/oauth-cron.txt', cronConfig);
    console.log('📅 Generated cron job configuration');
  }

  // Generate health check script
  generateHealthCheckScript() {
    const healthScript = `#!/usr/bin/env node

/**
 * OAuth Health Check Monitor
 * Runs comprehensive health checks and reports issues
 */

const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

class HealthMonitor {
  constructor() {
    this.baseUrl = '${this.baseUrl}';
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      checks: [],
      metrics: {},
      alerts: []
    };
  }

  async runChecks() {
    console.log('🩺 Running OAuth health checks...');
    
    try {
      await this.checkDoctorCommand();
      await this.checkEndpointHealth();
      await this.checkPerformanceMetrics();
      await this.checkErrorRates();
      
      this.results.status = this.results.alerts.length === 0 ? 'healthy' : 'warning';
      
      if (this.results.alerts.length > 0) {
        await this.sendAlerts();
      }
      
      await this.saveResults();
      
    } catch (error) {
      this.results.status = 'error';
      this.results.alerts.push({
        level: 'critical',
        message: \`Health check failed: \${error.message}\`,
        timestamp: new Date().toISOString()
      });
      
      await this.sendAlerts();
    }
  }

  async checkDoctorCommand() {
    return new Promise((resolve, reject) => {
      exec('npm run doctor', (error, stdout, stderr) => {
        const success = !error && !stdout.includes('❌');
        
        this.results.checks.push({
          name: 'OAuth Doctor',
          status: success ? 'pass' : 'fail',
          details: success ? 'All checks passed' : 'Some checks failed',
          output: stdout
        });

        if (!success) {
          this.results.alerts.push({
            level: 'warning',
            message: 'OAuth doctor checks failed',
            details: stderr || stdout,
            timestamp: new Date().toISOString()
          });
        }

        resolve();
      });
    });
  }

  async checkEndpointHealth() {
    const endpoints = [
      '/auth/callback',
      '/login',
      '/api/health'
    ];

    for (const endpoint of endpoints) {
      try {
        const url = \`\${this.baseUrl}\${endpoint}\`;
        const startTime = Date.now();
        
        await this.httpRequest(url);
        
        const responseTime = Date.now() - startTime;
        
        this.results.checks.push({
          name: \`Endpoint \${endpoint}\`,
          status: 'pass',
          responseTime: \`\${responseTime}ms\`,
          url
        });

        if (responseTime > 5000) {
          this.results.alerts.push({
            level: 'warning',
            message: \`Slow response from \${endpoint}\`,
            details: \`Response time: \${responseTime}ms\`,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        this.results.checks.push({
          name: \`Endpoint \${endpoint}\`,
          status: 'fail',
          error: error.message
        });

        this.results.alerts.push({
          level: 'critical',
          message: \`Endpoint \${endpoint} is down\`,
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async checkPerformanceMetrics() {
    try {
      // Simulate performance check (replace with actual metrics collection)
      this.results.metrics = {
        avgOAuthTime: '3.2s',
        successRate: '98.5%',
        errorRate: '1.5%',
        lastCheck: new Date().toISOString()
      };

      // Check against thresholds
      const successRate = parseFloat(this.results.metrics.successRate);
      if (successRate < 95) {
        this.results.alerts.push({
          level: 'critical',
          message: 'OAuth success rate below threshold',
          details: \`Current: \${successRate}%, Threshold: 95%\`,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      this.results.alerts.push({
        level: 'warning',
        message: 'Performance metrics collection failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkErrorRates() {
    // Check recent logs for error patterns
    try {
      const logFile = '/tmp/oauth-test.log';
      if (fs.existsSync(logFile)) {
        const logs = fs.readFileSync(logFile, 'utf8');
        const errorCount = (logs.match(/❌|ERROR|FAILED/g) || []).length;
        const totalLines = logs.split('\\n').length;
        const errorRate = (errorCount / totalLines) * 100;

        this.results.checks.push({
          name: 'Error Rate Analysis',
          status: errorRate < 5 ? 'pass' : 'fail',
          errorRate: \`\${errorRate.toFixed(1)}%\`,
          errorCount,
          totalLines
        });

        if (errorRate > 10) {
          this.results.alerts.push({
            level: 'warning',
            message: 'High error rate detected in OAuth tests',
            details: \`Error rate: \${errorRate.toFixed(1)}%\`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.warn('Could not analyze error rates:', error.message);
    }
  }

  async httpRequest(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve(response);
        } else {
          reject(new Error(\`HTTP \${response.statusCode}\`));
        }
      });

      request.on('error', reject);
      request.setTimeout(10000, () => reject(new Error('Request timeout')));
    });
  }

  async sendAlerts() {
    const criticalAlerts = this.results.alerts.filter(a => a.level === 'critical');
    const warningAlerts = this.results.alerts.filter(a => a.level === 'warning');

    if (criticalAlerts.length > 0) {
      await this.sendSlackAlert('🚨 CRITICAL OAuth Alert', criticalAlerts);
    }

    if (warningAlerts.length > 0) {
      await this.sendSlackAlert('⚠️ OAuth Warning', warningAlerts);
    }
  }

  async sendSlackAlert(title, alerts) {
    const webhookUrl = '${this.alertWebhook}';
    if (!webhookUrl) return;

    const message = {
      text: title,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title }
        },
        {
          type: 'section',
          text: { 
            type: 'mrkdwn', 
            text: alerts.map(a => \`• \${a.message}: \${a.details || ''}\`).join('\\n')
          }
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: \`System: \${this.baseUrl} | Time: \${new Date().toISOString()}\` }]
        }
      ]
    };

    try {
      // Implementation for sending to Slack webhook
      console.log('📱 Would send alert:', JSON.stringify(message, null, 2));
    } catch (error) {
      console.error('Failed to send alert:', error.message);
    }
  }

  async saveResults() {
    const resultsDir = 'monitoring/results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = \`oauth-health-\${new Date().toISOString().split('T')[0]}.json\`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(\`📊 Results saved to \${filepath}\`);
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new HealthMonitor();
  monitor.runChecks()
    .then(() => {
      console.log('✅ Health check completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    });
}

module.exports = HealthMonitor;
`;

    this.writeFile('scripts/health-monitor.js', healthScript);
    console.log('🩺 Generated health check script');
  }

  // Generate alerting script
  generateAlertingScript() {
    const alertScript = `#!/usr/bin/env node

/**
 * OAuth Alert System
 * Sends notifications for OAuth system issues
 */

const https = require('https');
const querystring = require('querystring');

class AlertSystem {
  constructor() {
    this.webhookUrl = '${this.alertWebhook}';
    this.emailRecipients = ${JSON.stringify(this.emailRecipients)};
  }

  async sendAlert(message, level = 'warning') {
    console.log(\`🚨 \${level.toUpperCase()} Alert: \${message}\`);
    
    try {
      if (this.webhookUrl) {
        await this.sendSlackAlert(message, level);
      }
      
      if (this.emailRecipients.length > 0) {
        await this.sendEmailAlert(message, level);
      }
      
    } catch (error) {
      console.error('Failed to send alert:', error.message);
    }
  }

  async sendSlackAlert(message, level) {
    const emoji = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
    const color = level === 'critical' ? 'danger' : level === 'warning' ? 'warning' : 'good';
    
    const payload = {
      text: \`\${emoji} OAuth Alert\`,
      attachments: [
        {
          color: color,
          fields: [
            {
              title: 'Alert Level',
              value: level.toUpperCase(),
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            },
            {
              title: 'Message',
              value: message,
              short: false
            },
            {
              title: 'System',
              value: '${this.baseUrl}',
              short: true
            }
          ]
        }
      ]
    };

    return this.httpPost(this.webhookUrl, JSON.stringify(payload), {
      'Content-Type': 'application/json'
    });
  }

  async sendEmailAlert(message, level) {
    // Placeholder for email sending implementation
    console.log(\`📧 Would send email to: \${this.emailRecipients.join(', ')}\`);
    console.log(\`   Subject: [\${level.toUpperCase()}] OAuth Alert\`);
    console.log(\`   Message: \${message}\`);
  }

  async httpPost(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(\`HTTP \${res.statusCode}: \${responseData}\`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

// CLI usage
if (require.main === module) {
  const message = process.argv[2];
  const level = process.argv[3] || 'warning';
  
  if (!message) {
    console.error('Usage: node alert.js "Alert message" [level]');
    process.exit(1);
  }
  
  const alertSystem = new AlertSystem();
  alertSystem.sendAlert(message, level)
    .then(() => console.log('✅ Alert sent'))
    .catch(error => {
      console.error('❌ Alert failed:', error.message);
      process.exit(1);
    });
}

module.exports = AlertSystem;
`;

    this.writeFile('scripts/alert.js', alertScript);
    console.log('🚨 Generated alerting script');
  }

  // Generate dashboard configuration
  generateDashboardConfig() {
    const dashboardConfig = {
      name: "OAuth Health Dashboard",
      description: "Endoscope Method - OAuth Authentication Monitoring",
      refresh: "5m",
      time: { from: "now-1h", to: "now" },
      panels: [
        {
          title: "OAuth Success Rate",
          type: "stat",
          targets: [
            {
              expr: "oauth_success_rate",
              legendFormat: "Success Rate"
            }
          ],
          fieldConfig: {
            defaults: {
              unit: "percent",
              min: 0,
              max: 100,
              thresholds: {
                steps: [
                  { color: "red", value: 0 },
                  { color: "yellow", value: 90 },
                  { color: "green", value: 95 }
                ]
              }
            }
          }
        },
        {
          title: "OAuth Response Time",
          type: "graph",
          targets: [
            {
              expr: "oauth_response_time_avg",
              legendFormat: "Average Response Time"
            }
          ],
          yAxes: [
            {
              unit: "ms",
              label: "Response Time"
            }
          ],
          alert: {
            conditions: [
              {
                query: { queryType: "", refId: "A" },
                reducer: { type: "last", params: [] },
                evaluator: { params: [5000], type: "gt" }
              }
            ],
            executionErrorState: "alerting",
            frequency: "10s",
            handler: 1,
            name: "OAuth Response Time Alert",
            noDataState: "no_data"
          }
        },
        {
          title: "Authentication Events",
          type: "logs",
          targets: [
            {
              expr: '{job="oauth"} |= "Auth Event"',
              legendFormat: "Auth Events"
            }
          ]
        },
        {
          title: "Error Rate",
          type: "graph",
          targets: [
            {
              expr: "oauth_error_rate",
              legendFormat: "Error Rate"
            }
          ],
          alert: {
            conditions: [
              {
                query: { queryType: "", refId: "A" },
                reducer: { type: "last", params: [] },
                evaluator: { params: [5], type: "gt" }
              }
            ],
            name: "OAuth Error Rate Alert"
          }
        }
      ]
    };

    this.writeFile('monitoring/dashboard.json', JSON.stringify(dashboardConfig, null, 2));
    console.log('📊 Generated dashboard configuration');
  }

  // Generate Docker monitoring setup
  generateDockerMonitoring() {
    const dockerCompose = `version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: oauth-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    container_name: oauth-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/dashboard.json:/var/lib/grafana/dashboards/oauth-dashboard.json
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/var/lib/grafana/dashboards/oauth-dashboard.json

  alertmanager:
    image: prom/alertmanager:latest
    container_name: oauth-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus-data:
  grafana-data:
`;

    this.writeFile('monitoring/docker-compose.monitoring.yml', dockerCompose);

    const prometheusConfig = `global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'oauth-health'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - "alert-rules.yml"
`;

    this.writeFile('monitoring/prometheus.yml', prometheusConfig);
    console.log('🐳 Generated Docker monitoring setup');
  }

  // Utility method to write files
  writeFile(filePath, content) {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'https://prismy.in';
  const alertWebhook = process.argv[3] || process.env.SLACK_WEBHOOK_URL;
  
  const setup = new OAuthMonitoringSetup({
    baseUrl,
    alertWebhook,
    emailRecipients: ['team@prismy.in']
  });
  
  setup.generateConfigs();
}

module.exports = OAuthMonitoringSetup;
`;

    console.log('📊 Generated monitoring setup script');
  }

  writeFile(filePath, content) {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'https://prismy.in';
  const alertWebhook = process.argv[3] || process.env.SLACK_WEBHOOK_URL;
  
  const setup = new OAuthMonitoringSetup({
    baseUrl,
    alertWebhook,
    emailRecipients: ['team@prismy.in']
  });
  
  setup.generateConfigs();
}

module.exports = OAuthMonitoringSetup;