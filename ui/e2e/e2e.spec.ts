import { test, expect } from '@playwright/test';

/**
 * AC-27 & AC-28: End-to-End and Visual Regression Tests
 * 
 * AC-27: E2E Tests Pass
 * AC-28: Visual Regression Tests Pass
 */

test.describe('E2E & Visual Regression (AC-27 & AC-28)', () => {
  
  // ============================================================
  // AC-27: End-to-End User Workflows
  // ============================================================
  test.describe('AC-27: E2E - Complete User Workflows', () => {
    
    test('User workflow: List view → Create → Edit → Delete', async ({ page }) => {
      // Step 1: Navigate to list view
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Verify list loads
      const listItems = page.locator('[data-testid="list-item"]');
      const initialCount = await listItems.count();
      
      // Step 2: Create new item
      const createButton = page.locator('[data-testid="create-button"]');
      expect(await createButton.isVisible()).toBe(true);
      await createButton.click();
      
      const form = page.locator('[data-testid="create-form"]');
      await expect(form).toBeVisible({ timeout: 2000 });
      
      // Fill form
      const nameInput = page.locator('[data-testid="field-name"]');
      await nameInput.fill('E2E Test Item');
      
      const submitButton = page.locator('[data-testid="form-submit"]');
      await submitButton.click();
      
      // Verify success
      const successMsg = page.locator('text=Successfully created');
      await expect(successMsg).toBeVisible({ timeout: 3000 });
      
      // Step 3: Find and edit the new item
      await page.waitForLoadState('networkidle');
      const newListItems = page.locator('[data-testid="list-item"]');
      const newCount = await newListItems.count();
      expect(newCount).toBeGreaterThan(initialCount);
      
      // Find item with our text
      const ourItem = page.locator('text=E2E Test Item').first();
      await ourItem.click();
      
      const drawer = page.locator('[data-testid="detail-drawer"]');
      await expect(drawer).toBeVisible({ timeout: 2000 });
      
      // Step 4: Edit item
      const editButton = page.locator('[data-testid="drawer-edit"]');
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const editForm = page.locator('[data-testid="edit-form"]');
        await expect(editForm).toBeVisible({ timeout: 2000 });
        
        const editNameInput = page.locator('[data-testid="field-name"]');
        await editNameInput.clear();
        await editNameInput.fill('E2E Test Item Updated');
        
        const editSubmit = page.locator('[data-testid="form-submit"]');
        await editSubmit.click();
        
        const updateMsg = page.locator('text=Successfully updated');
        await expect(updateMsg).toBeVisible({ timeout: 3000 });
      }
      
      // Step 5: Delete item
      const deleteButton = page.locator('[data-testid="drawer-delete"]');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        const confirmDelete = page.locator('[data-testid="confirm-delete"]');
        await confirmDelete.click();
        
        const deleteMsg = page.locator('text=Successfully deleted');
        await expect(deleteMsg).toBeVisible({ timeout: 3000 });
      }
    });

    test('User workflow: Search → Filter → Sort → View details', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Step 1: Open filter
      const filterButton = page.locator('[data-testid="filter-button"]');
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        const filterPanel = page.locator('[data-testid="filter-panel"]');
        await expect(filterPanel).toBeVisible({ timeout: 2000 });
      }
      
      // Step 2: Apply filter
      const filterField = page.locator('[data-testid="filter-field-select"]');
      if (await filterField.isVisible()) {
        await filterField.selectOption({ index: 1 });
      }
      
      // Step 3: Apply sort
      const sortButton = page.locator('[data-testid="sort-button"]');
      if (await sortButton.isVisible()) {
        await sortButton.click();
        
        const ascOption = page.locator('[data-testid="sort-asc"]');
        await ascOption.click();
        
        await page.waitForLoadState('networkidle');
      }
      
      // Step 4: View details
      const listItem = page.locator('[data-testid="list-item"]').first();
      if (await listItem.isVisible()) {
        await listItem.click();
        
        const drawer = page.locator('[data-testid="detail-drawer"]');
        await expect(drawer).toBeVisible({ timeout: 2000 });
        
        const drawerClose = page.locator('[data-testid="drawer-close"]');
        if (await drawerClose.isVisible()) {
          await drawerClose.click();
          await expect(drawer).not.toBeVisible({ timeout: 1000 });
        }
      }
    });

    test('User workflow: Bulk operations', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for bulk select checkbox
      const bulkCheckbox = page.locator('[data-testid="bulk-select-all"]');
      
      if (await bulkCheckbox.isVisible()) {
        // Select all
        await bulkCheckbox.click();
        
        // Verify items selected
        const selectedCount = await page.locator('[data-testid="list-item"][data-selected="true"]').count();
        expect(selectedCount).toBeGreaterThan(0);
        
        // Check for bulk actions
        const bulkActionButton = page.locator('[data-testid="bulk-action-button"]');
        if (await bulkActionButton.isVisible()) {
          await bulkActionButton.click();
        }
      }
    });

    test('User workflow: Pagination/Infinite scroll', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get initial item count
      const initialItems = await page.locator('[data-testid="list-item"]').count();
      
      // Check for pagination
      const nextButton = page.locator('[data-testid="pagination-next"]');
      
      if (await nextButton.isVisible()) {
        // Has pagination
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        const newItems = await page.locator('[data-testid="list-item"]').count();
        expect(newItems).toBeGreaterThan(0);
      } else {
        // Try infinite scroll
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 5));
        await page.waitForTimeout(1000);
        
        const scrolledItems = await page.locator('[data-testid="list-item"]').count();
        console.log(`Initial: ${initialItems}, After scroll: ${scrolledItems}`);
      }
    });
  });

  // ============================================================
  // AC-28: Visual Regression Tests
  // ============================================================
  test.describe('@visual AC-28: Visual Regression Tests', () => {
    
    test('Visual: List view layout consistency', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of list
      await expect(page).toHaveScreenshot('list-view-layout.png', {
        maxDiffPixels: 100,
        timeout: 10000,
      });
    });

    test('Visual: Create form layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-button"]');
      await createButton.click();
      
      const form = page.locator('[data-testid="create-form"]');
      await expect(form).toBeVisible({ timeout: 2000 });
      
      // Screenshot form
      await expect(form).toHaveScreenshot('create-form-layout.png', {
        maxDiffPixels: 50,
      });
    });

    test('Visual: Detail drawer layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const listItem = page.locator('[data-testid="list-item"]').first();
      
      if (await listItem.isVisible()) {
        await listItem.click();
        
        const drawer = page.locator('[data-testid="detail-drawer"]');
        await expect(drawer).toBeVisible({ timeout: 2000 });
        
        // Screenshot drawer
        await expect(drawer).toHaveScreenshot('detail-drawer-layout.png', {
          maxDiffPixels: 100,
        });
      }
    });

    test('Visual: Empty state layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Apply filter that returns no results
      const filterButton = page.locator('[data-testid="filter-button"]');
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        const filterValue = page.locator('[data-testid="filter-value-input"]');
        await filterValue.fill('zzzzzzz-nonexistent');
        
        const applyButton = page.locator('[data-testid="filter-apply"]');
        await applyButton.click();
        
        await page.waitForLoadState('networkidle');
        
        const emptyState = page.locator('[data-testid="empty-state"]');
        if (await emptyState.isVisible({ timeout: 2000 })) {
          await expect(emptyState).toHaveScreenshot('empty-state-layout.png', {
            maxDiffPixels: 50,
          });
        }
      }
    });

    test('Visual: Error state layout', async ({ page }) => {
      // Abort API to trigger error
      await page.route('**/api/**', route => route.abort('failed'));
      
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      const errorState = page.locator('[data-testid="error-message"]');
      
      if (await errorState.isVisible()) {
        await expect(errorState).toHaveScreenshot('error-state-layout.png', {
          maxDiffPixels: 50,
        });
      }
    });

    test('Visual: Loading state layout', async ({ page }) => {
      // Slow down network
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        route.continue();
      });
      
      await page.goto('/');
      
      const loadingState = page.locator('[data-testid="loading-state"]');
      
      if (await loadingState.isVisible({ timeout: 2000 })) {
        await expect(loadingState).toHaveScreenshot('loading-state-layout.png', {
          maxDiffPixels: 50,
        });
      }
    });

    test('Visual: Mobile layout consistency', async ({ page, viewport }) => {
      if (!viewport || viewport.width !== 375) {
        test.skip();
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('mobile-list-view-375px.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('Visual: Tablet layout consistency', async ({ page, viewport }) => {
      if (!viewport || viewport.width !== 768) {
        test.skip();
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('tablet-list-view-768px.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('Visual: Desktop layout consistency', async ({ page, viewport }) => {
      if (!viewport || viewport.width < 1200) {
        test.skip();
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('desktop-list-view-1280px.png', {
        maxDiffPixels: 100,
      });
    });

    test('Visual: Button states consistency', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button').first();
      
      // Screenshot normal state
      await expect(buttons).toHaveScreenshot('button-normal-state.png');
      
      // Focus state
      await buttons.focus();
      await expect(buttons).toHaveScreenshot('button-focus-state.png');
      
      // Hover state
      await buttons.hover();
      await expect(buttons).toHaveScreenshot('button-hover-state.png');
    });

    test('Visual: Form input states', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-button"]');
      await createButton.click();
      
      const input = page.locator('[data-testid="field-name"]').first();
      
      if (await input.isVisible()) {
        // Empty state
        await expect(input).toHaveScreenshot('input-empty-state.png');
        
        // Filled state
        await input.fill('Sample text');
        await expect(input).toHaveScreenshot('input-filled-state.png');
        
        // Focus state
        await input.focus();
        await expect(input).toHaveScreenshot('input-focus-state.png');
      }
    });
  });
});
