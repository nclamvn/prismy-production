#!/bin/bash

# 🚀 Prismy v2 Production Deployment Script
# Automated deployment to production with safety checks

echo "🚀 Prismy v2 Production Deployment"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo "🔍 Checking deployment requirements..."
    
    local missing_tools=()
    
    # Check for required commands
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if ! command -v tsx &> /dev/null; then
        missing_tools+=("tsx")
    fi
    
    if ! command -v vercel &> /dev/null; then
        missing_tools+=("vercel")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo "Please install missing tools and try again."
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required tools are installed${NC}"
}

# Check environment variables
check_environment() {
    echo ""
    echo "🔧 Checking environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}⚠️  .env.local file not found${NC}"
        echo "Please create .env.local with your configuration:"
        echo ""
        cat << 'EOF'
# Copy from .env.example and fill in your values:
cp .env.example .env.local

# Then edit .env.local with your actual values:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY (optional)
# - ANTHROPIC_API_KEY (optional)
EOF
        return 1
    fi
    
    echo -e "${GREEN}✅ Environment file found${NC}"
    return 0
}

# Build the application
build_application() {
    echo ""
    echo "🏗️ Building application..."
    
    if npm run build; then
        echo -e "${GREEN}✅ Application built successfully${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

# Run database migrations
run_migrations() {
    echo ""
    echo "💾 Running database migrations..."
    
    # Check if we have the database scripts
    if [ ! -f "database/scripts/run-migrations.ts" ]; then
        echo -e "${YELLOW}⚠️  Migration script not found, skipping...${NC}"
        return 0
    fi
    
    cd database/scripts
    
    echo "Checking migration status..."
    if npm run tsx run-migrations.ts status 2>/dev/null || tsx run-migrations.ts status; then
        echo ""
        echo "Running pending migrations..."
        if npm run tsx run-migrations.ts up 2>/dev/null || tsx run-migrations.ts up; then
            echo -e "${GREEN}✅ Database migrations completed successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Database migrations had issues (may need manual setup)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not run migrations (may need manual database setup)${NC}"
    fi
    
    cd ../..
}

# Deploy to Vercel
deploy_vercel() {
    echo ""
    echo "🚀 Deploying to Vercel..."
    
    # Check if logged into Vercel
    if ! vercel whoami &> /dev/null; then
        echo "Please log into Vercel first:"
        vercel login
    fi
    
    # Deploy to production
    echo "Deploying to production..."
    if vercel --prod; then
        echo -e "${GREEN}✅ Deployment to Vercel completed successfully${NC}"
    else
        echo -e "${RED}❌ Vercel deployment failed${NC}"
        return 1
    fi
}

# Validate deployment
validate_deployment() {
    echo ""
    echo "🔍 Validating deployment..."
    
    echo "Checking Vercel deployments..."
    vercel ls 2>/dev/null | head -5
    
    echo ""
    echo -e "${GREEN}🎉 Deployment process completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test your deployment manually"
    echo "2. Set up environment variables in Vercel dashboard if needed"
    echo "3. Configure your domain (if applicable)"
    echo "4. Monitor application performance"
}

# Main deployment process
main() {
    echo "Starting production deployment process..."
    echo ""
    
    # Step 1: Check requirements
    check_requirements
    
    # Step 2: Check environment
    if ! check_environment; then
        echo "Please fix environment configuration and run again."
        exit 1
    fi
    
    # Step 3: Build application
    if ! build_application; then
        echo "Build failed. Please fix errors and try again."
        exit 1
    fi
    
    # Step 4: Run migrations (optional)
    run_migrations
    
    # Step 5: Deploy to Vercel
    if ! deploy_vercel; then
        echo "Vercel deployment failed. Please check logs."
        exit 1
    fi
    
    # Step 6: Validate deployment
    validate_deployment
    
    # Success message
    echo ""
    echo "======================================"
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED!${NC}"
    echo "======================================"
    echo ""
    echo "Your Prismy v2 application should be live on Vercel!"
    echo ""
    echo "To enable advanced features later:"
    echo "- Enable large uploads: vercel env add ENABLE_LARGE_UPLOADS true"
    echo "- Enable OCR queue: vercel env add ENABLE_OCR_QUEUE true"
    echo ""
    echo -e "${GREEN}Welcome to production! 🚀${NC}"
}

# Run main function
main "$@"