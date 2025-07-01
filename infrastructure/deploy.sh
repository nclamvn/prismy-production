#!/bin/bash
# ===============================================
# Prismy Production Deployment Script
# Automated deployment with proper validation
# ===============================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    command -v aws >/dev/null 2>&1 || log_error "AWS CLI is required but not installed"
    command -v terraform >/dev/null 2>&1 || log_error "Terraform is required but not installed"
    command -v docker >/dev/null 2>&1 || log_error "Docker is required but not installed"
    command -v jq >/dev/null 2>&1 || log_error "jq is required but not installed"
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || log_error "AWS credentials not configured or invalid"
    
    # Check terraform.tfvars exists
    if [[ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]]; then
        log_error "terraform.tfvars not found. Copy terraform.tfvars.example and configure it."
    fi
    
    log_success "All prerequisites met"
}

setup_terraform_backend() {
    log_info "Setting up Terraform backend..."
    
    # Create S3 bucket for state if it doesn't exist
    if ! aws s3 ls "s3://prismy-terraform-state" >/dev/null 2>&1; then
        log_info "Creating S3 bucket for Terraform state..."
        aws s3 mb "s3://prismy-terraform-state" --region "$AWS_REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket prismy-terraform-state \
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption \
            --bucket prismy-terraform-state \
            --server-side-encryption-configuration '{
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }'
    fi
    
    # Create DynamoDB table for locks if it doesn't exist
    if ! aws dynamodb describe-table --table-name prismy-terraform-locks >/dev/null 2>&1; then
        log_info "Creating DynamoDB table for Terraform locks..."
        aws dynamodb create-table \
            --table-name prismy-terraform-locks \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
            --region "$AWS_REGION"
        
        # Wait for table to be active
        aws dynamodb wait table-exists --table-name prismy-terraform-locks
    fi
    
    log_success "Terraform backend configured"
}

build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
    
    # Create ECR repositories if they don't exist
    for repo in "${ENVIRONMENT}-prismy-app" "${ENVIRONMENT}-prismy-worker"; do
        if ! aws ecr describe-repositories --repository-names "$repo" >/dev/null 2>&1; then
            log_info "Creating ECR repository: $repo"
            aws ecr create-repository --repository-name "$repo" --region "$AWS_REGION"
        fi
    done
    
    # Build and push app image
    log_info "Building application image..."
    docker build -t "${ENVIRONMENT}-prismy-app" -f "$PROJECT_ROOT/Dockerfile" "$PROJECT_ROOT"
    docker tag "${ENVIRONMENT}-prismy-app:latest" "$ECR_REGISTRY/${ENVIRONMENT}-prismy-app:latest"
    docker tag "${ENVIRONMENT}-prismy-app:latest" "$ECR_REGISTRY/${ENVIRONMENT}-prismy-app:$(date +%Y%m%d-%H%M%S)"
    
    log_info "Pushing application image..."
    docker push "$ECR_REGISTRY/${ENVIRONMENT}-prismy-app:latest"
    docker push "$ECR_REGISTRY/${ENVIRONMENT}-prismy-app:$(date +%Y%m%d-%H%M%S)"
    
    # Build and push worker image (same as app for now)
    log_info "Building worker image..."
    docker tag "${ENVIRONMENT}-prismy-app:latest" "$ECR_REGISTRY/${ENVIRONMENT}-prismy-worker:latest"
    docker tag "${ENVIRONMENT}-prismy-app:latest" "$ECR_REGISTRY/${ENVIRONMENT}-prismy-worker:$(date +%Y%m%d-%H%M%S)"
    
    log_info "Pushing worker image..."
    docker push "$ECR_REGISTRY/${ENVIRONMENT}-prismy-worker:latest"
    docker push "$ECR_REGISTRY/${ENVIRONMENT}-prismy-worker:$(date +%Y%m%d-%H%M%S)"
    
    log_success "Docker images built and pushed"
}

validate_terraform() {
    log_info "Validating Terraform configuration..."
    
    cd "$TERRAFORM_DIR"
    
    # Format check
    if ! terraform fmt -check; then
        log_warning "Terraform files are not properly formatted. Running terraform fmt..."
        terraform fmt
    fi
    
    # Validation
    terraform validate || log_error "Terraform validation failed"
    
    log_success "Terraform configuration is valid"
}

plan_terraform() {
    log_info "Creating Terraform plan..."
    
    cd "$TERRAFORM_DIR"
    
    terraform plan -out=tfplan -detailed-exitcode
    PLAN_EXIT_CODE=$?
    
    case $PLAN_EXIT_CODE in
        0)
            log_info "No changes required"
            return 0
            ;;
        1)
            log_error "Terraform plan failed"
            ;;
        2)
            log_info "Changes detected in plan"
            return 2
            ;;
    esac
}

apply_terraform() {
    log_info "Applying Terraform configuration..."
    
    cd "$TERRAFORM_DIR"
    
    if [[ -f "tfplan" ]]; then
        terraform apply tfplan
        rm -f tfplan
    else
        terraform apply -auto-approve
    fi
    
    log_success "Infrastructure deployed successfully"
}

wait_for_deployment() {
    log_info "Waiting for services to be healthy..."
    
    # Get the load balancer DNS name
    cd "$TERRAFORM_DIR"
    ALB_DNS=$(terraform output -raw load_balancer_dns_name)
    
    # Wait for ALB to be healthy
    log_info "Waiting for load balancer to be accessible..."
    for i in {1..30}; do
        if curl -sf "http://$ALB_DNS/api/health" >/dev/null 2>&1; then
            log_success "Application is healthy!"
            break
        fi
        
        if [[ $i -eq 30 ]]; then
            log_warning "Application health check timeout. Check ECS service status manually."
        else
            log_info "Waiting for application to start... (attempt $i/30)"
            sleep 30
        fi
    done
}

show_deployment_info() {
    log_info "Deployment Information:"
    
    cd "$TERRAFORM_DIR"
    
    echo "================================"
    echo "Application URL: $(terraform output -raw application_url)"
    echo "API URL: $(terraform output -raw api_url)"
    echo "CloudFront Distribution: $(terraform output -raw cloudfront_domain_name)"
    echo "Load Balancer: $(terraform output -raw load_balancer_dns_name)"
    echo "================================"
    
    # Show monitoring endpoints
    echo "Monitoring Endpoints:"
    echo "Health Check: $(terraform output -raw application_url)/api/health"
    echo "Metrics: $(terraform output -raw application_url)/api/metrics"
    echo "Status: $(terraform output -raw application_url)/api/status"
    echo "================================"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    cd "$TERRAFORM_DIR"
    rm -f tfplan
}

# Main deployment function
main() {
    local action="${1:-deploy}"
    
    case $action in
        "plan")
            check_prerequisites
            setup_terraform_backend
            cd "$TERRAFORM_DIR"
            terraform init
            validate_terraform
            plan_terraform
            ;;
        "deploy")
            check_prerequisites
            setup_terraform_backend
            build_and_push_images
            cd "$TERRAFORM_DIR"
            terraform init
            validate_terraform
            if plan_terraform; then
                if [[ $? -eq 2 ]]; then
                    apply_terraform
                    wait_for_deployment
                    show_deployment_info
                fi
            fi
            ;;
        "destroy")
            log_warning "This will destroy all infrastructure!"
            read -p "Are you sure? Type 'yes' to continue: " confirm
            if [[ $confirm == "yes" ]]; then
                cd "$TERRAFORM_DIR"
                terraform init
                terraform destroy
                log_success "Infrastructure destroyed"
            else
                log_info "Destroy cancelled"
            fi
            ;;
        "init")
            check_prerequisites
            setup_terraform_backend
            cd "$TERRAFORM_DIR"
            terraform init
            log_success "Terraform initialized"
            ;;
        "validate")
            cd "$TERRAFORM_DIR"
            terraform init
            validate_terraform
            ;;
        "output")
            cd "$TERRAFORM_DIR"
            show_deployment_info
            ;;
        *)
            echo "Usage: $0 {plan|deploy|destroy|init|validate|output}"
            echo ""
            echo "Commands:"
            echo "  plan     - Create and show execution plan"
            echo "  deploy   - Deploy infrastructure (default)"
            echo "  destroy  - Destroy infrastructure"
            echo "  init     - Initialize Terraform"
            echo "  validate - Validate Terraform configuration"
            echo "  output   - Show deployment information"
            exit 1
            ;;
    esac
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"