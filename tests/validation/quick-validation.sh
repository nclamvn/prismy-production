#!/bin/bash

# 🔍 Quick Production Validation Script
# Validates the production-ready components without requiring a running server

echo "🚀 Quick Prismy v2 Production Validation"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Function to check file exists and is valid
check_file() {
    local name=$1
    local file=$2
    local pattern=$3
    
    echo -n "Checking $name... "
    
    if [[ -f "$file" ]]; then
        if [[ -z "$pattern" ]] || grep -q "$pattern" "$file"; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL (missing pattern: $pattern)${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}❌ FAIL (file not found)${NC}"
        ((FAILED++))
    fi
}

# Function to check TypeScript compilation
check_typescript() {
    echo -n "TypeScript compilation... "
    
    if npm run type-check > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

# Function to check build process
check_build() {
    echo -n "Production build... "
    
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

# Function to check database migrations
check_migrations() {
    echo -n "Database migrations... "
    
    local migration_count=$(ls database/migrations/*.sql 2>/dev/null | wc -l)
    if [[ $migration_count -ge 4 ]]; then
        echo -e "${GREEN}✅ PASS ($migration_count migrations)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL (found $migration_count, need 4+)${NC}"
        ((FAILED++))
    fi
}

echo "🔍 Validating Production Infrastructure"
echo "======================================"
echo ""

# Check core infrastructure files
check_file "Feature flags system" "src/lib/feature-flags.ts" "getFeatureFlags"
check_file "Rate limiter" "src/lib/security/rate-limiter.ts" "applyRateLimit"
check_file "Error tracking" "src/lib/monitoring/error-tracking.ts" "reportError"
check_file "Middleware security" "src/middleware.ts" "security headers"
check_file "Next.js config" "next.config.ts" "withSentryConfig"

echo ""

# Check database setup
check_file "Initial schema migration" "database/migrations/001_initial_schema.sql" "create table"
check_file "RLS policies" "database/migrations/002_row_level_security.sql" "enable row level security"
check_file "Storage buckets" "database/migrations/003_storage_buckets.sql" "storage.buckets"
check_file "Database functions" "database/migrations/004_functions_and_triggers.sql" "create or replace function"

echo ""

# Check scripts
check_file "Migration runner" "database/scripts/run-migrations.ts" "runMigrations"
check_file "User seeding" "database/scripts/seed-users.ts" "SEED_USERS"

echo ""

# Check deployment configuration
check_file "Vercel config" "vercel.json" "buildCommand"
check_file "Environment template" ".env.example" "NEXT_PUBLIC_SUPABASE_URL"
check_file "Production checklist" "deploy/production-checklist.md" "GO-LIVE-FOR-INTERNAL"

echo ""

# Check Sentry configuration
check_file "Sentry client config" "sentry.client.config.ts" "Sentry.init"
check_file "Sentry server config" "sentry.server.config.ts" "Sentry.init"
check_file "Sentry edge config" "sentry.edge.config.ts" "Sentry.init"

echo ""

# Check validation tests exist
echo "Validation test files:"
for test_file in tests/validation/*.spec.ts; do
    if [[ -f "$test_file" ]]; then
        echo -e "${GREEN}✅ $(basename "$test_file")${NC}"
        ((PASSED++))
    fi
done

echo ""

# Check TypeScript compilation
echo "🔧 Code Quality Checks"
echo "====================="
check_typescript

echo ""

# Check build process
echo "🏗️ Build Process"
echo "==============="
check_build

echo ""

# Check migrations
echo "💾 Database Migrations"
echo "====================="
check_migrations

echo ""

# Summary
echo "======================================"
echo "📊 Validation Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 All infrastructure checks passed!${NC}"
    echo "✅ Prismy v2 infrastructure is ready for production deployment"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel"
    echo "2. Run database migrations: tsx database/scripts/run-migrations.ts up"
    echo "3. Seed production users: tsx database/scripts/seed-users.ts production"
    echo "4. Deploy: vercel --prod"
    exit 0
else
    echo -e "${RED}⚠️  Some infrastructure checks failed${NC}"
    echo "Please fix the failing components before deploying to production"
    exit 1
fi