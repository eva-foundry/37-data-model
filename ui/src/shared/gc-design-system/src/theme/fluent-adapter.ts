/**
 * Fluent UI Theme Adapter
 * Last Updated: February 15, 2026
 * 
 * Maps GC Design System tokens to Fluent UI v9 theme structure
 * Provides light and dark theme variants for GC-compliant applications
 */

import {
  type BrandVariants,
  type Theme,
  createLightTheme,
  createDarkTheme,
} from '@fluentui/react-components';
import { gcColors } from '../tokens/colors';
import { gcSemanticSpacing } from '../tokens/spacing';
import { gcFontFamilies, gcFontSizes, gcFontWeights, gcLineHeights } from '../tokens/typography';

/**
 * GC Brand Color Variants for Fluent UI
 * Based on Canada brand red (#AF3C43) with generated tints/shades
 */
const gcBrandVariants: BrandVariants = {
  10: '#F9F3F4',
  20: '#F2E7E8',
  30: '#E8D4D6',
  40: '#DDC1C4',
  50: '#D3AEB2',
  60: '#C89BA0',
  70: '#BE888E',
  80: '#B7757C',
  90: '#AF3C43', // Primary Canada brand red
  100: '#9D3639',
  110: '#8B302F',
  120: '#792A25',
  130: '#67241B',
  140: '#551E11',
  150: '#431807',
  160: '#311200',
};

/**
 * Create GC-compliant light theme
 */
export function createGCLightTheme(): Theme {
  const theme = createLightTheme(gcBrandVariants);

  return {
    ...theme,
    
    // Override font tokens
    fontFamilyBase: gcFontFamilies.primary,
    fontFamilyMonospace: gcFontFamilies.mono,
    fontSizeBase100: gcFontSizes.xs,
    fontSizeBase200: gcFontSizes.xs,
    fontSizeBase300: gcFontSizes.sm,
    fontSizeBase400: gcFontSizes.base,
    fontSizeBase500: gcFontSizes.lg,
    fontSizeBase600: gcFontSizes.xl,
    fontSizeHero700: gcFontSizes['2xl'],
    fontSizeHero800: gcFontSizes['3xl'],
    fontSizeHero900: gcFontSizes['4xl'],
    fontSizeHero1000: gcFontSizes['5xl'],
   
    fontWeightRegular: gcFontWeights.normal,
    fontWeightMedium: gcFontWeights.medium,
    fontWeightSemibold: gcFontWeights.semibold,
    fontWeightBold: gcFontWeights.bold,
    
    lineHeightBase100: gcLineHeights.tight,
    lineHeightBase200: gcLineHeights.snug,
    lineHeightBase300: gcLineHeights.normal,
    lineHeightBase400: gcLineHeights.relaxed,
    lineHeightBase500: gcLineHeights.loose,
    lineHeightBase600: gcLineHeights.loose,
    lineHeightHero700: gcLineHeights.tight,
    lineHeightHero800: gcLineHeights.tight,
    lineHeightHero900: gcLineHeights.tight,
    lineHeightHero1000: gcLineHeights.tight,
    
    // Override spacing tokens (Fluent uses numbers, convert from our px strings)
    spacingHorizontalNone: '0',
    spacingHorizontalXXS: gcSemanticSpacing.componentXs,
    spacingHorizontalXS: gcSemanticSpacing.componentSm,
    spacingHorizontalSNudge: gcSemanticSpacing.componentMd,
    spacingHorizontalS: gcSemanticSpacing.layoutSm,
    spacingHorizontalMNudge: gcSemanticSpacing.layoutMd,
    spacingHorizontalM: gcSemanticSpacing.layoutLg,
    spacingHorizontalL: gcSemanticSpacing.layoutXl,
    spacingHorizontalXL: gcSemanticSpacing.sectionMd,
    spacingHorizontalXXL: gcSemanticSpacing.sectionLg,
    spacingHorizontalXXXL: gcSemanticSpacing.sectionXl,
    
    spacingVerticalNone: '0',
    spacingVerticalXXS: gcSemanticSpacing.componentXs,
    spacingVerticalXS: gcSemanticSpacing.componentSm,
    spacingVerticalSNudge: gcSemanticSpacing.componentMd,
    spacingVerticalS: gcSemanticSpacing.layoutSm,
    spacingVerticalMNudge: gcSemanticSpacing.layoutMd,
    spacingVerticalM: gcSemanticSpacing.layoutLg,
    spacingVerticalL: gcSemanticSpacing.layoutXl,
    spacingVerticalXL: gcSemanticSpacing.sectionMd,
    spacingVerticalXXL: gcSemanticSpacing.sectionLg,
    spacingVerticalXXXL: gcSemanticSpacing.sectionXl,
    
    // Override color tokens to match GC Design System
    colorNeutralForeground1: gcColors.text.primary,
    colorNeutralForeground2: gcColors.text.secondary,
    colorNeutralForeground3: gcColors.text.secondary,
    
    colorBrandForegroundLink: gcColors.link.default,
    colorBrandForegroundLinkHover: gcColors.link.hover,
    colorBrandForegroundLinkPressed: gcColors.link.hover,
    
    colorNeutralBackground1: gcColors.background.white,
    colorNeutralBackground2: gcColors.background.light,
    colorNeutralBackground3: gcColors.background.light,
    
    colorNeutralStroke1: gcColors.border.default,
    colorNeutralStroke2: gcColors.border.light,
    
    colorNeutralStrokeAccessible: gcColors.border.dark,
    colorNeutralStrokeAccessibleHover: gcColors.border.default,
    
    colorPaletteRedBackground3: gcColors.status.error.light,
    colorPaletteRedForeground3: gcColors.status.error.DEFAULT,
    colorPaletteGreenBackground3: gcColors.status.success.light,
    colorPaletteGreenForeground3: gcColors.status.success.DEFAULT,
    colorPaletteYellowBackground3: gcColors.status.warning.light,
    colorPaletteYellowForeground3: gcColors.status.warning.DEFAULT,
    colorPaletteBlueBackground2: gcColors.status.info.light,
    colorPaletteBlueForeground2: gcColors.status.info.DEFAULT,
    
    colorStrokeFocus2: gcColors.focus.default,
  };
}

/**
 * Create GC-compliant dark theme
 * Note: GC Design System primarily uses light theme, dark theme is provided for accessibility
 */
export function createGCDarkTheme(): Theme {
  const theme = createDarkTheme(gcBrandVariants);

  return {
    ...theme,
    
    // Apply same font and spacing overrides as light theme
    fontFamilyBase: gcFontFamilies.primary,
    fontFamilyMonospace: gcFontFamilies.mono,
    fontSizeBase100: gcFontSizes.xs,
    fontSizeBase200: gcFontSizes.xs,
    fontSizeBase300: gcFontSizes.sm,
    fontSizeBase400: gcFontSizes.base,
    fontSizeBase500: gcFontSizes.lg,
    fontSizeBase600: gcFontSizes.xl,
    fontSizeHero700: gcFontSizes['2xl'],
    fontSizeHero800: gcFontSizes['3xl'],
    fontSizeHero900: gcFontSizes['4xl'],
    fontSizeHero1000: gcFontSizes['5xl'],
    
    fontWeightRegular: gcFontWeights.normal,
    fontWeightMedium: gcFontWeights.medium,
    fontWeightSemibold: gcFontWeights.semibold,
    fontWeightBold: gcFontWeights.bold,
    
    lineHeightBase100: gcLineHeights.tight,
    lineHeightBase200: gcLineHeights.snug,
    lineHeightBase300: gcLineHeights.normal,
    lineHeightBase400: gcLineHeights.relaxed,
    lineHeightBase500: gcLineHeights.loose,
    lineHeightBase600: gcLineHeights.loose,
    lineHeightHero700: gcLineHeights.tight,
    lineHeightHero800: gcLineHeights.tight,
    lineHeightHero900: gcLineHeights.tight,
    lineHeightHero1000: gcLineHeights.tight,
    
    spacingHorizontalNone: '0',
    spacingHorizontalXXS: gcSemanticSpacing.componentXs,
    spacingHorizontalXS: gcSemanticSpacing.componentSm,
    spacingHorizontalSNudge: gcSemanticSpacing.componentMd,
    spacingHorizontalS: gcSemanticSpacing.layoutSm,
    spacingHorizontalMNudge: gcSemanticSpacing.layoutMd,
    spacingHorizontalM: gcSemanticSpacing.layoutLg,
    spacingHorizontalL: gcSemanticSpacing.layoutXl,
    spacingHorizontalXL: gcSemanticSpacing.sectionMd,
    spacingHorizontalXXL: gcSemanticSpacing.sectionLg,
    spacingHorizontalXXXL: gcSemanticSpacing.sectionXl,
    
    spacingVerticalNone: '0',
    spacingVerticalXXS: gcSemanticSpacing.componentXs,
    spacingVerticalXS: gcSemanticSpacing.componentSm,
    spacingVerticalSNudge: gcSemanticSpacing.componentMd,
    spacingVerticalS: gcSemanticSpacing.layoutSm,
    spacingVerticalMNudge: gcSemanticSpacing.layoutMd,
    spacingVerticalM: gcSemanticSpacing.layoutLg,
    spacingVerticalL: gcSemanticSpacing.layoutXl,
    spacingVerticalXL: gcSemanticSpacing.sectionMd,
    spacingVerticalXXL: gcSemanticSpacing.sectionLg,
    spacingVerticalXXXL: gcSemanticSpacing.sectionXl,
    
    // Dark theme specific color overrides
    // (Using Fluent's dark theme defaults, can be customized further)
    colorStrokeFocus2: gcColors.focus.default,
  };
}

/**
 * Default export: GC Light Theme
 */
export const gcTheme = createGCLightTheme();
export const gcDarkTheme = createGCDarkTheme();
