# Stripe Integration Setup Guide

## Overview

This guide walks you through setting up Stripe payments for subscription billing in Prismy. The integration includes:

- Subscription plans (Free, Standard, Premium, Enterprise)
- Stripe Checkout for payments
- Customer billing portal
- Webhooks for subscription updates
- Database integration for user billing data

## 1. Stripe Dashboard Setup

### Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification if required
3. Note your account ID for reference

### Create Products and Prices

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

### Get API Keys

1. Go to Developers → API Keys
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Price IDs (from step 1)
STRIPE_STANDARD_PRICE_ID=price_1234567890abcdef
STRIPE_PREMIUM_PRICE_ID=price_abcdef1234567890
STRIPE_ENTERPRISE_PRICE_ID=price_fedcba0987654321

# App URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Database Migration

Run the Stripe migration to add billing fields to your database:

```sql
-- Apply the migration from supabase-stripe-migration.sql
-- This adds Stripe customer/subscription fields to user_profiles table
```

You can apply this in your Supabase dashboard → SQL Editor, or via the Supabase CLI.

## 4. Webhook Configuration

### Create Webhook Endpoint

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

### Add Webhook Secret

Add to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 5. Testing the Integration

### Test Payments

1. Use Stripe test cards for testing:

   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

2. Test the flow:
   - Visit `/pricing`
   - Click "Choose Plan" on a paid plan
   - Complete checkout with test card
   - Verify user is redirected to dashboard
   - Check database for updated subscription fields

### Test Webhooks

1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   ```
2. Trigger test webhook:
   ```bash
   stripe trigger customer.subscription.created
   ```

### Test Billing Portal

1. Create a subscription via checkout
2. Visit `/dashboard/billing`
3. Click "Manage Billing"
4. Verify redirect to Stripe billing portal

## 6. Production Deployment

### Update Environment Variables

Replace test keys with live keys:

- `pk_live_...` for publishable key
- `sk_live_...` for secret key
- Live price IDs from production products

### Update Webhook URL

Update webhook endpoint URL to your production domain:
`https://your-production-domain.com/api/stripe/webhooks`

### Domain Configuration

Add your production domain to:

1. Stripe → Settings → Branding → Domain
2. Update `NEXT_PUBLIC_SITE_URL` environment variable

## 7. Features Included

### Pricing Page (`/pricing`)

- Displays all subscription plans
- Monthly/yearly billing toggle (20% discount)
- Integrates with Stripe Checkout
- Responsive design with Vietnamese translation

### Billing Management (`/dashboard/billing`)

- Current subscription status
- Usage tracking and limits
- Billing portal access
- Plan upgrade/downgrade options

### API Endpoints

- `/api/stripe/create-checkout` - Creates Stripe Checkout session
- `/api/stripe/create-portal` - Creates billing portal session
- `/api/stripe/webhooks` - Handles Stripe webhook events

### Database Integration

- Automatic user profile creation with billing fields
- Subscription status tracking
- Usage limits based on plan tier
- Webhook-driven updates

## 8. Troubleshooting

### Common Issues

**"Invalid price ID" error**

- Verify price IDs in environment variables match Stripe dashboard
- Ensure you're using the correct test/live keys

**Webhook signature verification failed**

- Check webhook secret matches Stripe dashboard
- Ensure webhook URL is accessible from internet

**Checkout session creation fails**

- Verify Stripe secret key is correct
- Check user authentication is working
- Ensure price IDs exist in your Stripe account

**Billing portal access denied**

- User must have an active subscription
- Check `stripe_customer_id` exists in user profile
- Verify billing portal is configured in Stripe

### Logs and Debugging

- Check browser console for client-side errors
- Check server logs for API route errors
- Use Stripe Dashboard → Logs for webhook debugging
- Enable Stripe webhook event logging

## 9. Security Considerations

- Never expose secret keys in client-side code
- Verify webhook signatures to prevent tampering
- Use HTTPS in production
- Implement proper error handling for failed payments
- Follow PCI compliance guidelines

## 10. Next Steps

After setup is complete:

1. Test all payment flows thoroughly
2. Set up monitoring and alerting for failed payments
3. Configure email notifications for subscription changes
4. Implement usage tracking and enforcement
5. Add analytics and reporting for subscription metrics
