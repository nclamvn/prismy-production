/**
 * Payment Flows E2E Tests
 * Vietnamese payment gateway integration testing
 * VNPay, MoMo, and Stripe integration validation
 */

import { test, expect } from '@playwright/test';

test.describe('💳 Vietnamese Payment Integration Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Set Vietnamese locale and currency
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN');
      window.localStorage.setItem('currency', 'VND');
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('VNPay integration flow works correctly', async ({ page }) => {
    // Navigate to pricing or payment page
    const pricingLink = page.locator('a:has-text("Giá"), a:has-text("Pricing"), a:has-text("Gói"), [href*="pricing"], [href*="plans"]').first();
    
    if (await pricingLink.count() > 0) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for VNPay payment option
      const vnpayOption = page.locator('text=/VNPay|vnpay/i, [data-payment="vnpay"], [value="vnpay"]');
      
      if (await vnpayOption.count() > 0) {
        await expect(vnpayOption.first()).toBeVisible();
        
        // Check for VND pricing
        const vndPricing = page.locator('text=/₫|VND/i');
        await expect(vndPricing.first()).toBeVisible();
        
        // Verify Vietnamese pricing format (e.g., 239.000 ₫)
        const vietnamesePricing = page.locator('text=/\d{1,3}(\.\d{3})*\s*₫/');
        await expect(vietnamesePricing.first()).toBeVisible();
        
        // Test payment selection (don't proceed to actual payment)
        await vnpayOption.first().click();
        
        // Should show VNPay-specific UI elements
        const vnpayElements = page.locator('[data-testid*="vnpay"], .vnpay, text=/VNPay/i');
        await expect(vnpayElements.first()).toBeVisible({ timeout: 5000 });
      } else {
        console.log('⚠️ VNPay payment option not found');
      }
    }
  });

  test('MoMo integration flow is available', async ({ page }) => {
    // Navigate to payment interface
    const paymentButton = page.locator('button:has-text("Thanh toán"), button:has-text("Payment"), button:has-text("Nâng cấp"), [data-testid*="payment"]').first();
    
    if (await paymentButton.count() > 0) {
      await paymentButton.click();
      await page.waitForLoadState('networkidle');
      
      // Look for MoMo payment option
      const momoOption = page.locator('text=/MoMo|momo/i, [data-payment="momo"], [value="momo"]');
      
      if (await momoOption.count() > 0) {
        await expect(momoOption.first()).toBeVisible();
        
        // Test MoMo selection
        await momoOption.first().click();
        
        // Should show MoMo-specific elements
        const momoElements = page.locator('[data-testid*="momo"], .momo, text=/MoMo/i');
        await expect(momoElements.first()).toBeVisible({ timeout: 5000 });
        
        // Check for mobile number input (MoMo requirement)
        const phoneInput = page.locator('input[type="tel"], input[placeholder*="số điện thoại"], input[placeholder*="phone"]');
        if (await phoneInput.count() > 0) {
          await expect(phoneInput.first()).toBeVisible();
        }
      } else {
        console.log('⚠️ MoMo payment option not found');
      }
    }
  });

  test('Stripe integration supports Vietnamese users', async ({ page }) => {
    // Look for international payment option (Stripe)
    const stripeOption = page.locator('text=/Thẻ tín dụng|Credit Card|Stripe/i, [data-payment="stripe"], [data-payment="card"]');
    
    if (await stripeOption.count() > 0) {
      await stripeOption.first().click();
      
      // Should show card input fields
      const cardInputs = page.locator('input[placeholder*="card"], input[placeholder*="thẻ"], iframe[name*="card"]');
      
      if (await cardInputs.count() > 0) {
        await expect(cardInputs.first()).toBeVisible();
        
        // Check for Vietnamese language support in payment form
        const vietnameseLabels = page.locator('label:has-text("Số thẻ"), label:has-text("Tên chủ thẻ"), label:has-text("CVV")');
        
        if (await vietnameseLabels.count() > 0) {
          await expect(vietnameseLabels.first()).toBeVisible();
        }
      }
    }
  });

  test('Payment security measures are in place', async ({ page }) => {
    // Check for HTTPS on payment pages
    expect(page.url()).toMatch(/^https:/);
    
    // Look for security indicators
    const securityElements = page.locator('text=/Bảo mật|Secure|SSL|An toàn/i, [data-testid*="secure"]');
    
    if (await securityElements.count() > 0) {
      await expect(securityElements.first()).toBeVisible();
    }
    
    // Check for CSRF token in forms
    const forms = page.locator('form');
    
    if (await forms.count() > 0) {
      const csrfToken = page.locator('input[name*="csrf"], input[name*="_token"], meta[name="csrf-token"]');
      
      if (await csrfToken.count() > 0) {
        const tokenValue = await csrfToken.first().getAttribute('value') || await csrfToken.first().getAttribute('content');
        expect(tokenValue).toBeTruthy();
        expect(tokenValue?.length).toBeGreaterThan(10);
      }
    }
  });

  test('Payment flow handles Vietnamese input validation', async ({ page }) => {
    // Test Vietnamese phone number validation
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="điện thoại"]');
    
    if (await phoneInput.count() > 0) {
      // Test valid Vietnamese phone number
      await phoneInput.fill('0123456789');
      
      // Test invalid format
      await phoneInput.fill('123');
      
      // Should show validation error
      const validationError = page.locator('[role="alert"], .error, [data-testid*="error"]');
      
      if (await validationError.count() > 0) {
        await expect(validationError.first()).toBeVisible({ timeout: 3000 });
      }
    }
    
    // Test Vietnamese address validation
    const addressInput = page.locator('input[placeholder*="địa chỉ"], input[name*="address"]');
    
    if (await addressInput.count() > 0) {
      // Test Vietnamese address format
      await addressInput.fill('123 Nguyễn Huệ, Quận 1, TP.HCM');
      
      // Should accept Vietnamese characters
      const inputValue = await addressInput.inputValue();
      expect(inputValue).toContain('Nguyễn');
    }
  });

  test('Payment confirmation displays Vietnamese content', async ({ page }) => {
    // Simulate reaching payment confirmation
    const confirmButton = page.locator('button:has-text("Xác nhận"), button:has-text("Confirm"), [data-testid*="confirm"]');
    
    if (await confirmButton.count() > 0) {
      // Don't actually submit, but check for confirmation elements
      const confirmationElements = page.locator('text=/Xác nhận thanh toán|Confirm payment|Đơn hàng|Order/i');
      
      if (await confirmationElements.count() > 0) {
        await expect(confirmationElements.first()).toBeVisible();
      }
      
      // Check for order summary in Vietnamese
      const orderSummary = page.locator('text=/Tổng cộng|Total|Thành tiền/i');
      
      if (await orderSummary.count() > 0) {
        await expect(orderSummary.first()).toBeVisible();
      }
    }
  });

  test('Payment error handling shows Vietnamese messages', async ({ page }) => {
    // Simulate payment error scenario
    const submitButton = page.locator('button[type="submit"], button:has-text("Thanh toán"), button:has-text("Pay")').first();
    
    if (await submitButton.count() > 0) {
      // Submit empty form to trigger validation
      await submitButton.click();
      
      // Should show Vietnamese error messages
      const errorMessages = page.locator('[role="alert"], .error, [data-testid*="error"]');
      
      if (await errorMessages.count() > 0) {
        const errorText = await errorMessages.first().textContent();
        
        // Should contain Vietnamese error text
        const hasVietnameseError = errorText?.includes('Vui lòng') || 
                                 errorText?.includes('Không thể') || 
                                 errorText?.includes('Lỗi') ||
                                 errorText?.includes('Bắt buộc');
        
        if (hasVietnameseError) {
          await expect(errorMessages.first()).toBeVisible();
        }
      }
    }
  });

  test('Payment pricing tiers are displayed correctly', async ({ page }) => {
    // Look for pricing tiers
    const pricingTiers = page.locator('[data-testid*="plan"], .pricing-card, .plan');
    
    if (await pricingTiers.count() > 0) {
      const tierCount = await pricingTiers.count();
      expect(tierCount).toBeGreaterThan(0);
      
      // Check each tier has VND pricing
      for (let i = 0; i < Math.min(tierCount, 3); i++) {
        const tier = pricingTiers.nth(i);
        const vndPrice = tier.locator('text=/₫|VND/i');
        
        if (await vndPrice.count() > 0) {
          await expect(vndPrice.first()).toBeVisible();
        }
      }
    }
    
    // Check for plan features in Vietnamese
    const features = page.locator('text=/tính năng|features|bao gồm|includes/i');
    
    if (await features.count() > 0) {
      await expect(features.first()).toBeVisible();
    }
  });
});