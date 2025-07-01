#!/bin/bash

echo "🚀 Deploying to Vercel using CLI"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

echo ""
echo "🔧 Deploying to production..."
echo ""

# Deploy to production with prismy.in domain
vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site is live at:"
echo "   - https://prismy.in"
echo "   - https://prismy-production.vercel.app"
echo ""
echo "📊 Check deployment status:"
echo "   - vercel ls"
echo "   - vercel inspect [deployment-url]"