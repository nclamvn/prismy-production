# Vietnamese Payment Gateway Setup Guide

## Overview

This guide covers the integration of Vietnamese local payment gateways for Prismy, including VNPay, MoMo, and domestic card support. These integrations allow Vietnamese users to pay in VND using familiar local payment methods.

## Supported Payment Methods

### 1. VNPay (Vietnam Payment Gateway)

- **Domestic Cards**: Visa, Mastercard, JCB issued by Vietnamese banks
- **Internet Banking**: All major Vietnamese banks
- **QR Code**: VNPay QR payments
- **Mobile Banking**: Direct bank app integration

### 2. MoMo (Mobile Wallet)

- **MoMo Wallet**: Direct wallet payments
- **Linked Cards**: Cards linked to MoMo account
- **QR Code**: MoMo QR payments
- **In-app**: Mobile app integration

### 3. Stripe (International Backup)

- **International Cards**: Visa/Mastercard from any country
- **Fallback Option**: For users who prefer international payment methods

## VNPay Integration Setup

### 1. Register with VNPay

1. Visit [VNPay Merchant Portal](https://vnpay.vn)
2. Register for a merchant account
3. Complete business verification
4. Submit required documents:
   - Business license
   - Tax registration certificate
   - Bank account details
   - Legal representative ID

### 2. Get VNPay Credentials

After approval, you'll receive:

- **TMN Code**: Terminal/Merchant code
- **Hash Secret**: For signature verification
- **API URLs**: Sandbox and production endpoints

### 3. Configure Environment Variables

```env
# VNPay Sandbox Configuration
VNPAY_TMN_CODE=your_terminal_code
VNPAY_HASH_SECRET=your_hash_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/payment/vnpay/return
VNPAY_IPN_URL=https://yourdomain.com/api/payments/vnpay/ipn

# Production URLs (when ready)
# VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
```

### 4. Test VNPay Integration

Use these test cards in sandbox:

- **Successful Payment**: 9704198526191432198 (NCB Bank)
- **Insufficient Funds**: 9704198526191432199
- **Invalid Card**: 1234567890123456

## MoMo Integration Setup

### 1. Register with MoMo

1. Visit [MoMo Business Portal](https://business.momo.vn)
2. Create business account
3. Complete KYB (Know Your Business) verification
4. Submit required documents:
   - Business registration certificate
   - Tax code certificate
   - Legal representative documents

### 2. Get MoMo Credentials

After approval, you'll receive:

- **Partner Code**: Your unique partner identifier
- **Access Key**: API access key
- **Secret Key**: For signature generation

### 3. Configure Environment Variables

```env
# MoMo Sandbox Configuration
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=https://yourdomain.com/payment/momo/return
MOMO_IPN_URL=https://yourdomain.com/api/payments/momo/ipn

# Production endpoint (when ready)
# MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create
```

### 4. Test MoMo Integration

1. Download MoMo app on your phone
2. Create test account with test phone number
3. Use sandbox environment for testing
4. Test different scenarios (success, failure, timeout)

## Database Migration

Run the database migration to support Vietnamese payments:

```sql
-- Apply the migration from supabase-stripe-migration.sql
-- This creates the payment_transactions table and adds billing fields
```

Apply this in your Supabase dashboard → SQL Editor:

1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy content from `supabase-stripe-migration.sql`
4. Execute the migration

## Pricing Configuration

### Vietnamese Pricing Strategy

The system uses these VND equivalents (based on current exchange rates):

- **Standard Plan**: 239,000 VND/month (~$9.99 USD)
- **Premium Plan**: 719,000 VND/month (~$29.99 USD)
- **Enterprise Plan**: 2,399,000 VND/month (~$99.99 USD)

### Price Considerations for Vietnamese Market

1. **Psychological Pricing**: Rounded to common Vietnamese price points
2. **Local Purchasing Power**: Competitive with local services
3. **Tax Inclusion**: Prices include 10% VAT where applicable
4. **Exchange Rate Buffer**: Prices account for currency fluctuation

## Testing Payment Flows

### VNPay Test Scenarios

1. **Successful Card Payment**:

   - Use test card: 9704198526191432198
   - Bank: NCB (National Citizen Bank)
   - OTP: 123456

2. **Failed Payment**:

   - Use test card: 9704198526191432199
   - Simulate insufficient funds

3. **Internet Banking**:
   - Select any Vietnamese bank
   - Use demo credentials provided by VNPay

### MoMo Test Scenarios

1. **Wallet Payment**:

   - Use test phone number: 0999999999
   - Test PIN: 111111

2. **QR Code Payment**:

   - Generate test QR code
   - Scan with MoMo app

3. **Linked Card Payment**:
   - Link test card to MoMo account
   - Pay through MoMo interface

## Security Considerations

### VNPay Security

- **Signature Verification**: All requests/responses signed with SHA512
- **IP Whitelisting**: Configure allowed IPs in VNPay dashboard
- **HTTPS Only**: All communications must use HTTPS
- **Hash Secret Protection**: Never expose hash secret in client-side code

### MoMo Security

- **HMAC-SHA256**: All requests signed with HMAC-SHA256
- **Request Validation**: Verify all callback signatures
- **Partner Code Protection**: Keep partner credentials secure
- **IPN Handling**: Implement proper IPN (Instant Payment Notification) processing

### General Security

- **Environment Variables**: Store all credentials in environment variables
- **Database Security**: Use Row Level Security (RLS) for payment transactions
- **Audit Trail**: Log all payment attempts and results
- **Error Handling**: Don't expose sensitive information in error messages

## Production Deployment

### Pre-Production Checklist

- [ ] VNPay merchant account approved and verified
- [ ] MoMo business account approved and verified
- [ ] Test all payment flows in sandbox environment
- [ ] Configure webhook URLs for production domain
- [ ] Set up monitoring and alerting
- [ ] Prepare customer support for payment issues

### Production Environment Variables

```env
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

### Go-Live Process

1. **Switch to Production URLs**: Update environment variables
2. **Update Webhook URLs**: Configure production webhook endpoints
3. **Test Production**: Run final tests with small amounts
4. **Monitor Transactions**: Watch for any issues in first 24 hours
5. **Customer Communication**: Inform users about new payment options

## Troubleshooting

### Common VNPay Issues

1. **Invalid Signature**: Check hash secret and parameter order
2. **Transaction Timeout**: Increase timeout in VNPay dashboard
3. **Bank Integration Issues**: Some banks may have maintenance windows
4. **Currency Mismatch**: Ensure all amounts are in VND (xu units)

### Common MoMo Issues

1. **Partner Code Error**: Verify partner code is correct
2. **Signature Mismatch**: Check secret key and signature generation
3. **Network Timeout**: Implement retry logic for API calls
4. **QR Code Expiry**: QR codes expire after 10 minutes

### Debugging Tools

1. **Request/Response Logging**: Log all API interactions
2. **Webhook Testing**: Use tools like ngrok for local webhook testing
3. **Transaction Tracing**: Track transactions across all systems
4. **Error Monitoring**: Set up alerts for payment failures

## Support and Documentation

### VNPay Resources

- **Technical Documentation**: [VNPay Developer Portal](https://sandbox.vnpayment.vn/apis/)
- **Merchant Support**: support@vnpay.vn
- **Technical Support**: 1900 55 55 77

### MoMo Resources

- **Developer Documentation**: [MoMo Developer Portal](https://developers.momo.vn/)
- **Business Support**: business@momo.vn
- **Technical Support**: 1900 54 54 41

### Integration Support

- **Test Environment Access**: Available 24/7
- **Production Support**: Business hours (8 AM - 6 PM VN time)
- **Emergency Contact**: Available for critical payment issues

## Compliance and Legal

### Vietnamese Regulations

- **Payment Service License**: Required for payment processing
- **Data Protection**: Comply with Vietnamese data protection laws
- **Tax Obligations**: Handle VAT and corporate income tax
- **Customer Protection**: Implement dispute resolution processes

### International Standards

- **PCI DSS**: Payment Card Industry Data Security Standard
- **ISO 27001**: Information security management
- **GDPR Compliance**: For international users

This comprehensive setup ensures that Vietnamese users can pay using their preferred local payment methods while maintaining security and compliance standards.
