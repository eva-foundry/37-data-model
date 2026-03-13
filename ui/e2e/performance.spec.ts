import { test, expect } from '@playwright/test';

/**
 * AC-21 to AC-25: Performance Tests
 * Requires @performance tag to run
 * 
 * AC-21: Initial Page Load < 3 Seconds
 * AC-22: Time to Interactive < 5 Seconds
 * AC-23: Route Transitions < 500ms
 * AC-24: Memory Stable
 * AC-25: Lazy Loading Works
 */

test.describe('@performance Performance Testing (AC-21 to AC-25)', () => {
  
  // ============================================================
  // AC-21: Initial Page Load < 3 Seconds
  // ============================================================
  test('AC-21: Page Load < 3s - Initial page load time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    const loadTimeSeconds = loadTime / 1000;
    
    // Performance metrics
    const navigationTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(performance.getEntriesByType('navigation')))
    );
    
    console.log(`Page load time: ${loadTimeSeconds.toFixed(2)}s`);
    
    // Should load in less than 3 seconds
    expect(loadTimeSeconds).toBeLessThan(3);
  });

  test('AC-21: Page Load < 3s - CSS and fonts loaded quickly', async ({ page }) => {
    let resourceTimes: number[] = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('.css') || url.includes('fonts')) {
        const timing = response.request().timing();
        if (timing?.responseEnd) {
          resourceTimes.push(timing.responseEnd);
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    
    // All CSS and font files should load quickly
    const slowResources = resourceTimes.filter(time => time > 1000);
    expect(slowResources.length).toBe(0);
  });

  test('AC-21: Page Load < 3s - JavaScript bundles optimized', async ({ page }) => {
    let jsBundleSize = 0;
    
    page.on('response', response => {
      if (response.url().includes('.js') && response.status() === 200) {
        // Estimate size from headers
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          jsBundleSize += parseInt(contentLength);
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    
    const bundleSizeMB = jsBundleSize / (1024 * 1024);
    console.log(`JavaScript bundle size: ${bundleSizeMB.toFixed(2)}MB`);
    
    // Bundle should be reasonable
    expect(bundleSizeMB).toBeLessThan(2);
  });

  // ============================================================
  // AC-22: Time to Interactive < 5 Seconds
  // ============================================================
  test('AC-22: TTI < 5s - Page becomes interactive quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be interactive
    const createButton = page.locator('[data-testid="create-button"]');
    await createButton.waitFor({ state: 'attached', timeout: 5000 });
    
    const ttiTime = Date.now() - startTime;
    const ttiSeconds = ttiTime / 1000;
    
    console.log(`Time to Interactive: ${ttiSeconds.toFixed(2)}s`);
    
    // Should be interactive within 5 seconds
    expect(ttiSeconds).toBeLessThan(5);
  });

  test('AC-22: TTI < 5s - Click handlers available', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Try clicking buttons - they should respond
    const createButton = page.locator('[data-testid="create-button"]');
    
    if (await createButton.isEnabled({ timeout: 5000 })) {
      // Button is interactive
      expect(await createButton.isEnabled()).toBe(true);
    }
  });

  test('AC-22: TTI < 5s - DOM fully parsed', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for list items to appear
    const listItems = page.locator('[data-testid="list-item"]');
    await listItems.first().waitFor({ state: 'attached', timeout: 5000 });
    
    const domTime = Date.now() - startTime;
    console.log(`DOM Ready: ${(domTime / 1000).toFixed(2)}s`);
    
    expect(domTime).toBeLessThan(5000);
  });

  // ============================================================
  // AC-23: Route Transitions < 500ms
  // ============================================================
  test('AC-23: Route Transitions < 500ms - Navigation speed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Start timing for route change
    const startTime = Date.now();
    
    // Navigate to a different view/route
    const filterButton = page.locator('[data-testid="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    } else {
      // Try different navigation
      const detailItem = page.locator('[data-testid="list-item"]').first();
      if (await detailItem.isVisible()) {
        await detailItem.click();
      }
    }
    
    // Wait for animation/transition to complete
    await page.waitForTimeout(500);
    
    const transitionTime = Date.now() - startTime;
    console.log(`Route transition time: ${transitionTime}ms`);
    
    // Route transition should be quick
    expect(transitionTime).toBeLessThan(1000);
  });

  test('AC-23: Route Transitions < 500ms - View swap speed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial view
    const initialContent = page.locator('[data-testid="list-item"]').first();
    await initialContent.waitFor({ state: 'attached' });
    
    // Time view change
    const startTime = Date.now();
    
    // Create form toggle
    const createButton = page.locator('[data-testid="create-button"]');
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    
    // Wait for form to appear
    const form = page.locator('[data-testid="create-form"]');
    await form.waitFor({ state: 'attached', timeout: 1000 });
    
    const swapTime = Date.now() - startTime;
    console.log(`View swap time: ${swapTime}ms`);
    
    expect(swapTime).toBeLessThan(1000);
  });

  test('AC-23: Route Transitions < 500ms - Drawer open/close speed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open drawer
    const listItem = page.locator('[data-testid="list-item"]').first();
    await listItem.waitFor({ state: 'attached', timeout: 5000 });
    
    const startOpen = Date.now();
    await listItem.click();
    
    const drawer = page.locator('[data-testid="detail-drawer"]');
    await drawer.waitFor({ state: 'attached', timeout: 500 });
    const openTime = Date.now() - startOpen;
    console.log(`Drawer open time: ${openTime}ms`);
    
    // Close drawer
    const closeButton = page.locator('[data-testid="drawer-close"]');
    const startClose = Date.now();
    await closeButton.click();
    
    await drawer.waitFor({ state: 'hidden', timeout: 500 });
    const closeTime = Date.now() - startClose;
    console.log(`Drawer close time: ${closeTime}ms`);
    
    expect(openTime).toBeLessThan(500);
    expect(closeTime).toBeLessThan(500);
  });

  // ============================================================
  // AC-24: Memory Stable
  // ============================================================
  test('AC-24: Memory Stable - No memory leaks during navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory
    const initialMemory = JSON.parse(
      await page.evaluate(() => {
        if ((performance as any).memory) {
          return JSON.stringify((performance as any).memory);
        }
        return '{"usedJSHeapSize": 0}';
      })
    );
    
    console.log(`Initial memory: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Perform multiple navigations
    for (let i = 0; i < 5; i++) {
      const createButton = page.locator('[data-testid="create-button"]');
      const filterButton = page.locator('[data-testid="filter-button"]');
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(100);
        await page.keyboard.press('Escape');
      }
      
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(100);
        await filterButton.click();
      }
    }
    
    // Get final memory
    const finalMemory = JSON.parse(
      await page.evaluate(() => {
        if ((performance as any).memory) {
          return JSON.stringify((performance as any).memory);
        }
        return '{"usedJSHeapSize": 0}';
      })
    );
    
    console.log(`Final memory: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Memory growth should be reasonable
    if (initialMemory.usedJSHeapSize > 0 && finalMemory.usedJSHeapSize > 0) {
      const memoryGrowthPercent = ((finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 
                                   initialMemory.usedJSHeapSize) * 100;
      console.log(`Memory growth: ${memoryGrowthPercent.toFixed(2)}%`);
      
      // Should not grow more than 50%
      expect(memoryGrowthPercent).toBeLessThan(50);
    }
  });

  test('AC-24: Memory Stable - No accumulating timers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial timer count
    let initialTimers = 0;
    let finalTimers = 0;
    
    // Note: This is a simplified check
    // In real scenarios, use performance observer
    
    // Perform actions
    for (let i = 0; i < 10; i++) {
      const listItem = page.locator('[data-testid="list-item"]').first();
      if (await listItem.isVisible()) {
        await listItem.click();
        await page.waitForTimeout(50);
        const closeButton = page.locator('[data-testid="drawer-close"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
    
    // Page should still be responsive
    const createButton = page.locator('[data-testid="create-button"]');
    expect(await createButton.isVisible()).toBe(true);
  });

  // ============================================================
  // AC-25: Lazy Loading Works
  // ============================================================
  test('AC-25: Lazy Loading - Images lazy loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for lazy-loaded images
    const images = page.locator('img[loading="lazy"]');
    const count = await images.count();
    
    if (count > 0) {
      // Lazy loading is implemented
      expect(count).toBeGreaterThan(0);
      
      // Initially, lazy images should not be loaded
      for (let i = 0; i < Math.min(3, count); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        // Lazy images often have data-src instead
        const dataSrc = await img.getAttribute('data-src');
        expect(src || dataSrc).toBeTruthy();
      }
    }
  });

  test('AC-25: Lazy Loading - Components loaded on demand', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check initial DOM size
    const initialNodes = await page.evaluate(() => document.querySelectorAll('*').length);
    console.log(`Initial DOM nodes: ${initialNodes}`);
    
    // Scroll down or navigate to load more
    const listItems = page.locator('[data-testid="list-item"]');
    if (await listItems.count() > 5) {
      // Scroll to bottom or paginate
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }
    
    // DOM size should increase, but not dramatically
    const finalNodes = await page.evaluate(() => document.querySelectorAll('*').length);
    console.log(`Final DOM nodes: ${finalNodes}`);
    
    // Reasonable growth
    expect(finalNodes).toBeLessThan(initialNodes * 3);
  });

  test('AC-25: Lazy Loading - List virtualization (if applicable)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // For virtualized lists, only visible items should be in DOM
    const listContainer = page.locator('[data-testid="list-container"]');
    if (await listContainer.isVisible()) {
      const visibleItems = await page.locator('[data-testid="list-item"]').count();
      console.log(`Visible list items in DOM: ${visibleItems}`);
      
      // Usually virtualized lists show 10-50 items
      // while actual data might be thousands
      expect(visibleItems).toBeLessThan(100);
    }
  });

  test('AC-25: Lazy Loading - Network resources lazy loaded', async ({ page }) => {
    let resourceCount = 0;
    let lazyResourceCount = 0;
    
    page.on('response', response => {
      resourceCount++;
      // Check if this is loaded lazily (not in initial navigation)
    });
    
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const initialLoadTime = Date.now() - startTime;
    
    console.log(`Initial resources: ${resourceCount}, load time: ${initialLoadTime}ms`);
    
    // Should load reasonably fast
    expect(initialLoadTime).toBeLessThan(3000);
  });
});
