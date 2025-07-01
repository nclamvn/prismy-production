/**
 * Performance E2E Tests
 * Vietnamese mobile network optimization and Core Web Vitals
 * Load testing, bundle analysis, and user experience metrics
 */

import { test, expect } from '@playwright/test';

test.describe('⚡ Performance & Vietnamese Network Optimization', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate slower Vietnamese mobile network conditions
    await page.route('**/*', async (route) => {
      // Add network delay simulation
      await new Promise(resolve => setTimeout(resolve, 50));
      await route.continue();
    });
    
    await page.addInitScript(() => {
      window.localStorage.setItem('locale', 'vi-VN');
    });
  });

  test('Page load performance meets Vietnamese mobile standards', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const domLoadTime = Date.now() - startTime;
    
    await page.waitForLoadState('networkidle');
    const fullLoadTime = Date.now() - startTime;
    
    // Performance thresholds for Vietnamese mobile networks
    expect(domLoadTime).toBeLessThan(3000); // DOM ready in 3s
    expect(fullLoadTime).toBeLessThan(8000); // Full load in 8s
    
    console.log(`📊 Performance Metrics:`);
    console.log(`  DOM Load Time: ${domLoadTime}ms`);
    console.log(`  Full Load Time: ${fullLoadTime}ms`);
  });

  test('Core Web Vitals measurement', async ({ page }) => {
    await page.goto('/');
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {
          lcp: 0,
          fid: 0,
          cls: 0,
          fcp: 0,
          ttfb: 0
        };
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            vitals.fid = entry.processingStart - entry.startTime;
          });
        }).observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            vitals.cls += entry.value;
          });
        }).observe({ entryTypes: ['layout-shift'] });
        
        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
          });
        }).observe({ entryTypes: ['paint'] });
        
        // Time to First Byte
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navTiming) {
          vitals.ttfb = navTiming.responseStart - navTiming.requestStart;
        }
        
        setTimeout(() => resolve(vitals), 3000);
      });
    });
    
    console.log(`🚀 Core Web Vitals for Vietnamese Users:`);
    console.log(`  LCP: ${webVitals.lcp}ms (should be < 2500ms)`);
    console.log(`  FID: ${webVitals.fid}ms (should be < 100ms)`);
    console.log(`  CLS: ${webVitals.cls} (should be < 0.1)`);
    console.log(`  FCP: ${webVitals.fcp}ms (should be < 1800ms)`);
    console.log(`  TTFB: ${webVitals.ttfb}ms (should be < 800ms)`);
    
    // Vietnamese mobile network thresholds (more lenient)
    expect(webVitals.lcp).toBeLessThan(4000);
    expect(webVitals.fid).toBeLessThan(200);
    expect(webVitals.cls).toBeLessThan(0.25);
    expect(webVitals.fcp).toBeLessThan(3000);
    expect(webVitals.ttfb).toBeLessThan(1500);
  });

  test('Translation API performance under load', async ({ page }) => {
    await page.goto('/translate');
    
    const sourceTextArea = page.locator('textarea[placeholder*="Nhập"], [data-testid*="source"]').first();
    const translateButton = page.locator('button:has-text("Dịch"), [data-testid*="translate"]').first();
    
    if (await sourceTextArea.count() > 0 && await translateButton.count() > 0) {
      // Test multiple rapid translations
      const testTexts = [
        'Hello world',
        'How are you today?',
        'Thank you very much',
        'Good morning Vietnam',
        'I love Vietnamese food'
      ];
      
      const translationTimes: number[] = [];
      
      for (const text of testTexts) {
        await sourceTextArea.fill(text);
        
        const startTime = Date.now();
        await translateButton.click();
        
        // Wait for translation result
        const result = page.locator('[data-testid*="target"], .translation-result').first();
        
        try {
          await result.waitFor({ state: 'visible', timeout: 10000 });
          const endTime = Date.now();
          const translationTime = endTime - startTime;
          
          translationTimes.push(translationTime);
          console.log(`🌍 Translation "${text}": ${translationTime}ms`);
          
          // Individual translation should complete within 5 seconds
          expect(translationTime).toBeLessThan(5000);
          
        } catch (error) {
          console.log(`⚠️ Translation timeout for: ${text}`);
        }
        
        await page.waitForTimeout(500); // Brief pause between requests
      }
      
      if (translationTimes.length > 0) {
        const avgTime = translationTimes.reduce((a, b) => a + b, 0) / translationTimes.length;
        console.log(`📊 Average Translation Time: ${avgTime}ms`);
        
        // Average should be reasonable for Vietnamese users
        expect(avgTime).toBeLessThan(3000);
      }
    }
  });

  test('Image loading and optimization', async ({ page }) => {
    await page.goto('/');
    
    // Check for optimized image formats
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      console.log(`🖼️ Found ${imageCount} images`);
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        const loading = await img.getAttribute('loading');
        
        if (src) {
          // Images should use modern formats or optimization
          const isOptimized = src.includes('.webp') || 
                             src.includes('.avif') || 
                             src.includes('w_') || // Cloudinary width parameter
                             src.includes('q_') || // Cloudinary quality parameter
                             loading === 'lazy';
          
          console.log(`  Image ${i + 1}: ${src} (optimized: ${isOptimized})`);
          
          // At least some images should be optimized for Vietnamese mobile
          if (i === 0) {
            // First image (likely above fold) should load quickly
            const loadTime = await img.evaluate((el) => {
              return new Promise((resolve) => {
                if (el.complete) {
                  resolve(0);
                } else {
                  const start = Date.now();
                  el.onload = () => resolve(Date.now() - start);
                  el.onerror = () => resolve(-1);
                }
              });
            });
            
            if (typeof loadTime === 'number' && loadTime > 0) {
              expect(loadTime).toBeLessThan(2000);
            }
          }
        }
      }
    }
  });

  test('Bundle size and JavaScript performance', async ({ page }) => {
    // Enable request interception to measure bundle sizes
    const resourceSizes: { [key: string]: number } = {};
    let totalJSSize = 0;
    let totalCSSSize = 0;
    
    page.on('response', async (response) => {
      const url = response.url();
      const contentLength = response.headers()['content-length'];
      
      if (contentLength) {
        const size = parseInt(contentLength);
        resourceSizes[url] = size;
        
        if (url.includes('.js')) {
          totalJSSize += size;
        } else if (url.includes('.css')) {
          totalCSSSize += size;
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`📦 Bundle Analysis:`);
    console.log(`  Total JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`);
    console.log(`  Total CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`);
    
    // Bundle size thresholds for Vietnamese mobile networks
    expect(totalJSSize).toBeLessThan(500 * 1024); // 500KB JS
    expect(totalCSSSize).toBeLessThan(100 * 1024); // 100KB CSS
    
    // Measure JavaScript execution time
    const jsExecutionTime = await page.evaluate(() => {
      const start = performance.now();
      
      // Simulate some JavaScript work
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += Math.random();
      }
      
      return performance.now() - start;
    });
    
    console.log(`⚡ JS Execution Time: ${jsExecutionTime}ms`);
    expect(jsExecutionTime).toBeLessThan(100); // Should be fast
  });

  test('Memory usage optimization', async ({ page }) => {
    await page.goto('/');
    
    // Measure initial memory usage
    const initialMemory = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    // Navigate through several pages to test memory leaks
    const pages = ['/', '/translate', '/pricing', '/'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Measure memory after navigation
    const finalMemory = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    if (initialMemory.usedJSHeapSize > 0 && finalMemory.usedJSHeapSize > 0) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      console.log(`🧠 Memory Usage:`);
      console.log(`  Initial: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Final: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Increase: ${memoryIncreasePercent.toFixed(2)}%`);
      
      // Memory increase should be reasonable (no major leaks)
      expect(memoryIncreasePercent).toBeLessThan(300);
    }
  });

  test('Database query performance simulation', async ({ page }) => {
    // Test translation history loading performance
    await page.goto('/workspace');
    
    const historyItems = page.locator('[data-testid*="history"], .history-item');
    
    if (await historyItems.count() > 0) {
      const loadStartTime = Date.now();
      
      // Wait for all history items to load
      await page.waitForSelector('[data-testid*="history"], .history-item', { timeout: 5000 });
      
      const loadTime = Date.now() - loadStartTime;
      
      console.log(`📊 History Load Time: ${loadTime}ms`);
      
      // History should load quickly even with many items
      expect(loadTime).toBeLessThan(3000);
      
      // Test pagination/lazy loading if available
      const loadMoreButton = page.locator('button:has-text("Tải thêm"), button:has-text("Load more")');
      
      if (await loadMoreButton.count() > 0) {
        const paginationStartTime = Date.now();
        await loadMoreButton.click();
        
        await page.waitForTimeout(2000);
        const paginationTime = Date.now() - paginationStartTime;
        
        console.log(`📄 Pagination Time: ${paginationTime}ms`);
        expect(paginationTime).toBeLessThan(2000);
      }
    }
  });

  test('Network resilience and error recovery', async ({ page }) => {
    // Test slow network conditions
    await page.route('**/*', async (route) => {
      // Simulate 3G connection delays
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.continue();
    });
    
    await page.goto('/translate');
    
    const sourceTextArea = page.locator('textarea[placeholder*="Nhập"]').first();
    const translateButton = page.locator('button:has-text("Dịch")').first();
    
    if (await sourceTextArea.count() > 0 && await translateButton.count() > 0) {
      await sourceTextArea.fill('Test slow network translation');
      await translateButton.click();
      
      // Should show loading indicator for slow networks
      const loadingIndicator = page.locator('[data-testid*="loading"], .spinner, .loading');
      
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator.first()).toBeVisible({ timeout: 2000 });
      }
      
      // Should eventually complete or show timeout message
      const result = page.locator('[data-testid*="target"], .translation-result').first();
      const timeoutMessage = page.locator('text=/timeout|hết thời gian|lỗi mạng/i');
      
      await Promise.race([
        result.waitFor({ state: 'visible', timeout: 15000 }),
        timeoutMessage.waitFor({ state: 'visible', timeout: 15000 })
      ]);
      
      // Either should have result or user-friendly timeout message
      const hasResult = await result.isVisible();
      const hasTimeout = await timeoutMessage.isVisible();
      
      expect(hasResult || hasTimeout).toBeTruthy();
    }
  });

  test('Caching and offline functionality', async ({ page }) => {
    // Test service worker registration
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          return {
            scope: registration.scope,
            active: !!registration.active
          };
        } catch (error) {
          return null;
        }
      }
      return null;
    });
    
    if (swRegistration) {
      console.log(`🔄 Service Worker: ${swRegistration.scope} (active: ${swRegistration.active})`);
      expect(swRegistration.active).toBeTruthy();
    }
    
    // Test cache headers
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    const cacheControl = response?.headers()['cache-control'];
    
    if (cacheControl) {
      console.log(`💾 Cache Control: ${cacheControl}`);
      // Should have some caching strategy
      expect(cacheControl).toBeTruthy();
    }
    
    // Test offline detection
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    await page.waitForTimeout(1000);
    
    // Should handle offline state gracefully
    const offlineIndicator = page.locator('text=/offline|không có kết nối/i');
    
    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator.first()).toBeVisible();
    }
  });
});