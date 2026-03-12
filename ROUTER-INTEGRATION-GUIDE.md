# Router Integration Guide: Unifying 37-data-model + 31-eva-faces

**Target**: Merge 31-eva-faces (33 screens) into 37-data-model (128 screens) → 161 unified screens  
**Status**: Integration plan ready  
**Session**: 47, March 12, 2026  

---

## Current State

### 37-data-model Router (Current: 128 routes)

File: `37-data-model/ui/src/layerRoutes.tsx`

```typescript
export const portalRoutes = [...]      // 7 routes
export const adminRoutes = [...]       // 10 routes
export const layerRoutes = [...]       // 111 routes
export const acceleratorRoutes = []    // 0 routes (can repurpose)
// TOTAL: 128 routes
```

### 31-eva-faces Applications (Current: Separate)

- **admin-face**: 20 page components (separate Vite app)
- **portal-face**: 13 page components (separate Vite app)
- **agent-fleet**: Agent-specific, not pages
- **chat-face**: Chat UI, not pages

---

## Integration Strategy

### Option A: Consolidate into Single Router (Recommended)

**Benefit**: Single entry point, unified navigation, shared state  
**Cost**: Refactoring evafaces pages to use 37-data-model's structure  
**Timeline**: 2-3 hours  

### Option B: Federated Routing (Alternative)

**Benefit**: Preserve module independence, microservices-style  
**Cost**: More complex navigation, route coordination overhead  
**Timeline**: 4-5 hours  

**We'll pursue Option A** (consolidation) for simplicity and unified test infrastructure.

---

## Step-by-Step Integration

### Step 1: Extract Pages from 31-eva-faces

```bash
# Copy portal-face pages to 37-data-model
cp -r 31-eva-faces/portal-face/src/pages/* 37-data-model/ui/src/pages/eva-faces/portal/

# Copy admin-face pages to 37-data-model
cp -r 31-eva-faces/admin-face/src/pages/* 37-data-model/ui/src/pages/eva-faces/admin/
```

**Result**:
```
37-data-model/ui/src/pages/
├── portal/               (7 original pages)
├── admin/                (10 original pages)
├── [111 layer folders]/
└── eva-faces/
    ├── portal/           (13 pages from 31-eva-faces)
    └── admin/            (20 pages from 31-eva-faces)
```

### Step 2: Update Imports in layerRoutes.tsx

**Current imports**:
```typescript
const EVAHomePage = React.lazy(() => import('./pages/portal/EVAHomePage'));
```

**Add new imports**:
```typescript
// ==========================================
// Eva Faces: Portal Pages (13 pages)
// ==========================================
const DashboardPage = React.lazy(() => import('./pages/eva-faces/portal/DashboardPage'));
const UserProfilePage = React.lazy(() => import('./pages/eva-faces/portal/UserProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/eva-faces/portal/SettingsPage'));
// ... 10 more portal pages from eva-faces

// ==========================================
// Eva Faces: Admin Pages (20 pages)
// ==========================================
const TeamManagementPage = React.lazy(() => import('./pages/eva-faces/admin/TeamManagementPage'));
const RoleConfigurationPage = React.lazy(() => import('./pages/eva-faces/admin/RoleConfigurationPage'));
// ... 18 more admin pages from eva-faces
```

### Step 3: Extend Route Arrays

**Current portalRoutes**:
```typescript
export const portalRoutes = [
  { path: '/eva-home', element: <EVAHomePage /> },
  { path: '/model-browser', element: <ModelBrowserPage /> },
  // ... 5 more from 37-data-model
];
```

**Extended portalRoutes**:
```typescript
export const portalRoutes = [
  // 7 from 37-data-model
  { path: '/eva-home', element: <EVAHomePage /> },
  { path: '/model-browser', element: <ModelBrowserPage /> },
  // ... 5 more
  
  // 13 from 31-eva-faces/portal-face
  { path: '/portal/dashboard', element: <DashboardPage /> },
  { path: '/portal/profile', element: <UserProfilePage /> },
  { path: '/portal/settings', element: <SettingsPage /> },
  // ... 10 more from eva-faces
];
// Total: 20 portal routes
```

**Extended adminRoutes**:
```typescript
export const adminRoutes = [
  // 10 from 37-data-model
  { path: '/admin/apps', element: <AppsPage /> },
  // ... 9 more
  
  // 20 from 31-eva-faces/admin-face
  { path: '/admin/team', element: <TeamManagementPage /> },
  { path: '/admin/roles', element: <RoleConfigurationPage /> },
  // ... 18 more from eva-faces
];
// Total: 30 admin routes
```

### Step 4: Create Unified Route Export

Add new export for unified routing:

```typescript
// ==========================================
// Unified Route Summary
// ==========================================
export const allRoutes = {
  portal: portalRoutes,        // 20 routes (7 + 13)
  admin: adminRoutes,          // 30 routes (10 + 20)
  layers: layerRoutes,         // 111 routes
  total: 161
};

// Route Summary Comment
// Portal: 20 routes (7 from 37-data-model + 13 from 31-eva-faces)
// Admin: 30 routes (10 from 37-data-model + 20 from 31-eva-faces)
// Layers: 111 routes (all data model layers)
// TOTAL: 161 routes (unified ecosystem)
```

### Step 5: Update Main App Router

File: `37-data-model/ui/src/main.tsx` or `App.tsx`

**Current**:
```typescript
const routes = [
  ...portalRoutes,
  ...adminRoutes,
  ...layerRoutes
];
```

**Updated**:
```typescript
const routes = [
  ...portalRoutes,   // Now includes eva-faces portal pages
  ...adminRoutes,    // Now includes eva-faces admin pages
  ...layerRoutes     // Unchanged (111 layers)
];
```

### Step 6: Handle Dependency Resolution

**Potential Issues**:

1. **Shared Context Providers** (auth, theme, language)
   - Ensure eva-faces pages use the same providers from 37-data-model
   - Example: Both projects need `<LangProvider>`, `<AuthProvider>`

2. **API Endpoints**
   - Ensure eva-faces pages call same backend as 37-data-model
   - May need to update `serviceConfig.ts` URLs

3. **Type Definitions**
   - Copy type files from 31-eva-faces/admin-face/src/types to 37-data-model/ui/src/types
   - Resolve naming conflicts (same type name in both projects)

4. **Utilities & Hooks**
   - Identify shared utilities used by eva-faces pages
   - Copy to 37-data-model/ui/src/hooks and 37-data-model/ui/src/lib

**Automated Dependency Scanner**:

```powershell
# Find all imports from eva-faces pages
$files = Get-ChildItem "31-eva-faces/admin-face/src/pages" -Filter "*.tsx" -Recurse
foreach ($file in $files) {
  $imports = Select-String "^import .* from ['\"]" $file.FullName
  Write-Host "$($file.Name):"
  $imports | ForEach-Object { Write-Host "  $_" }
}
```

---

## Conflict Resolution

### Naming Conflicts

**Risk**: Both projects have pages named similarly (e.g., SettingsPage)

**Solution**: Distinguish in routes
```typescript
// 37-data-model SettingsPage
{ path: '/admin/system-settings', element: <SystemSettingsPage /> }

// 31-eva-faces SettingsPage
{ path: '/portal/user-settings', element: <SettingsPage /> }
```

### Component Name Collisions

**Risk**: Shared component names (Button, Dialog, etc.)

**Solution**: Use namespace imports
```typescript
import * as DataModelUI from '@/components/shared'
import * as EvaFacesUI from '@/pages/eva-faces/components'
```

---

## Testing Integration

### Route Resolution Test

```typescript
describe('Unified Router', () => {
  test('all 161 routes should resolve', () => {
    const allRoutes = [...portalRoutes, ...adminRoutes, ...layerRoutes];
    expect(allRoutes).toHaveLength(161);
    
    allRoutes.forEach(route => {
      expect(route.path).toBeDefined();
      expect(route.element).toBeDefined();
    });
  });

  test('portal routes should include eva-faces pages', () => {
    expect(portalRoutes.filter(r => r.path.includes('portal')).length).toBeGreaterThan(7);
  });

  test('admin routes should include eva-faces pages', () => {
    expect(adminRoutes.filter(r => r.path.includes('eva-faces')).length).toBeGreaterThan(0);
  });
});
```

### Navigation Test

```bash
npm run test:e2e -- --grep "Navigation" --project=chromium
```

---

## Updated Test ID Strategy

### Portal Routes with Test IDs

```typescript
// Original 37-data-model portals
<div data-testid="eva-home-container">        // EVAHomePage
<div data-testid="model-browser-list">        // ModelBrowserPage

// New 31-eva-faces portals  
<div data-testid="portal-dashboard-main">     // DashboardPage
<div data-testid="portal-profile-card">       // UserProfilePage
```

### Admin Routes with Test IDs

```typescript
// Original 37-data-model admin
<div data-testid="admin-apps-table">          // AppsPage

// New 31-eva-faces admin
<div data-testid="admin-team-hierarchy">      // TeamManagementPage
<div data-testid="admin-roles-matrix">        // RoleConfigurationPage
```

---

## Phased Rollout

### Phase 1: Portal Integration (Day 1)
- [ ] Copy eva-faces/portal-face pages
- [ ] Add imports to layerRoutes.tsx
- [ ] Add routes to portalRoutes array
- [ ] Test: Navigate to all 20 portal screens
- [ ] Commit: "feat(router): integrate 13 eva-faces portal pages"

### Phase 2: Admin Integration (Day 1-2)
- [ ] Copy eva-faces/admin-face pages
- [ ] Add imports to layerRoutes.tsx
- [ ] Add routes to adminRoutes array
- [ ] Resolve naming conflicts
- [ ] Test: Navigate to all 30 admin screens
- [ ] Commit: "feat(router): integrate 20 eva-faces admin pages"

### Phase 3: Unified Validation (Day 2)
- [ ] Validate all 161 routes compile
- [ ] Test navigation across all sections
- [ ] Verify no import errors
- [ ] Test shared context providers work
- [ ] Commit: "feat(router): unified 161-screen manifest"

---

## File Modifications Summary

### Files to Create/Modify

| File | Action | Impact |
|------|--------|--------|
| `layerRoutes.tsx` | Update imports + routes | +33 new routes |
| `pages/eva-faces/portal/*` | Copy 13 files | New 13 pages |
| `pages/eva-faces/admin/*` | Copy 20 files | New 20 pages |
| `types/eva-faces.ts` | Copy/merge types | +N type definitions |
| `hooks/eva-faces/*` | Copy hooks | Shared logic |
| `main.tsx` | No change needed | Routes already imported |

### Lines of Code Impact

```
layerRoutes.tsx:
  Before: ~600 lines (128 routes)
  After: ~800 lines (161 routes)
  Change: +200 lines

New files: 33 pages (13 portal + 20 admin)
  Estimated: ~3,000-5,000 lines added

Total router complexity increase: ~10%
```

---

## Rollback Strategy

If integration fails:

```bash
# Revert to pre-integration state
git checkout HEAD~1 ui/src/layerRoutes.tsx
rm -rf ui/src/pages/eva-faces/
npm run type-check
```

---

## Success Criteria

✅ All 161 routes in layerRoutes.tsx  
✅ No import errors when bundling  
✅ Navigation between portal/admin/layer screens  
✅ All pages load without 404  
✅ No TypeScript compilation errors  
✅ All context providers work across merged pages  
✅ Test IDs accessible on all 161 screens  

---

## Next: Extend Refactoring to 161 Screens

Once router integration is complete, extend component refactoring:

1. **Batch 1** (20 layers): CURRENT - Apply test IDs
2. **Batch 2** (40 layers): Model/API infrastructure  
3. **Batch 3** (30 layers): Deployment/observability
4. **Batch 4** (21 layers + 50 portal/admin): Extended UI surfaces

New orchestrator: `Batch-Integration-Orchestrator.ps1` (for all 161 screens)

---

**Session 47 - March 12, 2026**  
**Router integration ready for implementation**
