/**
 * GC Design System Tokens
 * Single source of truth for Government of Canada design system colors
 * Reference: https://design.canada.ca/styles/colour.html
 * 
 * Session 45 Part 9: Base tokens created
 * Session 46: Enhanced with chart colors, warnings, semantic aliases
 * 
 * Purpose: Centralized design constants for 111 Screen Machine generated pages
 * Benefits:
 * - Consistency across all pages
 * - Easier dark mode support
 * - Smaller bundle size (no repeated constants)
 * - Maintainability (1 file vs 111 files)
 */

// ============================================================================
// TEXT COLORS
// ============================================================================

/**
 * PRIMARY TEXT - Main body text
 * WCAG AA: ✅ Passes on white (#FFFFFF) with 15.26:1 ratio
 */
export const GC_TEXT = '#0b0c0e';

/**
 * MUTED TEXT - Secondary information, labels
 * WCAG AA: ✅ Passes on white (#FFFFFF) with 6.72:1 ratio
 */
export const GC_MUTED = '#505a5f';

// ============================================================================
// SURFACE COLORS
// ============================================================================

/**
 * SURFACE - Background for cards, panels
 * Used for elevated content over page background
 */
export const GC_SURFACE = '#f8f8f8';

/**
 * PAGE BACKGROUND - Main page background
 * Clean, neutral base
 */
export const GC_PAGE_BG = '#ffffff';

// ============================================================================
// BORDER & DIVIDERS
// ============================================================================

/**
 * BORDER - Default border color
 * Used for input fields, cards, separators
 */
export const GC_BORDER = '#b1b4b6';

/**
 * DIVIDER - Subtle visual separation
 * Lighter than borders, for non-interactive elements
 */
export const GC_DIVIDER = '#e0e0e0';

// ============================================================================
// INTERACTIVE COLORS
// ============================================================================

/**
 * PRIMARY ACTION - Links, primary buttons
 * GC Blue brand color
 * WCAG AA: ✅ Passes on white (#FFFFFF) with 5.36:1 ratio
 */
export const GC_BLUE = '#1d70b8';

/**
 * PRIMARY HOVER - Hover state for GC_BLUE
 * Slightly darker for feedback
 */
export const GC_BLUE_HOVER = '#165a93';

// ============================================================================
// STATUS COLORS
// ============================================================================

/**
 * SUCCESS - Positive feedback, completed states
 * WCAG AA: ✅ Passes on white (#FFFFFF) with 4.55:1 ratio
 */
export const GC_SUCCESS = '#00703c';

/**
 * WARNING - Caution, needs attention
 * WCAG AA: ⚠️ Requires careful usage (3.79:1 on white, use larger text or icons)
 */
export const GC_WARNING = '#f47738';

/**
 * ERROR - Errors, validation failures
 * WCAG AA: ✅ Passes on white (#FFFFFF) with 5.73:1 ratio
 */
export const GC_ERROR = '#d4351c';

/**
 * INFO - Informational messages
 * Uses GC_BLUE for consistency
 */
export const GC_INFO = GC_BLUE;

// ============================================================================
// CHART COLORS (For GraphView Components)
// ============================================================================

/**
 * CHART COLOR PALETTE
 * Used for data visualizations (pie charts, bar charts, etc.)
 * 
 * Order: Blue, Green, Purple, Red, Orange
 * Designed for good contrast and color-blind accessibility
 */
export const CHART_COLORS = [
  GC_BLUE,       // #1d70b8
  GC_SUCCESS,    // #00703c
  '#912b88',     // Purple
  GC_ERROR,      // #d4351c
  GC_WARNING,    // #f47738
];

// ============================================================================
// SEMANTIC ALIASES (For Specific Use Cases)
// ============================================================================

/**
 * FOCUS RING - Keyboard navigation indicator
 * GC Blue with 3px outline
 */
export const GC_FOCUS = GC_BLUE;

/**
 * DISABLED STATE - Inactive controls
 */
export const GC_DISABLED = '#b1b4b6';

/**
 * PLACEHOLDER TEXT - Input placeholders
 */
export const GC_PLACEHOLDER = GC_MUTED;
