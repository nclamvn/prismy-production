#!/bin/bash

# Quick test of minimal OAuth implementation
# This bypasses Next.js entirely to isolate the root cause

echo "🔥 TESTING MINIMAL OAUTH - ISOLATING ROOT CAUSE"
echo "=============================================="
echo ""

# Method 1: Deploy minimal test to Vercel directly
echo "📦 METHOD 1: Deploy minimal test to Vercel"
echo "----------------------------------------"
echo "1. Copy minimal-oauth-test.html to public folder:"
mkdir -p public
cp minimal-oauth-test.html public/oauth-test.html

echo "✅ Minimal test file copied to public/oauth-test.html"
echo ""

# Method 2: Create standalone deployment config
echo "📦 METHOD 2: Create standalone test deployment"
echo "--------------------------------------------"

cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Root Cause Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .test-link { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .test-link:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 OAuth Root Cause Test</h1>
        <p><strong>Purpose:</strong> Isolate whether OAuth issue is infrastructure or framework-related</p>
        
        <a href="oauth-test.html" class="test-link">🧪 Run Minimal OAuth Test</a>
        
        <h3>📋 Test Instructions:</h3>
        <ol>
            <li>Click "Run Minimal OAuth Test" above</li>
            <li>Click "Test Google Login" button</li>
            <li>Complete Google OAuth flow</li>
            <li>Check if you get redirected back with success</li>
        </ol>
        
        <h3>🎯 Expected Results:</h3>
        <ul>
            <li><strong>✅ If it WORKS:</strong> Issue is in Next.js/framework implementation</li>
            <li><strong>❌ If it FAILS:</strong> Issue is in Google/Supabase configuration</li>
        </ul>
        
        <p><em>This test bypasses all Next.js middleware, routing, and complexity.</em></p>
    </div>
</body>
</html>
EOF

echo "✅ Created public/index.html with test instructions"
echo ""

# Method 3: Test using local file
echo "📦 METHOD 3: Test locally with file:// protocol"
echo "----------------------------------------------"
echo "1. Open minimal-oauth-test.html directly in browser"
echo "2. File location: $(pwd)/minimal-oauth-test.html"
echo ""

# Deploy to Vercel
echo "🚀 DEPLOYING MINIMAL TEST TO VERCEL"
echo "==================================="
echo "Command: vercel --prod"
echo ""

echo "🎯 CRITICAL DECISION POINT:"
echo "=========================="
echo "After testing minimal OAuth:"
echo ""
echo "IF MINIMAL TEST WORKS ✅"
echo "→ Problem is in Next.js implementation"
echo "→ Focus on middleware, routing, SSR issues"
echo "→ Review auth callback route logic"
echo ""
echo "IF MINIMAL TEST FAILS ❌"
echo "→ Problem is in Google OAuth app config"
echo "→ Check Google Console settings"
echo "→ Verify Supabase project configuration"
echo "→ Check domain/redirect URL settings"
echo ""

echo "🏁 Ready to test! Run: vercel --prod"