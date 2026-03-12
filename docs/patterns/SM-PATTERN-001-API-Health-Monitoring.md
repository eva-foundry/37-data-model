# Screen Machine Pattern: API Health Monitoring & Graceful Degradation

**Pattern ID**: SM-PATTERN-001  
**Category**: User Experience, Error Handling  
**Status**: Recommended Standard  
**Session**: 46 (March 12, 2026)

---

## Problem Statement

**Scenario**: UI renders beautifully with translated literals and proper layout, but the Data Model API is unreachable. Users see:
- Empty tables (no data loaded)
- Spinner icons that never resolve
- Failed actions with no explanation
- **The UI becomes "decorative fiction"** - it looks functional but does nothing

**User Impact**: Confusion, frustration, false confidence that the system works

---

## Solution: Honest UX with API Health Monitoring

### Architecture

**3-Layer Approach**:

1. **Mock Data Fallback** (useLiterals pattern)
   - UI infrastructure labels use MOCK_LITERALS
   - Zero dependency on APIs for basic rendering
   - UI always displays correctly

2. **Health Monitoring** (useApiHealth hook)
   - Proactive API health checks (5s timeout)
   - Status: `healthy` | `degraded` | `unavailable` | `checking`
   - Periodic rechecks (60s interval)

3. **User Notification** (ApiHealthBanner component)
   - Visible banner when API is down
   - Clear messaging about limitations
   - Dismissible but persistent across navigation

---

## Implementation

### 1. Create useApiHealth Hook

```typescript
// src/hooks/useApiHealth.ts
export function useApiHealth(): ApiHealthState {
  const [health, setHealth] = useState<ApiHealthState>({
    status: 'checking',
    message: 'Checking API status...',
    lastChecked: null,
    endpoint: '',
  });

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(`${endpoint}/health`, {
          signal: abortController.signal,
          method: 'GET',
        });
        // Set healthy/degraded/unavailable status
      } catch (err) {
        // Set unavailable status
      }
    }
    
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Recheck every 60s
    return () => clearInterval(interval);
  }, []);

  return health;
}
```

### 2. Create ApiHealthBanner Component

```typescript
// src/components/ApiHealthBanner.tsx
export const ApiHealthBanner: React.FC<ApiHealthBannerProps> = ({ health }) => {
  if (health.status === 'healthy') return null; // Hide when healthy
  
  return (
    <div role="alert" aria-live="polite" style={{ /* color-coded banner */ }}>
      <strong>{health.status.toUpperCase()}: </strong>
      {health.message}
      {health.status === 'unavailable' && (
        <span>
          The UI is functional, but data may be cached or simulated.
        </span>
      )}
    </div>
  );
};
```

### 3. Add to DemoApp (and all generated pages)

```typescript
export const DemoApp: React.FC = () => {
  const apiHealth = useApiHealth();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  return (
    <div>
      {!bannerDismissed && (
        <ApiHealthBanner 
          health={apiHealth} 
          onDismiss={() => setBannerDismissed(true)} 
        />
      )}
      {/* Rest of app */}
    </div>
  );
};
```

---

## Benefits

**✅ User Benefits**:
- **Honest UX**: Users know when system is degraded
- **Clear expectations**: Understand what will/won't work
- **Reduced frustration**: No wondering why data isn't loading
- **Trust**: System tells the truth about its state

**✅ Developer Benefits**:
- **Graceful degradation**: UI doesn't crash when APIs fail
- **Debugging aid**: Banner shows last check time and endpoint
- **Consistent pattern**: All pages use same health check
- **Testable**: Can simulate API failures

**✅ Operations Benefits**:
- **Visibility**: Teams know when APIs are down
- **Proactive**: Users notified before they encounter errors
- **SLA compliance**: System reports its own health

---

## Screen Machine Integration

**All generated pages MUST include**:

1. **Import health hook**:
   ```typescript
   import { useApiHealth } from '@hooks/useApiHealth';
   ```

2. **Add banner component**:
   ```typescript
   import { ApiHealthBanner } from '@components/ApiHealthBanner';
   ```

3. **Render banner** before main content:
   ```typescript
   const apiHealth = useApiHealth();
   return (
     <>
       <ApiHealthBanner health={apiHealth} />
       {/* Page content */}
     </>
   );
   ```

---

## Banner States

| Status | Color | Icon | Visibility | Message |
|--------|-------|------|------------|---------|
| **healthy** | Green | ✓ | Hidden | (no banner) |
| **checking** | Blue | ⏳ | Shown | "Checking API status..." |
| **degraded** | Yellow | ⚠ | Shown | "API returned {status}. Some features may not work." |
| **unavailable** | Red | ✕ | Shown | "API is unreachable. Displaying demo with mock data." |

---

## Accessibility

- **ARIA role**: `role="alert"` for screen readers
- **Live region**: `aria-live="polite"` for dynamic updates
- **Dismissible**: Users can close banner with `×` button
- **Keyboard nav**: Dismiss button is keyboard accessible

---

## Configuration

**Environment Variables**:
```env
VITE_DATA_MODEL_URL=https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
VITE_API_HEALTH_CHECK_INTERVAL=60000  # 60 seconds
VITE_API_HEALTH_CHECK_TIMEOUT=5000    # 5 seconds
```

---

## Testing Strategy

**Unit Tests**:
- useApiHealth hook returns correct status
- Banner renders for degraded/unavailable
- Banner hides for healthy status
- Dismiss functionality works

**Integration Tests**:
- Simulate API timeout → banner shows "unavailable"
- API returns 500 → banner shows "degraded"
- API returns 200 → banner hides

**E2E Tests**:
- Kill API server → banner appears within 5s
- Restart API server → banner disappears after next check (60s)

---

## Real-World Scenario

**Before Pattern** (Session 46 Bug #8):
```
User: "Why is the page blank? It says 'EVA Data Model UI Demo' but nothing loads."
Support: "The API is down. Please try again later."
User: "But the page loaded fine!"
Support: "The page shell loads, but data doesn't. It's confusing, we know."
```

**After Pattern**:
```
[Red Banner]: ✕ UNAVAILABLE: Data Model API is unreachable. 
              Displaying demo with mock data.
              The UI is functional, but data may be cached or simulated.
              
User: "I see a banner saying the API is down. Is this expected?"
Support: "Yes, we're doing maintenance. The banner will disappear when it's back."
User: "Got it, thanks for the clear message!"
```

---

## Related Patterns

- **SM-PATTERN-002**: MOCK_LITERALS for UI infrastructure labels
- **SM-PATTERN-003**: Cached data with staleness indicators
- **SM-PATTERN-004**: Retry mechanisms with exponential backoff

---

## References

- Session 46: Nested DPDCA bug fixes (commit db87af6)
- EVA Architecture: DPDCA methodology
- Project 37: Data Model API health endpoint

---

**Adoption Status**: ✅ Implemented in DemoApp (Session 46)  
**Next Step**: Generate this pattern for all 111 layer pages
