#!/bin/bash

echo "🚀 Deploying SSR fixes to prismy.in..."
echo "📍 Working directory: $(pwd)"
echo ""

# Check git status
echo "📋 Checking git status..."
git status
echo ""

# Stage all changes
echo "📦 Staging all changes..."
git add .
echo ""

# Show what will be committed
echo "📝 Changes to be committed:"
git diff --cached --name-only
echo ""

# Commit with comprehensive message
echo "💾 Committing SSR fixes..."
git commit -m "fix: resolve all SSR issues for stable deployment

- Add SSR guards for navigator/window/document access in performance-optimizer.ts
- Fix browser API access in accessibility-enhancer.ts with proper SSR checks  
- Maintain all enterprise features with SSR compatibility
- Add dynamic exports to prevent static generation issues
- All functionality preserved, builds should now succeed

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""

# Push to GitHub to trigger Vercel deployment
echo "🚀 Pushing to GitHub (triggers Vercel auto-deployment)..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "🔗 Next steps:"
echo "1. Monitor Vercel dashboard for build progress"
echo "2. Check https://prismy.in once deployment completes"
echo "3. Verify all enterprise features work correctly"
echo ""
echo "📊 Expected results:"
echo "- ✅ Build should succeed without SSR errors"
echo "- ✅ All enterprise analytics features should work"
echo "- ✅ Workflow builder should render correctly"
echo "- ✅ No functionality lost"
echo ""

# Final status check
echo "📋 Final git status:"
git status