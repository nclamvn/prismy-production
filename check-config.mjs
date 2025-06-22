#!/usr/bin/env node

/**
 * Prismy Configuration Checker
 * Kiểm tra cấu hình môi trường cho Prismy
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log(`${colors.blue}🔍 PRISMY CONFIGURATION CHECKER${colors.reset}\n`);

// Configuration groups
const configGroups = {
  '🔐 SUPABASE (Bắt buộc)': {
    required: true,
    vars: {
      'NEXT_PUBLIC_SUPABASE_URL': {
        description: 'Supabase Project URL',
        validator: (val) => val && val.includes('supabase.co'),
        example: 'https://xxxxx.supabase.co'
      },
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
        description: 'Supabase Anonymous Key',
        validator: (val) => val && val.length > 50,
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      },
      'SUPABASE_SERVICE_ROLE_KEY': {
        description: 'Supabase Service Role Key',
        validator: (val) => val && val.length > 50,
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  },
  
  '🌐 GOOGLE TRANSLATE API (Bắt buộc)': {
    required: true,
    vars: {
      'GOOGLE_CLOUD_PROJECT_ID': {
        description: 'Google Cloud Project ID',
        validator: (val) => val && val.length > 5,
        example: 'prismy-translate-123456'
      },
      'GOOGLE_TRANSLATE_API_KEY': {
        description: 'Google Translate API Key',
        validator: (val) => val && val.startsWith('AIza'),
        example: 'AIzaSy...'
      }
    }
  },
  
  '🤖 AI PROVIDERS (Tùy chọn)': {
    required: false,
    vars: {
      'OPENAI_API_KEY': {
        description: 'OpenAI API Key',
        validator: (val) => !val || val.startsWith('sk-'),
        example: 'sk-...'
      },
      'ANTHROPIC_API_KEY': {
        description: 'Anthropic API Key',
        validator: (val) => !val || val.startsWith('sk-ant-'),
        example: 'sk-ant-...'
      }
    }
  },
  
  '💳 PAYMENT - STRIPE (Tùy chọn)': {
    required: false,
    vars: {
      'STRIPE_SECRET_KEY': {
        description: 'Stripe Secret Key',
        validator: (val) => !val || val.startsWith('sk_'),
        example: 'sk_test_...'
      },
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': {
        description: 'Stripe Publishable Key',
        validator: (val) => !val || val.startsWith('pk_'),
        example: 'pk_test_...'
      }
    }
  },
  
  '🇻🇳 VIETNAMESE PAYMENTS (Tùy chọn)': {
    required: false,
    vars: {
      'VNPAY_TMN_CODE': {
        description: 'VNPay Terminal Code',
        validator: (val) => !val || val.length >= 8,
        example: 'ABCD1234'
      },
      'MOMO_PARTNER_CODE': {
        description: 'MoMo Partner Code',
        validator: (val) => !val || val.length >= 4,
        example: 'MOMO1234'
      }
    }
  },
  
  '🌍 APPLICATION CONFIG': {
    required: true,
    vars: {
      'NEXT_PUBLIC_SITE_URL': {
        description: 'Production Site URL',
        validator: (val) => val && val.startsWith('http'),
        example: 'https://prismy.in'
      }
    }
  }
};

// Check configurations
let hasErrors = false;
let hasWarnings = false;

for (const [groupName, group] of Object.entries(configGroups)) {
  console.log(`\n${colors.magenta}${groupName}${colors.reset}`);
  
  for (const [varName, config] of Object.entries(group.vars)) {
    const value = process.env[varName];
    const isSet = !!value;
    const isValid = config.validator(value);
    
    if (!isSet && group.required) {
      console.log(`  ${colors.red}❌ ${varName}${colors.reset}`);
      console.log(`     ${config.description}`);
      console.log(`     Example: ${config.example}`);
      hasErrors = true;
    } else if (!isSet && !group.required) {
      console.log(`  ${colors.yellow}⚠️  ${varName}${colors.reset} (không bắt buộc)`);
      console.log(`     ${config.description}`);
      hasWarnings = true;
    } else if (isSet && !isValid) {
      console.log(`  ${colors.red}❌ ${varName}${colors.reset} - Giá trị không hợp lệ`);
      console.log(`     Current: ${value.substring(0, 20)}...`);
      console.log(`     Example: ${config.example}`);
      hasErrors = true;
    } else if (isSet) {
      console.log(`  ${colors.green}✅ ${varName}${colors.reset}`);
      console.log(`     ${value.substring(0, 30)}...`);
    }
  }
}

// Summary
console.log(`\n${colors.blue}📊 KẾT QUẢ KIỂM TRA${colors.reset}`);

if (hasErrors) {
  console.log(`${colors.red}❌ Có lỗi cấu hình bắt buộc. Vui lòng sửa trước khi deploy.${colors.reset}`);
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}⚠️  Một số cấu hình tùy chọn chưa được thiết lập.${colors.reset}`);
  console.log(`${colors.green}✅ Cấu hình cơ bản đã sẵn sàng!${colors.reset}`);
} else {
  console.log(`${colors.green}✅ Tất cả cấu hình đã hoàn tất!${colors.reset}`);
}

// Additional checks
console.log(`\n${colors.blue}🔧 KIỂM TRA BỔ SUNG${colors.reset}`);

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.log(`${colors.red}❌ File .env.local không tồn tại${colors.reset}`);
  console.log('   Chạy: cp .env.example .env.local');
} else {
  console.log(`${colors.green}✅ File .env.local tồn tại${colors.reset}`);
}

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.log(`${colors.yellow}⚠️  Node.js version ${nodeVersion} - Khuyến nghị v18+${colors.reset}`);
} else {
  console.log(`${colors.green}✅ Node.js ${nodeVersion}${colors.reset}`);
}

// Suggestions
if (hasErrors || hasWarnings) {
  console.log(`\n${colors.blue}💡 GỢI Ý${colors.reset}`);
  console.log('1. Đọc file HUONG_DAN_CAU_HINH_PRISMY.md để biết chi tiết');
  console.log('2. Tạo Supabase project tại https://supabase.com');
  console.log('3. Tạo Google Cloud project và enable Translate API');
  console.log('4. Điền đầy đủ thông tin vào .env.local');
  console.log('5. Chạy lại script này để kiểm tra');
}

console.log(`\n${colors.blue}🚀 BƯỚC TIẾP THEO${colors.reset}`);
if (!hasErrors) {
  console.log('1. npm run dev - Test local');
  console.log('2. Thử đăng nhập tại http://localhost:3000');
  console.log('3. vercel --prod - Deploy production');
}