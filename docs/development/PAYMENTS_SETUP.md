# Payment Integration Guide

## Overview

Prismy supports multiple payment methods to serve both international and Vietnamese domestic markets:

- **International Payments**: Stripe (Visa/Mastercard worldwide)
- **Vietnamese Payments**: VNPay (domestic cards/banking) and MoMo (mobile wallet)
- **Multi-Currency**: USD for international, VND for Vietnamese market

## International Payments (Stripe)

### 1. Stripe Dashboard Setup

#### Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification if required
3. Note your account ID for reference

#### Create Products and Prices

Create the following products with monthly pricing:

1. **Standard Plan**

   - Product name: "Prismy Standard"
   - Price: $9.99/month
   - Copy the Price ID (starts with `price_`)

2. **Premium Plan**

   - Product name: "Prismy Premium"
   - Price: $29.99/month
   - Copy the Price ID

3. **Enterprise Plan**
   - Product name: "Prismy Enterprise"
   - Price: $99.99/month
   - Copy the Price ID

#### Get API Keys

1. Go to Developers → API Keys
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

### 2. Webhook Configuration

#### Create Webhook Endpoint

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/api/stripe/webhooks`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)

## Vietnamese Payments

### VNPay Integration (Domestic Cards & Internet Banking)

#### 1. Register with VNPay

1. Visit [VNPay Merchant Portal](https://vnpay.vn)
2. Register for a merchant account
3. Complete business verification
4. Submit required documents:
   - Business license
   - Tax registration certificate
   - Bank account details
   - Legal representative ID

#### 2. Get VNPay Credentials

After approval, you'll receive:

- **TMN Code**: Terminal/Merchant code
- **Hash Secret**: For signature verification
- **API URLs**: Sandbox and production endpoints

#### 3. Test VNPay Integration

Use these test cards in sandbox:

- **Successful Payment**: 9704198526191432198 (NCB Bank)
- **Insufficient Funds**: 9704198526191432199
- **Invalid Card**: 1234567890123456

### MoMo Integration (Mobile Wallet)

#### 1. Register with MoMo

1. Visit [MoMo Business Portal](https://business.momo.vn)
2. Create business account
3. Complete KYB (Know Your Business) verification
4. Submit required documents:
   - Business registration certificate
   - Tax code certificate
   - Legal representative documents

#### 2. Get MoMo Credentials

After approval, you'll receive:

- **Partner Code**: Your unique partner identifier
- **Access Key**: API access key
- **Secret Key**: For signature generation

#### 3. Test MoMo Integration

1. Download MoMo app on your phone
2. Create test account with test phone number
3. Use sandbox environment for testing
4. Test different scenarios (success, failure, timeout)

## Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_STANDARD_PRICE_ID=price_1234567890abcdef
STRIPE_PREMIUM_PRICE_ID=price_abcdef1234567890
STRIPE_ENTERPRISE_PRICE_ID=price_fedcba0987654321

# VNPay Configuration
VNPAY_TMN_CODE=your_vnpay_terminal_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/vnpay/return
VNPAY_IPN_URL=http://localhost:3000/api/payments/vnpay/ipn

# MoMo Configuration
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:3000/payment/momo/return
MOMO_IPN_URL=http://localhost:3000/api/payments/momo/ipn

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Database Schema

### Payment Transactions Table

```sql
payment_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  order_id TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL, -- 'stripe', 'vnpay', 'momo'
  plan_key TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND', -- 'VND' or 'USD'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  transaction_id TEXT,
  payment_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
)
```

Run the database migration in `supabase-stripe-migration.sql` to create all required tables and fields.

## Pricing Structure

### International Pricing (USD)

- **Standard**: $9.99/month (50 translations)
- **Premium**: $29.99/month (200 translations)
- **Enterprise**: $99.99/month (1000 translations)

### Vietnamese Pricing (VND)

- **Standard**: 239,000 VND/month (50 translations)
- **Premium**: 719,000 VND/month (200 translations)
- **Enterprise**: 2,399,000 VND/month (1000 translations)

_Note: VND prices are optimized for Vietnamese purchasing power and include psychological pricing considerations._

## Testing Payment Flows

### Stripe Test Cards

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

### VNPay Test Scenarios

1. **Successful Card Payment**:

   - Use test card: 9704198526191432198
   - Bank: NCB (National Citizen Bank)
   - OTP: 123456

2. **Internet Banking**:
   - Select any Vietnamese bank
   - Use demo credentials provided by VNPay

### MoMo Test Scenarios

1. **Wallet Payment**:

   - Use test phone number: 0999999999
   - Test PIN: 111111

2. **QR Code Payment**:
   - Generate test QR code
   - Scan with MoMo app

## Security Considerations

### Stripe Security

- **Webhook Verification**: All webhooks verified with signing secrets
- **PCI Compliance**: Stripe handles all card data securely
- **HTTPS Only**: All communications must use HTTPS

### VNPay Security

- **Signature Verification**: All requests/responses signed with SHA512
- **IP Whitelisting**: Configure allowed IPs in VNPay dashboard
- **Hash Secret Protection**: Never expose hash secret in client-side code

### MoMo Security

- **HMAC-SHA256**: All requests signed with HMAC-SHA256
- **Request Validation**: Verify all callback signatures
- **Partner Code Protection**: Keep partner credentials secure

### General Security

- **Environment Variables**: Store all credentials in environment variables
- **Database Security**: Use Row Level Security (RLS) for payment transactions
- **Audit Trail**: Log all payment attempts and results
- **Error Handling**: Don't expose sensitive information in error messages

## Production Deployment

### Pre-Production Checklist

- [ ] Stripe account approved and verified
- [ ] VNPay merchant account approved and verified
- [ ] MoMo business account approved and verified
- [ ] Test all payment flows in sandbox environment
- [ ] Configure webhook URLs for production domain
- [ ] Set up monitoring and alerting
- [ ] Prepare customer support for payment issues

### Production Environment Variables

```env
# Production Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key

# Production VNPay
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://prismy.vn/payment/vnpay/return
VNPAY_IPN_URL=https://prismy.vn/api/payments/vnpay/ipn

# Production MoMo
MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=https://prismy.vn/payment/momo/return
MOMO_IPN_URL=https://prismy.vn/api/payments/momo/ipn

# Production Site URL
NEXT_PUBLIC_SITE_URL=https://prismy.vn
```

## API Endpoints

The payment system includes these API routes:

- `/api/stripe/create-checkout` - Creates Stripe Checkout session
- `/api/stripe/create-portal` - Creates billing portal session
- `/api/stripe/webhooks` - Handles Stripe webhook events
- `/api/payments/vnpay/create` - Creates VNPay payment
- `/api/payments/vnpay/ipn` - Handles VNPay callbacks
- `/api/payments/momo/create` - Creates MoMo payment
- `/api/payments/momo/ipn` - Handles MoMo callbacks

## Troubleshooting

### Common Stripe Issues

- **Invalid price ID**: Verify price IDs match Stripe dashboard
- **Webhook signature verification failed**: Check webhook secret
- **Checkout session creation fails**: Verify secret key and authentication

### Common VNPay Issues

- **Invalid Signature**: Check hash secret and parameter order
- **Transaction Timeout**: Increase timeout in VNPay dashboard
- **Currency Mismatch**: Ensure all amounts are in VND (xu units)

### Common MoMo Issues

- **Partner Code Error**: Verify partner code is correct
- **Signature Mismatch**: Check secret key and signature generation
- **QR Code Expiry**: QR codes expire after 10 minutes

## Support Resources

### Stripe Resources

- **Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Support**: Available 24/7 via dashboard

### VNPay Resources

- **Technical Documentation**: [VNPay Developer Portal](https://sandbox.vnpayment.vn/apis/)
- **Merchant Support**: support@vnpay.vn

### MoMo Resources

- **Developer Documentation**: [MoMo Developer Portal](https://developers.momo.vn/)
- **Business Support**: business@momo.vn

This comprehensive payment integration ensures that Prismy can serve both international users (via Stripe) and Vietnamese domestic users (via VNPay and MoMo) with secure, familiar payment methods and competitive local pricing.
