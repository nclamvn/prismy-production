#!/bin/bash

# 🔍 8-Step Production Validation Script
# Run all validation tests to ensure production readiness

echo "🚀 Starting Prismy v2 Production Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Function to run a test suite
run_test() {
    local step=$1
    local name=$2
    local file=$3
    
    echo -e "${YELLOW}Step $step: $name${NC}"
    echo "----------------------------------------"
    
    if npx playwright test "$file" --reporter=list; then
        echo -e "${GREEN}✅ $name - PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $name - FAILED${NC}"
        ((FAILED++))
    fi
    
    echo ""
}

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Install Playwright browsers if needed
echo "📦 Ensuring Playwright browsers are installed..."
npx playwright install chromium

echo ""
echo "🔍 Running 8-Step Validation Checklist"
echo "======================================"
echo ""

# Run each validation step
run_test 1 "Authentication Flow" "tests/validation/auth-flow.spec.ts"
run_test 2 "Core Pipeline (MVP Mode)" "tests/validation/core-pipeline.spec.ts"
run_test 3 "Admin Functions" "tests/validation/admin-functions.spec.ts"
run_test 4 "Security" "tests/validation/security.spec.ts"
run_test 5 "Performance" "tests/validation/performance.spec.ts"
run_test 6 "Error Handling" "tests/validation/error-handling.spec.ts"
run_test 7 "User Experience" "tests/validation/user-experience.spec.ts"
run_test 8 "Monitoring" "tests/validation/monitoring.spec.ts"

# Summary
echo ""
echo "======================================"
echo "📊 Validation Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All validation tests passed!${NC}"
    echo "✅ Prismy v2 is ready for production deployment"
    exit 0
else
    echo -e "${RED}⚠️  Some validation tests failed${NC}"
    echo "Please fix the failing tests before deploying to production"
    exit 1
fi