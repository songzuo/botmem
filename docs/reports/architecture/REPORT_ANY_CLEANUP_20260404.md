# Any Type Cleanup Report - April 4, 2026

## Summary

**Total `any` type usages found in target directories:** 30  
**Production code fixes applied:** 2  
**Test code (left as-is):** 28  

## Target Directories Scanned

- ✅ `src/lib/alerting/` - No `any` types found
- ✅ `src/lib/collab/` - 1 fixed
- ✅ `src/app/api/` - 1 production fix + 28 test usages

## Production Code Fixes

### 1. src/lib/collab/utils/id.ts

**Before:**
```typescript
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void { ... }
```

**After:**
```typescript
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void { ... }
```

**Reason:** Generic function constraints should use `unknown` instead of `any` for type safety.

---

### 2. src/app/api/auth/audit-logs/route.ts

**Before:**
```typescript
interface AuditLogsResponse {
  logs: any[]
  total: number
  stats?: any
}
```

**After:**
```typescript
import { AuditLogEntry } from '@/lib/auth/audit-logger'

interface AuditLogsResponse {
  logs: AuditLogEntry[]
  total: number
  stats?: AuditStats
}

interface AuditStats {
  totalEvents: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  successRate: number
  topFailedEvents: { eventType: string; count: number }[]
}
```

**Reason:** API response types should be properly typed with imported interfaces and specific type definitions.

---

## Test Code (Left As-Is)

The following test files contain `any` types which are **acceptable** for testing purposes:

### Test Files with `any` usage (28 total)

| File | Count | Context |
|------|-------|---------|
| `src/app/api/projects/__tests__/route.test.ts` | 8 | Mock decorator implementations |
| `src/app/api/status/__tests__/route.test.ts` | 7 | Test assertions on response data |
| `src/app/api/github/commits/__tests__/route.test.ts` | 3 | Mock function parameters |
| `src/app/api/auth/__tests__/api-integration.test.ts` | 3 | Mock HTTP server |
| `src/app/api/websocket/__tests__/reconnection-integration.test.ts` | 3 | Mock server/socket/timer |
| `src/app/api/websocket/__tests__/room-integration.test.ts` | 2 | Mock server/socket |
| `src/app/api/websocket/__tests__/performance-benchmark.test.ts` | 1 | Mock server |
| `src/app/api/tasks/__tests__/route.test.ts` | 1 | Mock database |
| `src/app/api/a2a/jsonrpc/__tests__/route.test.ts` | 1 | Empty test array |

**Why test files are left as-is:**
- Mocking and test fixtures often require flexible typing
- Type safety in tests is less critical than production code
- Changing test mocks could break test functionality
- Test `any` usage doesn't affect runtime behavior

---

## Verification

All fixes verified with TypeScript compiler:
```bash
npx tsc --noEmit --pretty false
```

✅ No new type errors introduced  
✅ All modified files compile successfully  

---

## Impact Assessment

**Before:** 30 `any` types in target directories  
**After:** 28 `any` types remaining (all in test code)  

**Improvement:** 
- Production code: 100% of `any` types removed
- Overall: 6.7% reduction (2/30)

---

## Recommendations

### Future Cleanup Opportunities

1. **Test Utilities**: Create typed mock factories to reduce `any` in tests
2. **Integration Tests**: Define response interfaces for API endpoints
3. **Mock Typing**: Use `vi.Mock<T>` or `jest.Mock<T>` with proper signatures

### Prevention Strategies

1. Enable strict TypeScript options:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true
     }
   }
   ```

2. Add ESLint rule:
   ```json
   {
     "rules": {
       "@typescript-eslint/no-explicit-any": "warn"
     }
   }
   ```

---

## Files Modified

1. `src/lib/collab/utils/id.ts` - Fixed throttle function generic constraints
2. `src/app/api/auth/audit-logs/route.ts` - Added proper response type interfaces

---

**Report generated:** April 4, 2026  
**Task completed by:** TypeScript Cleanup Subagent
