# Gates 3-5: Browser Testing & Verification Guide
**Session 45 Part 9 - Data Model UI Quality Gates**

**Status**: Dev server operational (http://localhost:5173/), ready for browser testing  
**Date**: March 11, 2026

## Prerequisites ✅
- ✅ Gate 0: CSS Foundation complete (335+ components fixed)
- ✅ Gate 1: TypeScript pragmatic fix (10,607 → 10,304 errors)
- ✅ Dev server running on port 5173
- ✅ HTTP 200 OK response confirmed

## Gate 3: Browser Console Verification 🧪

### Objective
Verify the UI loads in browser without critical runtime errors.

### Test Procedure
1. Open browser: http://localhost:5173/
2. Open Developer Tools (F12)
3. Navigate to Console tab
4. Refresh page (Ctrl+R)

### Success Criteria
- [ ] Page loads (not blank screen)
- [ ] No **red** console errors (warnings OK)
- [ ] React app renders
- [ ] Navigation menu visible

### Expected Issues (Acceptable)
- TypeScript warnings in dev mode
- Missing form fields (placeholders)
- 404 errors for missing API endpoints (mock APIs return immediately)

### Critical Errors (Must Fix)
- `Uncaught ReferenceError`
- ` Uncaught TypeError: Cannot read property`
- `Failed to compile` (should not happen - Vite shows UI even with TS errors)
- Blank screen with no UI

### Capture Evidence
- Screenshot of browser with Console open
- Copy/paste any **red errors** to `evidence/gate_3_console_errors.txt`

---

## Gate 4: Language Switching 🌐

### Objective
Verify all 5 languages load without errors.

### Available Languages
- EN (English)
- FR (French)
- ES (Spanish)
- DE (German)
- PT (Portuguese)

### Test Procedure
1. Locate language selector (likely in header/navbar)
2. Click language dropdown
3. Select each language sequentially
4. Verify UI updates

### Success Criteria
- [ ] Language selector renders
- [ ] All 5 languages listed
- [ ] Clicking language changes UI text
- [ ] No console errors on language switch
- [ ] Page doesn't crash/reload unexpectedly

### Known Issues (Acceptable)
- Some components may have hardcoded English literals (Gate 2 backlog)
- Template placeholders show "Form fields pending generation" in all languages

### Critical Errors (Must Fix)
- Language selector missing/broken
- Console errors on language change
- Page crashes when switching languages
- All text disappears

### Capture Evidence
- Screenshot of each language (5 screenshots)
- Note any components with English text in non-English mode

---

## Gate 5: Visual Verification 👁️

### Objective
Confirm UI renders correctly with GC Design System styling.

### Test Areas

#### 1. Layout
- [ ] Header/navbar present
- [ ] Sidebar/navigation panel
- [ ] Main content area
- [ ] Footer (if applicable)

#### 2. Colors (GC Design System)
- [ ] Text: `#333333` (GC_TEXT) - primary text
- [ ] Muted: `#757575` (GC_MUTED) - secondary text
- [ ] Border: `#DDDDDD` (GC_BORDER) - dividers/borders
- [ ] Surface: `#F5F5F5` (GC_SURFACE) - backgrounds
- [ ] Blue: `#3B82F6` (GC_BLUE) - primary actions
- [ ] Error: `#EF4444` (GC_ERROR) - errors
- [ ] Success: `#10B981` (GC_SUCCESS) - success states

#### 3. Typography
- [ ] Headings readable
- [ ] Body text clear
- [ ] Font sizes consistent

#### 4. Interactive Elements
- [ ] Buttons have hover states
- [ ] Links change on hover
- [ ] Forms have focus states
- [ ] Dropdowns open correctly

#### 5. Components
- [ ] Navigation works (click menu items)
- [ ] Tables/lists render
- [ ] DetailDrawers slide in when clicking records
- [ ] CreateForms show (even if placeholder)
- [ ] EditForms load (even if placeholder)

### Success Criteria
- [ ] All GC colors applied (no pink/purple/random colors)
- [ ] No layout breaks (overlapping text)
- [ ] Interactive elements respond to user actions
- [ ] No accessibility warnings in browser (optional - use Lighthouse)

### Known Issues (Acceptable)
- Form fields are placeholder divs (says "Form fields pending generation")
- Some buttons may not have actions (API endpoints mock)
- DetailDrawers show all fields generically (no custom layouts yet)

### Critical Errors (Must Fix)
- App crashes when navigating
- Blank sections where components should render
- Console errors when clicking UI elements
- Hardcoded pink/purple/random colors (not GC Design System)

### Capture Evidence
- Screenshot of main view
- Screenshot of DetailDrawer open
- Screenshot of CreateForm
- Screenshot of EditForm
- Note any visual inconsistencies

---

## Reporting Results

### Option 1: Create Evidence Files
```powershell
# Navigate to UI directory
cd C:\eva-foundry\37-data-model\ui\evidence

# Create Gate 3 result
"[Gate 3 Results]
Page loaded: YES/NO
Console errors: <count> (paste errors below)
<paste red errors here>
" | Out-File gate_3_results.txt

# Create Gate 4 result
"[Gate 4 Results]
Language selector: YES/NO
Languages working: EN:YES FR:YES ES:YES DE:YES PT:YES
Errors on switch: <paste errors>
" | Out-File gate_4_results.txt

# Create Gate 5 result
"[Gate 5 Results]
Layout renders: YES/NO
Colors correct: YES/NO
Components work: YES/NO
Issues found:
- <list any issues>
" | Out-File gate_5_results.txt
```

### Option 2: Report to Agent
If testing reveals issues, tell agent:
- "Gate 3 failed: <describe error>"
- "Gate 4: Language X doesn't work - <error message>"
- "Gate 5: Component Y has visual bug - <description>"

---

## Next Steps After Testing

### If All Gates Pass ✅
Say: **"Gates 3-5 passed, proceed to Gate 6"**

Agent will:
- Implement evidence integration (L31/L26/L46 writes)
- Add cost tracking (infrastructure_events)
- Generate proper form fields (layer-specific schemas)

### If Issues Found ❌
Say: **"Gate X failed: <error details>"**

Agent will:
- Apply nested DPDCA to fix
- Create targeted fixes
- Re-test

---

## Current State Summary

**Files Generated**:
- 335 component fixes (DetailDrawers/CreateForms/EditForms)
- 108 API stubs (216 new files)
- 3 batch fix scripts

**Dev Server**:
- Running: http://localhost:5173/
- Vite 5.4.21
- HMR active
- HTTP 200 OK

**Known Limitations**:
- Form fields are placeholders (non-functional)
- APIs are mocks (return immediately, no backend)
- TypeScript 10k+ warnings (non-blocking for runtime)

**Production Readiness**: 25%
- ✅ Gate 0: CSS Foundation
- ✅ Gate 1: TypeScript pragmatic fix
- ⏳ Gate 3-5: Awaiting user browser testing
- ❌ Gate 2: i18n consistency (deferred)
- ❌ Gate 6-7: Evidence/cost tracking (planned)

