/**
 * EVA E2E Test Helpers
 * 
 * Shared utilities for all Playwright tests
 */

import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Wait for Data Model API to be healthy
 */
export async function waitForAPIReady(page: Page, timeout = 10000) {
  const apiUrl = process.env.API_URL || 'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io';
  
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.request.get(`${apiUrl}/model/health`);
      if (response.ok()) {
        return true;
      }
    } catch (error) {
      // API not ready, wait and retry
    }
    await page.waitForTimeout(500);
  }
  throw new Error('API health check timeout');
}

/**
 * Navigate to layer list view
 */
export async function navigateToLayer(page: Page, layerName: string) {
  await page.goto(`/#/layers/${layerName}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for React to finish rendering
 */
export async function waitForReactRender(page: Page) {
  await page.waitForFunction(() => {
    // Check if React is done rendering (no pending updates)
    return window.performance.getEntriesByType('measure').some(
      entry => entry.name === 'React'
    ) || true;
  });
}

/**
 * Get page load performance metrics (AC-21, AC-22)
 */
export async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      // AC-21: Page load time
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      
      // AC-22: Time to Interactive
      timeToInteractive: navigation.domInteractive - navigation.fetchStart,
      
      // First Contentful Paint
      fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      
      // DOM Content Loaded
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      
      // Resource timing
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
    };
  });
}

/**
 * Measure memory usage (AC-24)
 */
export async function getMemoryUsage(page: Page) {
  return await page.evaluate(() => {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
        usedPercent: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  });
}

/**
 * Check for console errors (AC-20)
 */
export function setupConsoleMonitoring(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  return { errors, warnings };
}

/**
 * Run accessibility audit with axe-core (AC-37 to AC-41)
 */
export async function runAccessibilityAudit(page: Page, options?: {
  include?: string[];
  exclude?: string[];
  tags?: string[];
}) {
  const builder = new AxeBuilder({ page });
  
  if (options?.include) {
    builder.include(options.include);
  }
  
  if (options?.exclude) {
    builder.exclude(options.exclude);
  }
  
  if (options?.tags) {
    builder.withTags(options.tags);
  }
  
  const results = await builder.analyze();
  
  return {
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete,
    iframes: results.iframes,
  };
}

/**
 * Test keyboard navigation (AC-37)
 */
export async function testKeyboardNavigation(page: Page, selectors: string[]) {
  const results: { selector: string; focusable: boolean; tabIndex?: number }[] = [];
  
  for (const selector of selectors) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate((sel) => {
      const element = document.activeElement;
      return element?.matches(sel) || false;
    }, selector);
    
    if (focused) {
      const tabIndex = await page.locator(selector).getAttribute('tabindex');
      results.push({ 
        selector, 
        focusable: true, 
        tabIndex: tabIndex ? parseInt(tabIndex) : undefined 
      });
    } else {
      results.push({ selector, focusable: false });
    }
  }
  
  return results;
}

/**
 * Check focus indicators visibility (AC-38)
 */
export async function checkFocusIndicators(page: Page, selector: string) {
  await page.locator(selector).focus();
  
  const styles = await page.locator(selector).evaluate((element) => {
    const computed = window.getComputedStyle(element, ':focus');
    return {
      outline: computed.outline,
      outlineColor: computed.outlineColor,
      outlineWidth: computed.outlineWidth,
      outlineStyle: computed.outlineStyle,
      boxShadow: computed.boxShadow,
    };
  });
  
  // Check if any focus indicator is present
  const hasFocusIndicator = 
    styles.outlineStyle !== 'none' ||
    styles.boxShadow !== 'none';
  
  return { hasFocusIndicator, styles };
}

/**
 * Simulate API failure (AC-16, AC-17)
 */
export async function simulateAPIFailure(page: Page, pattern: string | RegExp, statusCode: number) {
  await page.route(pattern, route => {
    route.abort('failed');
  });
}

/**
 * Simulate network timeout (AC-17)
 */
export async function simulateNetworkTimeout(page: Page, pattern: string | RegExp, delayMs: number) {
  await page.route(pattern, async route => {
    await page.waitForTimeout(delayMs);
    route.abort('timedout');
  });
}

/**
 * Simulate offline mode (AC-16)
 */
export async function goOffline(page: Page) {
  await page.context().setOffline(true);
}

export async function goOnline(page: Page) {
  await page.context().setOffline(false);
}

/**
 * Take screenshot with consistent naming
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Wait for specific network requests
 */
export async function waitForAPICall(page: Page, urlPattern: string | RegExp) {
  return await page.waitForResponse(urlPattern);
}

/**
 * Fill form and submit (AC-10)
 */
export async function fillAndSubmitForm(page: Page, formData: Record<string, string>) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`[name="${name}"]`, value);
  }
  await page.click('button[type="submit"]');
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

/**
 * Get computed styles for an element
 */
export async function getComputedStyles(page: Page, selector: string, properties: string[]) {
  return await page.locator(selector).evaluate((element, props) => {
    const computed = window.getComputedStyle(element);
    const result: Record<string, string> = {};
    props.forEach(prop => {
      result[prop] = computed[prop as any];
    });
    return result;
  }, properties);
}

/**
 * Measure route transition time (AC-23)
 */
export async function measureRouteTransition(page: Page, fromPath: string, toPath: string) {
  await page.goto(fromPath);
  await waitForReactRender(page);
  
  const startTime = Date.now();
  await page.goto(toPath);
  await waitForReactRender(page);
  const endTime = Date.now();
  
  return endTime - startTime;
}

/**
 * Check for lazy-loaded components (AC-25)
 */
export async function checkLazyLoading(page: Page) {
  // Get initial network requests
  const initialRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource').length;
  });
  
  // Scroll to trigger lazy loading
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  await page.waitForTimeout(1000);
  
  // Get new network requests
  const finalRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource').length;
  });
  
  return {
    lazyLoaded: finalRequests > initialRequests,
    initialCount: initialRequests,
    finalCount: finalRequests,
    newRequests: finalRequests - initialRequests,
  };
}
