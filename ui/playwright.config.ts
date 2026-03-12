import { defineConfig, devices } from '@playwright/test';

/**
 * EVA Data Model UI - Playwright E2E Test Configuration
 * 
 * Supports all 51 acceptance criteria automation:
 * - Functional testing (CRUD, filtering, sorting)
 * - Error handling (API failures, timeouts, 404)
 * - Performance testing (page load, TTI, memory)
 * - Cross-browser (Chrome, Firefox, Edge, Safari/Webkit)
 * - Accessibility (keyboard nav, screen reader, axe-core)
 * - Visual regression (screenshot comparison)
 */

export default defineConfig({
  testDir: './e2e',
  
  // Maximum time one test can run
  timeout: 60 * 1000,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for all tests
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Emulates user timezone
    timezoneId: 'America/Toronto',
    
    // Emulates user locale
    locale: 'en-US',
    
    // Permissions
    permissions: ['clipboard-read', 'clipboard-write'],
    
    // Viewport (default for desktop)
    viewport: { width: 1280, height: 720 },
  },
  
  // Configure projects for major browsers and devices
  projects: [
    // ============================================================
    // Desktop Browsers (AC-31, AC-32, AC-33, AC-34)
    // ============================================================
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    // ============================================================
    // Mobile Devices (AC-35)
    // ============================================================
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    {
      name: 'mobile-android',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    // ============================================================
    // Tablet Devices (AC-36)
    // ============================================================
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
      },
    },
    
    {
      name: 'tablet-landscape',
      use: {
        ...devices['iPad Pro landscape'],
        viewport: { width: 1024, height: 768 },
      },
    },
    
    // ============================================================
    // Accessibility Testing Project (AC-37 to AC-41)
    // ============================================================
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Enable keyboard navigation testing
        hasTouch: false,
        // Emulate screen reader user preferences
        reducedMotion: 'reduce',
        forcedColors: 'none',
      },
      grep: /@accessibility/,
    },
    
    // ============================================================
    // Performance Testing Project (AC-21 to AC-25)
    // ============================================================
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slower network for performance testing
        offline: false,
        // Enable performance profiling
        trace: 'on',
      },
      grep: /@performance/,
    },
    
    // ============================================================
    // Visual Regression Testing (AC-28)
    // ============================================================
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent viewport for visual tests
        viewport: { width: 1280, height: 720 },
      },
      grep: /@visual/,
    },
  ],
  
  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  // Folder for test artifacts
  outputDir: 'test-results',
  
  // Visual comparison settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
});
