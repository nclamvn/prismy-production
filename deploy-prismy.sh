#!/bin/bash

echo "🚀 Deploying Prismy to production..."
echo ""
echo "📋 Cấu hình hiện tại:"
echo "- Development: http://localhost:3001"
echo "- Production: Vercel deployment"
echo ""

# Deploy với environment variables
echo "📦 Building and deploying..."
vercel --prod --public

echo ""
echo "✅ Deployment hoàn tất!"
echo ""
echo "🔗 Hướng dẫn cấu hình domain prismy.in:"
echo "1. Vào https://vercel.com/dashboard"
echo "2. Chọn project 'prismy-production'"
echo "3. Settings → Domains → Add prismy.in"
echo "4. Cấu hình DNS records:"
echo "   - Type: A"
echo "   - Name: @"
echo "   - Value: 76.76.21.21"
echo ""
echo "   - Type: CNAME"
echo "   - Name: www"
echo "   - Value: cname.vercel-dns.com"
echo ""
echo "📝 Lưu ý: Deployment có thể bị password protection."
echo "Để tắt: Project Settings → General → Password Protection → Disable"