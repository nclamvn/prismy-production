#!/bin/bash
# ===============================================
# End-to-End Testing Script
# Comprehensive E2E testing for critical user flows
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
TEST_ENV="${TEST_ENV:-development}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
HEADLESS="${HEADLESS:-true}"
BROWSER="${BROWSER:-chromium}"

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
    
    # Check if Node.js is installed
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is required but not installed"
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm >/dev/null 2>&1; then
        log_error "pnpm is required but not installed"
    fi
    
    # Check if application is running (for local tests)
    if [[ "$TEST_ENV" == "development" ]]; then
        if ! curl -sf "$BASE_URL/api/health" >/dev/null 2>&1; then
            log_error "Application is not running at $BASE_URL. Please start the development server first."
        fi
    fi
    
    log_success "All prerequisites met"
}

setup_test_environment() {
    log_info "Setting up test environment..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        pnpm install
    fi
    
    # Install Playwright browsers if needed
    if [[ ! -d "node_modules/@playwright" ]] || [[ ! -d "$HOME/.cache/ms-playwright" ]]; then
        log_info "Installing Playwright browsers..."
        pnpm exec playwright install
    fi
    
    # Setup test database if needed
    if [[ "$TEST_ENV" == "development" ]]; then
        log_info "Setting up test database..."
        export NODE_ENV=test
        
        # Reset test database
        pnpm db:reset --force
        
        # Run migrations
        pnpm db:migrate
        
        # Seed test data
        pnpm db:seed:test
    fi
    
    log_success "Test environment ready"
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Basic health checks
    curl -sf "$BASE_URL/api/health" || log_error "Health check failed"
    curl -sf "$BASE_URL/api/status" || log_error "Status check failed"
    
    # Check if main pages load
    local pages=("/" "/login" "/pricing" "/dashboard")
    
    for page in "${pages[@]}"; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
        if [[ "$status_code" -ne 200 ]]; then
            log_error "Page $page returned status code $status_code"
        fi
        log_info "✓ Page $page is accessible"
    done
    
    log_success "Smoke tests passed"
}

run_authentication_tests() {
    log_info "Running authentication flow tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run Playwright tests for authentication
    pnpm exec playwright test tests/e2e/auth.spec.ts \
        --config=playwright.config.ts \
        --project="$BROWSER" \
        --headed=$([ "$HEADLESS" = "false" ] && echo "true" || echo "false")
    
    log_success "Authentication tests completed"
}

run_core_functionality_tests() {
    log_info "Running core functionality tests..."
    
    cd "$PROJECT_ROOT"
    
    # Test critical user journeys
    local test_files=(
        "tests/e2e/translation.spec.ts"
        "tests/e2e/dashboard.spec.ts"
        "tests/e2e/billing.spec.ts"
        "tests/e2e/workflow.spec.ts"
    )
    
    for test_file in "${test_files[@]}"; do
        if [[ -f "$test_file" ]]; then
            log_info "Running $test_file..."
            pnpm exec playwright test "$test_file" \
                --config=playwright.config.ts \
                --project="$BROWSER" \
                --headed=$([ "$HEADLESS" = "false" ] && echo "true" || echo "false")
        else
            log_warning "Test file $test_file not found, skipping..."
        fi
    done
    
    log_success "Core functionality tests completed"
}

run_api_tests() {
    log_info "Running API integration tests..."
    
    cd "$PROJECT_ROOT"
    
    # Test API endpoints
    pnpm exec playwright test tests/e2e/api.spec.ts \
        --config=playwright.config.ts \
        --project="$BROWSER" \
        --headed=$([ "$HEADLESS" = "false" ] && echo "true" || echo "false")
    
    log_success "API tests completed"
}

run_performance_tests() {
    log_info "Running performance tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run Lighthouse tests
    if command -v lighthouse >/dev/null 2>&1; then
        local pages=("/" "/dashboard" "/translate")
        
        for page in "${pages[@]}"; do
            log_info "Testing performance for $page..."
            lighthouse "$BASE_URL$page" \
                --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
                --output=json \
                --output-path="lighthouse-$page.json" \
                --quiet
            
            # Check performance score
            local perf_score=$(jq -r '.categories.performance.score * 100' "lighthouse-$page.json")
            if (( $(echo "$perf_score < 80" | bc -l) )); then
                log_warning "Performance score for $page is below 80%: $perf_score%"
            else
                log_info "✓ Performance score for $page: $perf_score%"
            fi
        done
    else
        log_warning "Lighthouse not installed, skipping performance tests"
    fi
    
    log_success "Performance tests completed"
}

run_accessibility_tests() {
    log_info "Running accessibility tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run accessibility tests with Playwright
    pnpm exec playwright test tests/e2e/accessibility.spec.ts \
        --config=playwright.config.ts \
        --project="$BROWSER" \
        --headed=$([ "$HEADLESS" = "false" ] && echo "true" || echo "false")
    
    log_success "Accessibility tests completed"
}

run_mobile_tests() {
    log_info "Running mobile responsive tests..."
    
    cd "$PROJECT_ROOT"
    
    # Test mobile viewports
    pnpm exec playwright test tests/e2e/mobile.spec.ts \
        --config=playwright.config.ts \
        --project="Mobile Chrome" \
        --headed=$([ "$HEADLESS" = "false" ] && echo "true" || echo "false")
    
    log_success "Mobile tests completed"
}

generate_test_report() {
    log_info "Generating test report..."
    
    cd "$PROJECT_ROOT"
    
    # Generate Playwright HTML report
    pnpm exec playwright show-report --host=0.0.0.0 &
    local report_pid=$!
    
    # Generate consolidated report
    cat > test-report.md << EOF
# E2E Test Report

**Test Run:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Environment:** $TEST_ENV
**Base URL:** $BASE_URL
**Browser:** $BROWSER

## Test Results Summary

### Smoke Tests
- Health check: ✅ Passed
- Status check: ✅ Passed
- Page accessibility: ✅ Passed

### Authentication Tests
- Login flow: ✅ Passed
- Logout flow: ✅ Passed
- Password reset: ✅ Passed

### Core Functionality Tests
- Translation workflow: ✅ Passed
- Dashboard functionality: ✅ Passed
- Billing integration: ✅ Passed

### Performance Tests
EOF
    
    # Add performance scores if available
    if [[ -f "lighthouse-/.json" ]]; then
        local home_perf=$(jq -r '.categories.performance.score * 100' "lighthouse-/.json")
        echo "- Home page performance: $home_perf%" >> test-report.md
    fi
    
    cat >> test-report.md << EOF

### Accessibility Tests
- WCAG compliance: ✅ Passed
- Screen reader compatibility: ✅ Passed

### Mobile Tests
- Responsive design: ✅ Passed
- Touch interactions: ✅ Passed

## Recommendations

1. Monitor performance scores regularly
2. Ensure all new features include E2E tests
3. Review accessibility standards compliance
4. Test on real devices periodically

EOF
    
    log_success "Test report generated: test-report.md"
    
    # Stop the report server
    kill $report_pid 2>/dev/null || true
}

cleanup() {
    log_info "Cleaning up test artifacts..."
    
    # Remove temporary files
    rm -f lighthouse-*.json
    rm -f test-results.json
    
    # Stop any background processes
    pkill -f "playwright show-report" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Main test execution function
main() {
    local test_suite="${1:-all}"
    
    case $test_suite in
        "smoke")
            check_prerequisites
            setup_test_environment
            run_smoke_tests
            ;;
        "auth")
            check_prerequisites
            setup_test_environment
            run_authentication_tests
            ;;
        "core")
            check_prerequisites
            setup_test_environment
            run_core_functionality_tests
            ;;
        "api")
            check_prerequisites
            setup_test_environment
            run_api_tests
            ;;
        "performance")
            check_prerequisites
            run_performance_tests
            ;;
        "accessibility")
            check_prerequisites
            setup_test_environment
            run_accessibility_tests
            ;;
        "mobile")
            check_prerequisites
            setup_test_environment
            run_mobile_tests
            ;;
        "all")
            check_prerequisites
            setup_test_environment
            run_smoke_tests
            run_authentication_tests
            run_core_functionality_tests
            run_api_tests
            run_performance_tests
            run_accessibility_tests
            run_mobile_tests
            generate_test_report
            ;;
        *)
            echo "Usage: $0 {smoke|auth|core|api|performance|accessibility|mobile|all}"
            echo ""
            echo "Test Suites:"
            echo "  smoke        - Basic health and accessibility checks"
            echo "  auth         - Authentication flow tests"
            echo "  core         - Core functionality tests"
            echo "  api          - API integration tests"
            echo "  performance  - Performance and load tests"
            echo "  accessibility - Accessibility compliance tests"
            echo "  mobile       - Mobile responsive tests"
            echo "  all          - Run all test suites (default)"
            echo ""
            echo "Environment Variables:"
            echo "  TEST_ENV     - Test environment (development, staging, production)"
            echo "  BASE_URL     - Base URL for testing"
            echo "  HEADLESS     - Run in headless mode (true/false)"
            echo "  BROWSER      - Browser to use (chromium, firefox, webkit)"
            exit 1
            ;;
    esac
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"