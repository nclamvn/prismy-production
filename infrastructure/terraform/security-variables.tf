# ===============================================
# Security Configuration Variables
# ===============================================

# Security Feature Toggles
variable "enable_aws_config" {
  description = "Enable AWS Config for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for audit logging"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty for threat detection"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable Security Hub for centralized security"
  type        = bool
  default     = true
}

variable "enable_inspector" {
  description = "Enable Inspector for vulnerability assessment"
  type        = bool
  default     = true
}

variable "enable_secret_rotation" {
  description = "Enable automatic secret rotation"
  type        = bool
  default     = true
}

variable "enable_shield_advanced" {
  description = "Enable Shield Advanced for DDoS protection"
  type        = bool
  default     = false
}

variable "enable_private_ca" {
  description = "Enable private Certificate Authority"
  type        = bool
  default     = false
}

variable "enable_bastion_host" {
  description = "Enable bastion host for secure access"
  type        = bool
  default     = false
}

variable "enable_cross_account_security" {
  description = "Enable cross-account security scanning access"
  type        = bool
  default     = false
}

# Network Security Configuration
variable "blocked_countries" {
  description = "List of country codes to block via WAF"
  type        = list(string)
  default     = []
}

variable "admin_allowed_ips" {
  description = "List of IP addresses allowed for admin access"
  type        = list(string)
  default     = []
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access to bastion host"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

# Certificate and Domain Configuration
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate"
  type        = string
  default     = ""
}

# Monitoring and Alerting
variable "security_alert_email" {
  description = "Email address for security alerts"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for security notifications"
  type        = string
  default     = ""
  sensitive   = true
}

# Cross-Account Security
variable "security_scanner_account_ids" {
  description = "List of AWS account IDs allowed to assume security scanner role"
  type        = list(string)
  default     = []
}

variable "security_scanner_external_id" {
  description = "External ID for security scanner role assumption"
  type        = string
  default     = ""
  sensitive   = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "backup_cold_storage_days" {
  description = "Number of days before moving backups to cold storage"
  type        = number
  default     = 30
}

# Compliance Configuration
variable "compliance_framework" {
  description = "Compliance framework to follow (SOC2, HIPAA, PCI-DSS, etc.)"
  type        = string
  default     = "SOC2"
  validation {
    condition = contains([
      "SOC2", "HIPAA", "PCI-DSS", "ISO27001", "GDPR", "CCPA"
    ], var.compliance_framework)
    error_message = "Compliance framework must be one of: SOC2, HIPAA, PCI-DSS, ISO27001, GDPR, CCPA."
  }
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "confidential"
  validation {
    condition = contains([
      "public", "internal", "confidential", "restricted"
    ], var.data_classification)
    error_message = "Data classification must be one of: public, internal, confidential, restricted."
  }
}

# Security Scanning Configuration
variable "vulnerability_scan_schedule" {
  description = "Cron expression for vulnerability scanning schedule"
  type        = string
  default     = "cron(0 2 ? * SUN *)" # Weekly on Sunday at 2 AM
}

variable "security_scan_schedule" {
  description = "Cron expression for security compliance scanning schedule"
  type        = string
  default     = "cron(0 1 * * ? *)" # Daily at 1 AM
}

# WAF Configuration
variable "waf_rate_limit" {
  description = "Rate limit for WAF (requests per 5 minutes)"
  type        = number
  default     = 1000
}

variable "waf_api_rate_limit" {
  description = "Rate limit for API endpoints (requests per 5 minutes)"
  type        = number
  default     = 500
}

variable "waf_auth_rate_limit" {
  description = "Rate limit for authentication endpoints (requests per 5 minutes)"
  type        = number
  default     = 50
}

# Database Security
variable "db_backup_window" {
  description = "Preferred backup window for database"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window for database"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "enable_db_deletion_protection" {
  description = "Enable deletion protection for database"
  type        = bool
  default     = true
}

# Encryption Configuration
variable "kms_key_rotation_enabled" {
  description = "Enable automatic rotation of KMS keys"
  type        = bool
  default     = true
}

variable "s3_bucket_encryption_algorithm" {
  description = "Encryption algorithm for S3 buckets"
  type        = string
  default     = "AES256"
  validation {
    condition = contains([
      "AES256", "aws:kms"
    ], var.s3_bucket_encryption_algorithm)
    error_message = "S3 encryption algorithm must be either AES256 or aws:kms."
  }
}

# Session Management
variable "session_timeout_minutes" {
  description = "Session timeout in minutes"
  type        = number
  default     = 30
}

variable "max_concurrent_sessions" {
  description = "Maximum concurrent sessions per user"
  type        = number
  default     = 3
}

# API Security
variable "api_throttling_burst_limit" {
  description = "API throttling burst limit"
  type        = number
  default     = 100
}

variable "api_throttling_rate_limit" {
  description = "API throttling rate limit (requests per second)"
  type        = number
  default     = 50
}

# Security Headers Configuration
variable "hsts_max_age" {
  description = "HSTS max age in seconds"
  type        = number
  default     = 31536000 # 1 year
}

variable "csp_report_uri" {
  description = "URI for CSP violation reports"
  type        = string
  default     = ""
}

# Incident Response
variable "incident_response_team_email" {
  description = "Email address for incident response team"
  type        = string
  default     = ""
}

variable "security_contact_phone" {
  description = "Phone number for security contact"
  type        = string
  default     = ""
  sensitive   = true
}

# Cost Management
variable "security_budget_alert_threshold" {
  description = "Budget alert threshold for security services (USD)"
  type        = number
  default     = 500
}

# Tags for Security Resources
variable "security_tags" {
  description = "Additional tags for security resources"
  type        = map(string)
  default = {
    SecurityLevel = "High"
    Compliance    = "Required"
    BackupPolicy  = "Daily"
    Monitoring    = "24x7"
  }
}