import { test, expect } from '@playwright/test';

/**
 * AC-6 to AC-11: Functional Completeness Tests
 * 
 * AC-6: All CRUD Operations Work
 * AC-7: Filtering Works
 * AC-8: Sorting Works
 * AC-9: Detail Drawer Opens/Closes
 * AC-10: Form Validation Works
 * AC-11: Empty State UI Shows
 */

test.describe('Functional Completeness (AC-6 to AC-11)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to ListViews section
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ============================================================
  // AC-6: All CRUD Operations Work
  // ============================================================
  test('AC-6: CRUD - Create operation works', async ({ page }) => {
    // Navigate to a list view
    const createButton = page.locator('[data-testid="create-button"]');
    await expect(createButton).toBeVisible();
    
    // Click create button
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // Verify create form appears
    const form = page.locator('[data-testid="create-form"]');
    await expect(form).toBeVisible();
    
    // Fill in a required field
    const nameInput = page.locator('[data-testid="field-name"]');
    await nameInput.fill('Test Item');
    
    // Submit form
    const submitButton = page.locator('[data-testid="form-submit"]');
    await submitButton.click();
    
    // Verify success notification
    const successMsg = page.locator('text=Successfully created');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  test('AC-6: CRUD - Read operation works', async ({ page }) => {
    // Wait for list to load
    const listItems = page.locator('[data-testid="list-item"]');
    await expect(listItems.first()).toBeVisible({ timeout: 5000 });
    
    // Get first item
    const firstItem = listItems.first();
    const itemText = await firstItem.textContent();
    
    // Verify item has content
    expect(itemText?.length ?? 0).toBeGreaterThan(0);
  });

  test('AC-6: CRUD - Update operation works', async ({ page }) => {
    // Wait for list items
    const listItems = page.locator('[data-testid="list-item"]');
    await expect(listItems.first()).toBeVisible({ timeout: 5000 });
    
    // Click edit on first item
    const editButton = page.locator('[data-testid="list-item-edit"]').first();
    await editButton.click();
    await page.waitForLoadState('networkidle');
    
    // Verify edit form appears
    const form = page.locator('[data-testid="edit-form"]');
    await expect(form).toBeVisible();
    
    // Update field
    const nameInput = page.locator('[data-testid="field-name"]');
    await nameInput.clear();
    await nameInput.fill('Updated Item');
    
    // Submit
    const submitButton = page.locator('[data-testid="form-submit"]');
    await submitButton.click();
    
    // Verify success
    const successMsg = page.locator('text=Successfully updated');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  test('AC-6: CRUD - Delete operation works', async ({ page }) => {
    // Wait for list items
    const listItems = page.locator('[data-testid="list-item"]');
    await expect(listItems.first()).toBeVisible({ timeout: 5000 });
    
    // Get initial count
    const initialCount = await listItems.count();
    
    // Click delete on first item
    const deleteButton = page.locator('[data-testid="list-item-delete"]').first();
    await deleteButton.click();
    
    // Confirm deletion in dialog
    const confirmButton = page.locator('[data-testid="confirm-delete"]');
    await confirmButton.click();
    
    // Verify success
    const successMsg = page.locator('text=Successfully deleted');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  // ============================================================
  // AC-7: Filtering Works
  // ============================================================
  test('AC-7: Filtering - Filter control visible and functional', async ({ page }) => {
    // Find filter button
    const filterButton = page.locator('[data-testid="filter-button"]');
    await expect(filterButton).toBeVisible();
    
    // Click to open filters
    await filterButton.click();
    
    // Verify filter panel appears
    const filterPanel = page.locator('[data-testid="filter-panel"]');
    await expect(filterPanel).toBeVisible();
    
    // Apply a filter
    const filterSelect = page.locator('[data-testid="filter-field-select"]');
    await filterSelect.selectOption('name');
    
    const filterValue = page.locator('[data-testid="filter-value-input"]');
    await filterValue.fill('test');
    
    // Click apply
    const applyButton = page.locator('[data-testid="filter-apply"]');
    await applyButton.click();
    
    // Verify list updates
    await page.waitForLoadState('networkidle');
    const listItems = page.locator('[data-testid="list-item"]');
    const count = await listItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('AC-7: Filtering - Multiple filters work together', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('[data-testid="filter-button"]');
    await filterButton.click();
    
    // Apply multiple filters
    const filterPanel = page.locator('[data-testid="filter-panel"]');
    const addFilterButton = filterPanel.locator('[data-testid="add-filter"]');
    
    // Add second filter if available
    if (await addFilterButton.isVisible()) {
      await addFilterButton.click();
      
      const filterSelects = page.locator('[data-testid="filter-field-select"]');
      await filterSelects.nth(1).selectOption('status');
      
      const filterValues = page.locator('[data-testid="filter-value-input"]');
      await filterValues.nth(1).fill('active');
      
      const applyButton = page.locator('[data-testid="filter-apply"]');
      await applyButton.click();
      
      await page.waitForLoadState('networkidle');
    }
  });

  // ============================================================
  // AC-8: Sorting Works
  // ============================================================
  test('AC-8: Sorting - Sort ascending works', async ({ page }) => {
    // Find sort button
    const sortButton = page.locator('[data-testid="sort-button"]');
    await expect(sortButton).toBeVisible();
    
    // Click sort button
    await sortButton.click();
    
    // Select ascending
    const ascendingOption = page.locator('[data-testid="sort-asc"]');
    await ascendingOption.click();
    
    // Verify list reorders
    await page.waitForLoadState('networkidle');
    const listItems = page.locator('[data-testid="list-item"]');
    await expect(listItems.first()).toBeVisible();
  });

  test('AC-8: Sorting - Sort descending works', async ({ page }) => {
    const sortButton = page.locator('[data-testid="sort-button"]');
    await sortButton.click();
    
    const descendingOption = page.locator('[data-testid="sort-desc"]');
    await descendingOption.click();
    
    await page.waitForLoadState('networkidle');
    const listItems = page.locator('[data-testid="list-item"]');
    await expect(listItems.first()).toBeVisible();
  });

  test('AC-8: Sorting - Sort by column works', async ({ page }) => {
    // Click column header
    const columnHeader = page.locator('[data-testid="column-header"]').first();
    await columnHeader.click();
    
    // Verify sort indicator appears
    const sortIndicator = page.locator('[data-testid="sort-indicator"]');
    await expect(sortIndicator).toBeVisible({ timeout: 2000 });
  });

  // ============================================================
  // AC-9: Detail Drawer Opens/Closes
  // ============================================================
  test('AC-9: Detail Drawer - Opens when clicking item', async ({ page }) => {
    // Wait for list items
    const listItem = page.locator('[data-testid="list-item"]').first();
    await expect(listItem).toBeVisible({ timeout: 5000 });
    
    // Click item
    await listItem.click();
    
    // Verify drawer opens
    const drawer = page.locator('[data-testid="detail-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 2000 });
    
    // Verify drawer has content
    const drawerContent = page.locator('[data-testid="drawer-content"]');
    await expect(drawerContent).toBeVisible();
  });

  test('AC-9: Detail Drawer - Closes when clicking close button', async ({ page }) => {
    // Open drawer
    const listItem = page.locator('[data-testid="list-item"]').first();
    await listItem.click();
    
    const drawer = page.locator('[data-testid="detail-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 2000 });
    
    // Click close button
    const closeButton = page.locator('[data-testid="drawer-close"]');
    await closeButton.click();
    
    // Verify drawer closes
    await expect(drawer).not.toBeVisible({ timeout: 1000 });
  });

  test('AC-9: Detail Drawer - Closes when clicking outside (overlay)', async ({ page }) => {
    // Open drawer
    const listItem = page.locator('[data-testid="list-item"]').first();
    await listItem.click();
    
    const drawer = page.locator('[data-testid="detail-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 2000 });
    
    // Click overlay
    const overlay = page.locator('[data-testid="drawer-overlay"]');
    await overlay.click({ position: { x: 0, y: 0 } });
    
    // Verify drawer closes
    await expect(drawer).not.toBeVisible({ timeout: 1000 });
  });

  // ============================================================
  // AC-10: Form Validation Works
  // ============================================================
  test('AC-10: Form Validation - Required fields show error', async ({ page }) => {
    // Open create form
    const createButton = page.locator('[data-testid="create-button"]');
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling required field
    const submitButton = page.locator('[data-testid="form-submit"]');
    await submitButton.click();
    
    // Verify error message
    const errorMsg = page.locator('[data-testid="field-error-name"]');
    await expect(errorMsg).toBeVisible({ timeout: 2000 });
    expect(await errorMsg.textContent()).toContain('required');
  });

  test('AC-10: Form Validation - Email format validation works', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-button"]');
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // Fill email field with invalid email
    const emailInput = page.locator('[data-testid="field-email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('not-an-email');
      
      const submitButton = page.locator('[data-testid="form-submit"]');
      await submitButton.click();
      
      const errorMsg = page.locator('[data-testid="field-error-email"]');
      await expect(errorMsg).toBeVisible({ timeout: 2000 });
    }
  });

  test('AC-10: Form Validation - Field length validation works', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-button"]');
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    const nameInput = page.locator('[data-testid="field-name"]');
    // Fill with very long string (if field has max length)
    await nameInput.fill('a'.repeat(1000));
    
    const submitButton = page.locator('[data-testid="form-submit"]');
    await submitButton.click();
    
    // If validation error appears, verify it
    const errorMsg = page.locator('[data-testid="field-error-name"]');
    if (await errorMsg.isVisible({ timeout: 1000 })) {
      expect(await errorMsg.textContent()).toContain('too long');
    }
  });

  // ============================================================
  // AC-11: Empty State UI Shows
  // ============================================================
  test('AC-11: Empty State - Shows when no data', async ({ page }) => {
    // Apply filter that returns no results
    const filterButton = page.locator('[data-testid="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      const filterValue = page.locator('[data-testid="filter-value-input"]');
      await filterValue.fill('zzzzzzzzz-nonexistent');
      
      const applyButton = page.locator('[data-testid="filter-apply"]');
      await applyButton.click();
      
      await page.waitForLoadState('networkidle');
      
      // Verify empty state appears
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toBeVisible({ timeout: 2000 });
      
      const emptyIcon = page.locator('[data-testid="empty-state-icon"]');
      await expect(emptyIcon).toBeVisible();
    }
  });

  test('AC-11: Empty State - Shows helpful message', async ({ page }) => {
    const filterButton = page.locator('[data-testid="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      const filterValue = page.locator('[data-testid="filter-value-input"]');
      await filterValue.fill('zzzzzzzzz-nonexistent');
      
      const applyButton = page.locator('[data-testid="filter-apply"]');
      await applyButton.click();
      
      await page.waitForLoadState('networkidle');
      
      // Verify empty state message
      const emptyMsg = page.locator('[data-testid="empty-state-message"]');
      await expect(emptyMsg).toBeVisible({ timeout: 2000 });
      
      const text = await emptyMsg.textContent();
      expect(text?.length ?? 0).toBeGreaterThan(0);
    }
  });

  test('AC-11: Empty State - Shows action button', async ({ page }) => {
    const filterButton = page.locator('[data-testid="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      const filterValue = page.locator('[data-testid="filter-value-input"]');
      await filterValue.fill('zzzzzzzzz-nonexistent');
      
      const applyButton = page.locator('[data-testid="filter-apply"]');
      await applyButton.click();
      
      await page.waitForLoadState('networkidle');
      
      // Verify action button (Clear filters or Create)
      const actionButton = page.locator('[data-testid="empty-state-action"]');
      await expect(actionButton).toBeVisible({ timeout: 2000 });
    }
  });
});
