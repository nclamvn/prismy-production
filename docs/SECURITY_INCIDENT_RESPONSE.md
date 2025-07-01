# 🚨 SECURITY INCIDENT RESPONSE RUNBOOK

## Overview
This document provides step-by-step procedures for responding to security incidents in the Prismy production environment.

## 🎯 Incident Classification

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P0 - Critical** | Active breach, data exposure, system compromise | 15 minutes | Immediate |
| **P1 - High** | Potential breach, suspicious activity, failed authentication | 1 hour | Within 2 hours |
| **P2 - Medium** | Security policy violation, vulnerability discovered | 4 hours | Within 24 hours |
| **P3 - Low** | Minor security event, informational alert | 24 hours | Within 72 hours |

### Incident Types
- **Data Breach**: Unauthorized access to customer data
- **System Compromise**: Malware, unauthorized access to systems
- **DDoS Attack**: Distributed denial of service
- **Authentication Failure**: Multiple failed login attempts, brute force
- **Insider Threat**: Suspicious internal user activity
- **Vulnerability Exploitation**: Active exploitation of known vulnerabilities
- **Compliance Violation**: Failure to meet regulatory requirements

## 🚨 Immediate Response (First 15 Minutes)

### 1. Initial Assessment
```bash
# Check system status
curl -s https://prismy.com/api/health | jq '.'

# Check monitoring alerts
aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/production-prismy"

# Check GuardDuty findings
aws guardduty list-findings --detector-id $(aws guardduty list-detectors --query 'DetectorIds[0]' --output text)
```

### 2. Immediate Containment
- [ ] **Isolate affected systems** (if system compromise)
- [ ] **Block suspicious IP addresses** via WAF
- [ ] **Disable compromised user accounts**
- [ ] **Revoke suspicious API keys**
- [ ] **Enable DDoS protection** (if DDoS attack)

### 3. Evidence Preservation
```bash
# Capture system state
aws ec2 describe-instances --instance-ids $AFFECTED_INSTANCE_ID
aws ecs describe-tasks --cluster production-prismy-cluster
aws logs get-log-events --log-group-name "/aws/ecs/production-prismy"

# Export CloudTrail logs
aws logs create-export-task --log-group-name "aws-cloudtrail-logs"
```

### 4. Initial Notification
- [ ] **Alert incident response team**
- [ ] **Notify security team lead**
- [ ] **Create incident ticket** in monitoring system
- [ ] **Document initial findings**

## 🔍 Investigation Phase

### 1. Data Collection
```bash
# Check authentication logs
aws logs filter-log-events \
  --log-group-name "/aws/ecs/production-prismy" \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ERROR auth"

# Check database access logs
psql $DATABASE_URL -c "SELECT * FROM security_audit_logs WHERE created_at > NOW() - INTERVAL '1 hour';"

# Check file access patterns
aws s3api get-bucket-logging --bucket production-prismy-storage
```

### 2. Timeline Construction
- [ ] **Correlate events** across multiple log sources
- [ ] **Identify initial compromise vector**
- [ ] **Track lateral movement** (if applicable)
- [ ] **Document affected systems and data**

### 3. Impact Assessment
- [ ] **Customer data affected** (if any)
- [ ] **System availability impact**
- [ ] **Business process disruption**
- [ ] **Compliance implications**

## 🛡️ Containment Strategies

### System Compromise
```bash
# Isolate affected ECS tasks
aws ecs stop-task --cluster production-prismy-cluster --task $TASK_ARN

# Update security groups to deny all traffic
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 0-65535 \
  --cidr 127.0.0.1/32
```

### DDoS Attack
```bash
# Enable AWS Shield Advanced (if not already enabled)
aws shield subscribe-to-proactive-engagement

# Update WAF rules for immediate blocking
aws wafv2 update-rule-group \
  --scope CLOUDFRONT \
  --id $RULE_GROUP_ID \
  --rules file://emergency-block-rules.json
```

### Data Breach
```bash
# Revoke all API keys
aws apigateway get-api-keys --query 'items[].id' | \
  xargs -I {} aws apigateway update-api-key --api-key {} --patch-ops op=replace,path=/enabled,value=false

# Force password reset for all users
psql $DATABASE_URL -c "UPDATE auth.users SET password_reset_required = true;"
```

### Authentication Failures
```bash
# Block suspicious IPs via WAF
aws wafv2 update-ip-set \
  --scope CLOUDFRONT \
  --id $IP_SET_ID \
  --addresses file://blocked-ips.txt

# Disable affected user accounts
psql $DATABASE_URL -c "UPDATE auth.users SET disabled = true WHERE id = '$USER_ID';"
```

## 🔧 Eradication Procedures

### 1. Remove Threats
```bash
# Update container images with security patches
docker build -t prismy:secure-$(date +%s) .
aws ecs update-service --cluster production-prismy-cluster --service prismy-api --force-new-deployment

# Apply security patches to RDS
aws rds modify-db-instance --db-instance-identifier production-prismy-db --auto-minor-version-upgrade
```

### 2. Close Vulnerabilities
- [ ] **Apply security patches**
- [ ] **Update vulnerable dependencies**
- [ ] **Strengthen access controls**
- [ ] **Update security policies**

### 3. Credential Rotation
```bash
# Rotate database passwords
aws secretsmanager rotate-secret --secret-id production-prismy-db-password

# Generate new API keys
node scripts/generate-api-keys.js --rotate-all

# Update application secrets
kubectl create secret generic prismy-secrets --from-env-file=.env.production --dry-run=client -o yaml | kubectl apply -f -
```

## 🔄 Recovery Phase

### 1. System Restoration
```bash
# Restore from clean backup (if needed)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier production-prismy-db-restored \
  --db-snapshot-identifier production-prismy-db-snapshot-$(date +%Y%m%d)

# Verify system integrity
./scripts/security-compliance-scanner.ts

# Gradual traffic restoration
aws elbv2 modify-listener --listener-arn $LISTENER_ARN --default-actions file://restore-traffic.json
```

### 2. Monitoring Enhancement
```bash
# Enable additional CloudWatch metrics
aws logs create-log-group --log-group-name "/security/incident-recovery"

# Set up enhanced alerting
aws cloudwatch put-metric-alarm \
  --alarm-name "HighSecurityEvents" \
  --alarm-description "Monitor for security events during recovery" \
  --metric-name "SecurityEventCount" \
  --namespace "Security" \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### 3. Validation Testing
- [ ] **Penetration testing** of restored systems
- [ ] **Vulnerability scanning**
- [ ] **Access control verification**
- [ ] **Data integrity checks**

## 📋 Post-Incident Activities

### 1. Root Cause Analysis
- [ ] **Technical root cause** identification
- [ ] **Process failure** analysis
- [ ] **Timeline** reconstruction
- [ ] **Contributing factors** assessment

### 2. Lessons Learned
- [ ] **Security control gaps** identified
- [ ] **Process improvements** documented
- [ ] **Training needs** assessed
- [ ] **Technology upgrades** recommended

### 3. Reporting
- [ ] **Executive summary** prepared
- [ ] **Technical details** documented
- [ ] **Compliance notifications** sent (if required)
- [ ] **Customer communications** (if data breach)

### 4. Follow-up Actions
- [ ] **Implement security improvements**
- [ ] **Update incident response procedures**
- [ ] **Conduct team training**
- [ ] **Schedule follow-up assessments**

## 📞 Emergency Contacts

| Role | Contact | Phone | Email |
|------|---------|-------|-------|
| Security Lead | [Name] | [Phone] | security@prismy.com |
| DevOps Lead | [Name] | [Phone] | devops@prismy.com |
| CTO | [Name] | [Phone] | cto@prismy.com |
| Legal Counsel | [Name] | [Phone] | legal@prismy.com |
| PR Manager | [Name] | [Phone] | pr@prismy.com |

### External Contacts
- **AWS Support**: 1-800-993-5274
- **Supabase Support**: support@supabase.io
- **FBI IC3**: ic3.gov (for cyber crimes)
- **Local Law Enforcement**: 911

## 🛠️ Tools and Resources

### Monitoring and Investigation
```bash
# AWS CLI commands for investigation
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole
aws guard-duty get-findings --detector-id $DETECTOR_ID
aws security-hub get-findings

# Database investigation
psql $DATABASE_URL -c "SELECT * FROM security_audit_logs ORDER BY created_at DESC LIMIT 100;"

# Application logs
kubectl logs -l app=prismy --tail=1000 | grep -i "error\|warn\|security"
```

### Communication Templates
- **Customer Notification**: `docs/templates/customer-security-notification.md`
- **Internal Alert**: `docs/templates/internal-security-alert.md`
- **Compliance Report**: `docs/templates/compliance-incident-report.md`

### Recovery Scripts
- **System Isolation**: `scripts/isolate-system.sh`
- **Traffic Rerouting**: `scripts/reroute-traffic.sh`
- **Credential Rotation**: `scripts/rotate-credentials.sh`
- **Backup Restoration**: `scripts/restore-from-backup.sh`

## 🔐 Security Incident Prevention

### Proactive Measures
- [ ] **Regular security assessments**
- [ ] **Continuous vulnerability scanning**
- [ ] **Employee security training**
- [ ] **Access control reviews**
- [ ] **Incident response drills**

### Detection Improvements
- [ ] **Enhanced monitoring rules**
- [ ] **Behavioral analytics**
- [ ] **Threat intelligence feeds**
- [ ] **Automated response triggers**

## 📊 Incident Metrics

### Key Performance Indicators
- **Mean Time to Detection (MTTD)**: < 15 minutes
- **Mean Time to Containment (MTTC)**: < 1 hour
- **Mean Time to Recovery (MTTR)**: < 4 hours
- **False Positive Rate**: < 5%

### Reporting Dashboard
- Monthly incident summary
- Trend analysis
- Response time metrics
- Cost impact assessment

---

## 🚨 EMERGENCY HOTLINE: +1-XXX-XXX-XXXX

**Remember**: Document everything, preserve evidence, and prioritize containment over investigation during active incidents.