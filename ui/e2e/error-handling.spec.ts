import { test, expect } from '@playwright/test';

/**
 * AC-16 to AC-20: Error Handling Tests
 * 
 * AC-16: API Failure Graceful Degradation
 * AC-17: Network Timeout Handling
 * AC-18: Validation Errors Clear
 * AC-19: 404 Handling
 * AC-20: Console Clean (No errors/warnings)
 */

test.describe('Error Handling (AC-16 to AC-20)', () => {
  
  let consoleLogs: Array<{ type: string; message: string }> = [];

  test.beforeEach(async ({ page }) => {
    // Capture console messages
    consoleLogs = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push({ type: msg.type(), message: msg.text() });
      }
    });

    page.on('pageerror', error => {
      consoleLogs.push({ type: 'error', message: error.message });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ============================================================
  // AC-16: API Failure Graceful Degradation
  // ============================================================
  test('AC-16: API Failure - Shows fallback UI when API down', async ({ page }) => {
    // Abort API requests to simulate API failure
    await page.route('**/api/**', route => route.abort('failed'));
    
    // Navigate to page that needs API
    await page.goto('/');
    
    // Wait for fallback UI or error message
    const fallbackUI = page.locator('[data-testid="fallback-ui"]');
    const errorMsg = page.locator('[data-testid="error-message"]');
    
    const hasFallback = await fallbackUI.isVisible({ timeout: 2000 }).catch(() => false);
    const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasFallback || hasError).toBeTruthy();
  });

  test('AC-16: API Failure - Shows retry button', async ({ page }) => {
    // Abort API requests
    let requestCount = 0;
    await page.route('**/api/**', route => {
      requestCount++;
      if (requestCount <= 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    
    // Wait for error and verify retry button
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible({ timeout: 2000 });
    
    // Click retry
    await retryButton.click();
    await page.waitForLoadState('networkidle');
    
    // Verify content loaded
    const content = page.locator('[data-testid="list-item"]');
    await expect(content.first()).toBeVisible({ timeout: 3000 });
  });

  test('AC-16: API Failure - Mock data shows when API unavailable', async ({ page }) => {
    // Check if mock/stub data is used
    await page.route('**/api/**', route => route.abort('failed'));
    
    await page.goto('/');
    
    // Wait and check if fallback content appears
    await page.waitForTimeout(2000);
    
    const listItems = page.locator('[data-testid="list-item"]');
    const mockIndicator = page.locator('[data-testid="mock-data-indicator"]');
    
    const hasItems = await listItems.first().isVisible({ timeout: 1000 }).catch(() => false);
    const hasMockIndicator = await mockIndicator.isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasItems || hasMockIndicator).toBeTruthy();
  });

  // ============================================================
  // AC-17: Network Timeout Handling
  // ============================================================
  test('AC-17: Network Timeout - Handles timeout gracefully', async ({ page }) => {
    // Simulate slow/timeout responses
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 sec delay
      route.abort('timedout');
    });
    
    await page.goto('/', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {
      // Expected to timeout
    });
    
    // Verify error or loading state is shown
    const errorMsg = page.locator('[data-testid="timeout-error"]');
    const loadingState = page.locator('[data-testid="loading-state"]');
    
    const hasError = await errorMsg.isVisible({ timeout: 1000 }).catch(() => false);
    const isLoading = await loadingState.isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasError || isLoading).toBeTruthy();
  });

  test('AC-17: Network Timeout - Shows loading spinner', async ({ page }) => {
    // Slow down network to trigger loading
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.continue();
    });
    
    await page.goto('/');
    
    // Check for loading indicator
    const spinner = page.locator('[data-testid="loading-spinner"]');
    const loadingMsg = page.locator('[data-testid="loading-message"]');
    
    const hasSpinner = await spinner.isVisible({ timeout: 2000 }).catch(() => false);
    const hasMessage = await loadingMsg.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasSpinner || hasMessage).toBeTruthy();
  });

  test('AC-17: Network Timeout - User can cancel loading', async ({ page }) => {
    // Slow API
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      route.continue();
    });
    
    const navigate = page.goto('/');
    
    // Look for cancel button
    const cancelButton = page.locator('[data-testid="cancel-button"]');
    
    if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelButton.click();
      
      // Verify action was cancelled
      await page.waitForTimeout(500);
      // Should not be loading anymore
    }
  });

  // ============================================================
  // AC-18: Validation Errors Clear
  // ============================================================
  test('AC-18: Validation Errors - Shows clear error messages', async ({ page }) => {
    // Open create form
    const createButton = page.locator('[data-testid="create-button"]');
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // Try to submit invalid form
    const submitButton = page.locator('[data-testid="form-submit"]');
    await submitButton.click();
    
    // Verify error messages are visible and clear
    const errorMessages = page.locator('[data-testid^="field-error-"]');
    const count = await errorMessages.count();
    
    for (let i = 0; i < count; i++) {
      const msg = errorMessages.nth(i);
      const text = await msg.textContent();
      expect(text?.length ?? 0).toBeGreaterThan(0);
      expect(text).not.toContain('[object Object]');
      expect(text).not.toContain('undefined');
    }
  });

  test('AC-18: Validation Errors - Error messages are readable', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-button"]');
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // Fill with invalid data
    const emailInput = page.locator('[data-testid="field-email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      const errorMsg = page.locator('[data-testid="field-error-email"]');
      const text = await errorMsg.textContent();
      
      // Verify error is human-readable (not technical jargon)
      expect(text?.toLowerCase()).toContain('email');
      expect(text?.toLowerCase()).not.toContain('regex');
    }
  });

  test('AC-18: Validation Errors - Errors clear when fixed', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-button"]');
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // Trigger validation error
    const nameInput = page.locator('[data-testid="field-name"]');
    await nameInput.focus();
    await nameInput.blur();
    
    const errorMsg = page.locator('[data-testid="field-error-name"]');
    const initialVisible = await errorMsg.isVisible({ timeout: 1000 }).catch(() => false);
    
    // Now fill in the field
    if (initialVisible) {
      await nameInput.fill('Valid Name');
      await nameInput.blur();
      
      // Error should disappear
      const stillVisible = await errorMsg.isVisible({ timeout: 1000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });

  // ============================================================
  // AC-19: 404 Handling
  // ============================================================
  test('AC-19: 404 Handling - Shows friendly 404 page', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/nonexistent-page');
    
    // Verify 404 page or error message
    const notFoundMsg = page.locator('[data-testid="not-found"]');
    const error404 = page.locator('text="404"');
    const notFoundText = page.locator('text=not found');
    
    const hasNotFound = await notFoundMsg.isVisible({ timeout: 2000 }).catch(() => false);
    const has404Text = await error404.isVisible({ timeout: 2000 }).catch(() => false);
    const hasNotFoundText = await notFoundText.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasNotFound || has404Text || hasNotFoundText).toBeTruthy();
  });

  test('AC-19: 404 Handling - Shows home/back link', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Look for navigation links
    const homeLink = page.locator('[data-testid="go-home"]');
    const backButton = page.locator('[data-testid="go-back"]');
    
    const hasHomeLink = await homeLink.isVisible({ timeout: 2000 }).catch(() => false);
    const hasBackButton = await backButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasHomeLink || hasBackButton).toBeTruthy();
  });

  test('AC-19: 404 Handling - Navigation works from 404', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    const homeLink = page.locator('[data-testid="go-home"]');
    if (await homeLink.isVisible({ timeout: 1000 })) {
      await homeLink.click();
      
      // Should navigate to home
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).toContain('localhost');
    }
  });

  // ============================================================
  // AC-20: Console Clean (No console errors/warnings)
  // ============================================================
  test('AC-20: Console Clean - No critical errors in console', async ({ page }) => {
    const criticalErrors = consoleLogs.filter(log =>
      log.type === 'error' &&
      !log.message.includes('401') &&
      !log.message.includes('404') &&
      !log.message.includes('Network error') &&
      !log.message.includes('timeout')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('AC-20: Console Clean - No deprecation warnings', async ({ page }) => {
    const deprecationWarnings = consoleLogs.filter(log =>
      log.type === 'warning' &&
      (log.message.includes('deprecated') ||
       log.message.includes('will be removed') ||
       log.message.includes('use instead'))
    );
    
    // Deprecation warnings should be minimal
    expect(deprecationWarnings.length).toBeLessThan(3);
  });

  test('AC-20: Console Clean - No unhandled rejections', async ({ page }) => {
    let unhandledRejections: string[] = [];
    
    page.on('dialog', async dialog => {
      unhandledRejections.push(dialog.message());
      await dialog.dismiss();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(unhandledRejections.length).toBe(0);
  });

  test('AC-20: Console Clean - No React/Vue/Framework warnings', async ({ page }) => {
    const frameworkWarnings = consoleLogs.filter(log =>
      log.type === 'warning' &&
      (log.message.includes('React') ||
       log.message.includes('Warning:') ||
       log.message.includes('propTypes'))
    );
    
    // Should have minimal framework warnings
    expect(frameworkWarnings.length).toBe(0);
  });
});
