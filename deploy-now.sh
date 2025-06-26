#!/bin/bash

echo "🚀 DEPLOYING TO PRISMY.IN NOW"
echo "============================="
echo ""

# Deploy production build directly to Vercel
echo "📦 Building and deploying..."
vercel --prod --yes --name prismy-production

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "🌐 Your site will be live at:"
echo "   - https://prismy.in"
echo "   - https://prismy-production.vercel.app"