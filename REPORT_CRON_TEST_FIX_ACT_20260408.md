# usePerformanceMonitor Test Fix - 2026-04-08

## Task
Fix React act() warnings in `usePerformanceMonitor.test.ts`

## Fix Applied

**File**: `/root/.openclaw/workspace/7zi-frontend/src/hooks/__tests__/usePerformanceMonitor.test.ts`

**Change**: Removed `vi.useFakeTimers()` from beforeEach (line 68)

### Before:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})
```

### After:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  // Removed vi.useFakeTimers() - causes act() warnings with async/await
})
```

## Rationale

`vi.useFakeTimers()` with async/await causes React act() warnings because fake timers don't properly advance React's internal timing. The tests using `waitFor` and `act()` work better with real timers.

## Status
- ✅ Fix applied directly
- Models: ALL DOWN (56+ hours) - couldn't run tests to verify
</parameter>
