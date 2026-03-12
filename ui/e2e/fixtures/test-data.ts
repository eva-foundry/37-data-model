/**
 * Test Fixtures - Shared test data and mock responses
 */

/**
 * Sample layers for testing
 */
export const testLayers = [
  'projects',
  'wbs',
  'sprints',
  'stories',
  'tasks',
  'evidence',
  'decisions',
  'risks',
  'quality_gates',
  'verification_records',
];

/**
 * Sample project data for CRUD testing (AC-6)
 */
export const mockProject = {
  id: 'test-project-001',
  name: 'Test Project for E2E',
  description: 'Automated test project',
  status: 'active',
  created_at: '2026-03-12T00:00:00Z',
  updated_at: '2026-03-12T00:00:00Z',
};

/**
 * Sample WBS item for testing (AC-6)
 */
export const mockWBSItem = {
  id: 'test-wbs-001',
  project_id: 'test-project-001',
  name: 'Test WBS Item',
  description: 'Test work breakdown structure item',
  type: 'deliverable',
  status: 'in_progress',
};

/**
 * Form validation test cases (AC-10)
 */
export const validationTestCases = [
  {
    name: 'empty_required_field',
    field: 'name',
    value: '',
    expectedError: 'Name is required',
  },
  {
    name: 'invalid_email',
    field: 'email',
    value: 'not-an-email',
    expectedError: 'Invalid email format',
  },
  {
    name: 'too_short',
    field: 'name',
    value: 'ab',
    expectedError: 'Must be at least 3 characters',
  },
  {
    name: 'too_long',
    field: 'description',
    value: 'x'.repeat(5001),
    expectedError: 'Must be 5000 characters or less',
  },
];

/**
 * Filtering test cases (AC-7)
 */
export const filterTestCases = [
  {
    filter: 'status',
    value: 'active',
    expectedCount: '>0',
  },
  {
    filter: 'status',
    value: 'completed',
    expectedCount: '>0',
  },
  {
    filter: 'search',
    value: 'test',
    expectedCount: '>0',
  },
];

/**
 * Sorting test cases (AC-8)
 */
export const sortTestCases = [
  {
    field: 'name',
    direction: 'asc',
    validate: (items: any[]) => {
      for (let i = 0; i < items.length - 1; i++) {
        if (items[i].name > items[i + 1].name) return false;
      }
      return true;
    },
  },
  {
    field: 'created_at',
    direction: 'desc',
    validate: (items: any[]) => {
      for (let i = 0; i < items.length - 1; i++) {
        if (new Date(items[i].created_at) < new Date(items[i + 1].created_at)) return false;
      }
      return true;
    },
  },
];

/**
 * API error scenarios (AC-16, AC-17, AC-18, AC-19)
 */
export const errorScenarios = [
  {
    name: 'api_500_internal_error',
    statusCode: 500,
    message: 'Internal Server Error',
    expectedBehavior: 'Shows error message, graceful degradation',
  },
  {
    name: 'api_400_bad_request',
    statusCode: 400,
    message: 'Bad Request',
    expectedBehavior: 'Shows validation errors',
  },
  {
    name: 'api_404_not_found',
    statusCode: 404,
    message: 'Not Found',
    expectedBehavior: 'Shows 404 page',
  },
  {
    name: 'api_timeout',
    statusCode: 0,
    message: 'Request Timeout',
    expectedBehavior: 'Shows timeout error, retry option',
  },
  {
    name: 'network_error',
    statusCode: 0,
    message: 'Network Error',
    expectedBehavior: 'Shows offline message',
  },
];

/**
 * Performance thresholds (AC-21 to AC-25)
 */
export const performanceThresholds = {
  pageLoad: 3000,           // AC-21: < 3 seconds
  timeToInteractive: 5000,  // AC-22: < 5 seconds
  routeTransition: 500,     // AC-23: < 500ms
  memoryGrowth: 10,         // AC-24: < 10% growth per action
  lazyLoadDelay: 2000,      // AC-25: < 2 seconds
};

/**
 * Keyboard shortcuts for testing (AC-37)
 */
export const keyboardShortcuts = [
  { key: 'Tab', description: 'Navigate to next focusable element' },
  { key: 'Shift+Tab', description: 'Navigate to previous focusable element' },
  { key: 'Enter', description: 'Activate focused element' },
  { key: 'Escape', description: 'Close modal/drawer' },
  { key: 'ArrowUp', description: 'Navigate up in list' },
  { key: 'ArrowDown', description: 'Navigate down in list' },
  { key: 'Home', description: 'Jump to first item' },
  { key: 'End', description: 'Jump to last item' },
];

/**
 * ARIA attributes to validate (AC-41)
 */
export const ariaAttributes = [
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-expanded',
  'aria-hidden',
  'aria-live',
  'aria-pressed',
  'aria-selected',
  'aria-checked',
  'role',
];

/**
 * Mock API responses for offline testing
 */
export const mockAPIResponses = {
  health: {
    status: 'healthy',
    timestamp: '2026-03-12T00:00:00Z',
  },
  layers: {
    data: testLayers.map(layer => ({
      id: layer,
      name: layer,
      description: `Mock ${layer} layer`,
      count: 10,
    })),
  },
  projects: {
    data: [mockProject],
  },
  wbs: {
    data: [mockWBSItem],
  },
};

/**
 * Viewport sizes for responsive testing (AC-35, AC-36)
 */
export const viewportSizes = {
  mobile: { width: 375, height: 667 },  // AC-35
  tablet: { width: 768, height: 1024 }, // AC-36
  desktop: { width: 1920, height: 1080 },
};

/**
 * Browsers for cross-browser testing (AC-31 to AC-34)
 */
export const browsers = ['chromium', 'firefox', 'webkit', 'edge'];

/**
 * Skip links to test (AC-40)
 */
export const skipLinks = [
  { href: '#main', text: 'Skip to main content' },
  { href: '#nav', text: 'Skip to navigation' },
  { href: '#search', text: 'Skip to search' },
];
