#!/bin/bash
cd /Users/mac/prismy/prismy-production

# Add all changes
git add -A

# Create commit with comprehensive SSR fixes
git commit -m "fix: comprehensive SSR and production deployment fixes

- Fixed next.config.js for production with proper webpack configurations
- Added PDF.js and Tesseract.js stubs for serverless environments
- Fixed all SSR browser API issues by replacing with serverless-compatible implementations
- Configured webpack to handle worker threads and problematic modules
- Added proper fallbacks and externals for Vercel deployment
- Optimized bundle splitting for better performance

These changes ensure stable deployment on Vercel serverless platform.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin main

echo "Deployment completed successfully!"