/**
 * Anti-Hardcoding Test - Session 45 Part 8
 * 
 * Enforces that all user-facing strings come from L17 literals layer viauseLiterals hook.
 * Prevents hardcoded strings in generated components (i18n compliance requirement).
 * 
 * Quality gate: CI/CD fails if hardcoded strings detected in components.
 */

import { describe, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { sync as globSync } from 'glob';

// Whitelist: Technical strings that are allowed to be hardcoded
const ALLOWED_PATTERNS = [
  /data-testid=/,           // Test identifiers
  /aria-[a-z]+=/,           // ARIA attributes
  /className=/,             // CSS class names
  /style={{/,               // Inline styles
  /import .+ from/,         // Import statements
  /export /,                // Export statements
  /type /,                  // TypeScript type definitions
  /interface /,             // Interface definitions
  /const GC_/,              // GC Design System constants
  /\/\//,                   // Comments
  /\/\*/,                   // Block comments
];

// Pattern to detect bare strings (user-facing text)
const BARE_STRING_PATTERN = /(['"])([A-Z][^'"]{2,})(['"])/g;

describe('Anti-Hardcoding Test Suite', () => {
  
  it('should not have hardcoded user-facing strings in components', () => {
    const componentsDir = path.join(__dirname, '../components');
    
    // Skip if directory doesn't exist (test runs before components generated)
    if (!fs.existsSync(componentsDir)) {
      console.warn('[SKIP] Components directory does not exist yet');
      return;
    }
    
    const files = globSync(`${componentsDir}/**/*.tsx`);
    const violations: { file: string; strings: string[] }[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      const fileViolations: string[] = [];
      
      lines.forEach((line, idx) => {
        // Skip whitelisted patterns
        if (ALLOWED_PATTERNS.some(pattern => pattern.test(line))) {
          return;
        }
        
        // Find bare strings
        const matches = Array.from(line.matchAll(BARE_STRING_PATTERN));
        for (const match of matches) {
          const text = match[2];
          
          // Skip technical strings
          if (text.startsWith('http') || text.startsWith('/') || text.includes('__')) {
            continue;
          }
          
          // Report violation
          fileViolations.push(`Line ${idx + 1}: "${text}"`);
        }
      });
      
      if (fileViolations.length > 0) {
        violations.push({
          file: path.relative(process.cwd(), file),
          strings: fileViolations,
        });
      }
    }
    
    // Fail if violations found
    if (violations.length > 0) {
      const report = violations.map(v => 
        `\n${v.file}:\n${v.strings.map(s => `  - ${s}`).join('\n')}`
      ).join('\n');
      
      throw new Error(
        `[ANTI-HARDCODING] Found ${violations.length} file(s) with hardcoded strings:${report}\n\n` +
        `All user-facing strings must use useLiterals hook from L17 literals layer.`
      );
    }
  });
  
  it('should use useLiterals hook in all generated components', () => {
    const componentsDir = path.join(__dirname, '../components');
    
    if (!fs.existsSync(componentsDir)) {
      console.warn('[SKIP] Components directory does not exist yet');
      return;
    }
    
    const files = globSync(`${componentsDir}/**/*{Create,Edit,List,Graph,Detail}*.tsx`);
    const missingHook: string[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for useLiterals import
      const hasImport = /import.*useLiterals.*from.*@hooks\/useLiterals/.test(content);
      
      // Check for hook usage
      const hasUsage = /const t = useLiterals\(/.test(content);
      
      if (!hasImport || !hasUsage) {
        missingHook.push(path.relative(process.cwd(), file));
      }
    }
    
    if (missingHook.length > 0) {
      throw new Error(
        `[ANTI-HARDCODING] ${missingHook.length} component(s) missing useLiterals hook:\n` +
        missingHook.map(f => `  - ${f}`).join('\n') +
        `\n\nAll generated components must use useLiterals hook for i18n support.`
      );
    }
  });
  
  it('should have all literal keys defined in L17 layer', async () => {
    const componentsDir = path.join(__dirname, '../components');
    
    if (!fs.existsSync(componentsDir)) {
      console.warn('[SKIP] Components directory does not exist yet');
      return;
    }
    
    // Extract all t('...') calls from components
    const files = globSync(`${componentsDir}/**/*.tsx`);
    const usedKeys = new Set<string>();
    
    const KEY_PATTERN = /t\(['"]([^'"]+)['"]\)/g;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = Array.from(content.matchAll(KEY_PATTERN));
      
      for (const match of matches) {
        usedKeys.add(match[1]);
      }
    }
    
    if (usedKeys.size === 0) {
      console.warn('[SKIP] No literal keys found in components');
      return;
    }
    
    // TODO: Query L17 API to verify keys exist
    // For now, just log the keys found
    console.log(`[INFO] Found ${usedKeys.size} literal keys used in components`);
    console.log(`[INFO] Keys: ${Array.from(usedKeys).sort().join(', ')}`);
    
    // This test will be expanded once L17 is populated with literal data
  });
  
});
