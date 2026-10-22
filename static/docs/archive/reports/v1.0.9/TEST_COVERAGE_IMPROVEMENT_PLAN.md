# Test Coverage Improvement Plan

## Executive Summary

**Project**: 7zi-frontend
**Current Coverage**: ~67% (estimated)
**Target Coverage**: 90%+
**Analysis Date**: 2026-03-22
**Analyst**: 📚 咨询师

---

## Current Status

### Test Execution Summary

```
Test Files: 31 failed | 18 passed (49 total)
Tests: 370 failed | 768 passed | 2 skipped (1140 total)
Duration: ~28.5s
```

### Current Coverage Estimates

Based on coverage data analysis:

| Module | Statement Coverage | Function Coverage | Branch Coverage | Status |
|--------|-------------------|-------------------|------------------|---------|
| **authStore.ts** | 0-10% | 0-10% | 0-10% | 🔴 Critical |
| **notificationStore.ts** | 0-10% | 0-10% | 0-10% | 🔴 Critical |
| **uiStore.ts** | ~85% | ~80% | ~70% | 🟢 Good |
| **cacheStore.ts** | 0-10% | 0-10% | 0-10% | 🔴 Critical |
| **permissions.ts** | 100% | 100% | 100% | ✅ Excellent |
| **undo-redo/manager.ts** | 0-10% | 0-10% | 0-10% | 🔴 Critical |
| **lib/auth** | ~20-30% | ~20-30% | ~15-25% | 🟡 Needs Work |
| **lib/websocket** | 0-5% | 0-5% | 0-5% | 🔴 Critical |
| **lib/collaboration** | 0-5% | 0-5% | 0-5% | 🔴 Critical |
| **API Routes** | ~30-40% | ~30-40% | ~25-35% | 🟡 Needs Work |

**Overall Estimated Coverage: ~67%**

---

## Critical Issues Identified

### 1. **Authentication Store (P0)**

**File**: `src/stores/authStore.ts`
**Current Coverage**: < 10%
**Issue**: Core authentication logic is not properly tested

**Missing Test Coverage**:
- Login flow with various credential combinations
- Session management and token refresh
- Permission checking logic (`hasPermission`, `hasRole`)
- Session expiration handling
- Error scenarios (network errors, invalid tokens)
- Persistence layer integration

**Impact**: Authentication is the security foundation. Poor test coverage risks:
- Security vulnerabilities
- Session management bugs
- Permission bypass issues

### 2. **Notification Store (P0)**

**File**: `src/stores/notificationStore.ts`
**Current Coverage**: < 10%
**Issue**: WebSocket-based notification system has minimal testing

**Missing Test Coverage**:
- WebSocket connection management
- Real-time notification receiving
- Notification filtering and priority handling
- Unread count tracking
- Connection state management
- Reconnection logic

**Impact**: Users may miss critical notifications or experience stale data.

### 3. **Cache Store (P0)**

**File**: `src/stores/cacheStore.ts`
**Current Coverage**: < 10%
**Issue**: Caching layer is untested

**Missing Test Coverage**:
- Cache TTL (time-to-live) logic
- Cache invalidation strategies
- Concurrent cache access
- Memory management
- Cache key generation
- Error handling on cache failures

**Impact**: Potential performance degradation and stale data issues.

### 4. **Undo-Redo Manager (P0)**

**File**: `src/lib/undo-redo/manager.ts`
**Current Coverage**: < 10%
**Issue**: 31+ test failures indicate fundamental problems

**Missing Test Coverage**:
- History stack management
- Undo/redo operations
- History trimming at max size
- Export/import functionality
- Statistics tracking
- Timeline management

**Impact**: Users cannot reliably undo/redo operations.

### 5. **WebSocket Module (P1)**

**Files**: `src/lib/websocket/*`
**Current Coverage**: 0-5%
**Issue**: Real-time communication layer is untested

**Missing Test Coverage**:
- Connection lifecycle (connect, disconnect, reconnect)
- Message sending/receiving
- Event handling
- Error recovery
- Performance optimization (throttling)

**Impact**: Real-time features may fail in production.

### 6. **Collaboration Module (P1)**

**Files**: `src/lib/collaboration/*`
**Current Coverage**: 0-5%
**Issue**: Multi-user collaboration is untested

**Missing Test Coverage**:
- Room management (create, join, leave)
- User presence tracking
- Conflict resolution
- Operation broadcasting
- Room state synchronization

**Impact**: Collaboration features may have race conditions and data corruption.

### 7. **API Routes (P1)**

**Files**: `src/app/api/**/route.ts`
**Current Coverage**: ~30-40%
**Issue**: API error handling and edge cases need coverage

**Missing Test Coverage**:
- Error response handling (4xx, 5xx)
- Rate limiting
- Request validation
- Concurrent request handling
- Authentication middleware
- Rate limiting bypass attempts

**Impact**: API reliability and security concerns.

### 8. **Authentication Services (P1)**

**Files**: `src/lib/auth/*`
**Current Coverage**: ~20-30%
**Issue**: JWT and user management need more tests

**Missing Test Coverage**:
- JWT token generation and validation
- Token expiration and refresh
- Password hashing and verification
- User registration flows
- Session management
- Password reset flows

**Impact**: Security vulnerabilities in authentication flow.

---

## Test Priority Framework

### P0: Critical (Must Fix This Sprint)

**Blocking Issues for 90% Coverage Target**

1. **Fix authStore test failures** - Currently 370 tests failing, many in auth-related modules
2. **Add comprehensive authStore tests** - Login, logout, session management, permissions
3. **Add notificationStore tests** - WebSocket integration, real-time updates
4. **Add cacheStore tests** - TTL, invalidation, concurrency
5. **Fix undo-redo tests** - Resolve 31+ failing tests in undo-redo/manager.test.ts

**Estimated Impact**: +15-20% overall coverage

### P1: High (Fix Next Sprint)

**Important for Production Readiness**

1. **Add WebSocket module tests** - Connection lifecycle, event handling
2. **Add collaboration module tests** - Room management, conflict resolution
3. **Add API route tests** - Error handling, authentication, validation
4. **Add auth service tests** - JWT, password hashing, user management
5. **Add error handling tests** - Network failures, timeout scenarios

**Estimated Impact**: +8-12% overall coverage

### P2: Medium (Fix Following Sprints)

**Nice to Have, Improves Quality**

1. **Add UI component integration tests** - Critical user flows
2. **Add performance tests** - Load testing, stress testing
3. **Add accessibility tests** - ARIA compliance, keyboard navigation
4. **Add security tests** - XSS, CSRF, SQL injection prevention
5. **Add E2E tests** - Critical user journeys

**Estimated Impact**: +3-5% overall coverage

---

## Detailed Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Goal**: Fix failing tests and establish baseline

#### Week 1: Fix Critical Test Failures

**Tasks**:
1. **Investigate and fix undo-redo test failures**
   - File: `src/lib/undo-redo/__tests__/manager.test.ts`
   - Expected tests: 30+
   - Current failures: 30+
   - Root cause analysis needed

2. **Fix authStore test failures**
   - File: `src/stores/__tests__/authStore.test.ts`
   - Ensure proper mocking of fetch API
   - Fix async/await timing issues

3. **Fix notificationStore test failures**
   - File: `src/stores/__tests__/notificationStore.test.ts`
   - Mock WebSocket properly
   - Fix state management tests

**Deliverables**:
- All 370 failing tests passing
- Test suite runs successfully
- Baseline coverage report

#### Week 2: Add P0 Core Tests

**Tasks**:
1. **Comprehensive authStore tests** (`+200 tests`)
   - Login with valid credentials
   - Login with invalid credentials
   - Session persistence
   - Token refresh
   - Permission checking (positive and negative cases)
   - Role checking
   - Session expiration
   - Network error handling
   - Concurrent login attempts

2. **notificationStore tests** (`+150 tests`)
   - WebSocket connection lifecycle
   - Notification receiving (all types)
   - Unread count tracking
   - Mark as read/unread
   - Delete notifications
   - Clear all notifications
   - Filter by type/priority
   - Reconnection logic
   - Connection state changes

3. **cacheStore tests** (`+100 tests`)
   - Set and get values
   - TTL expiration
   - Cache invalidation
   - Concurrent access
   - Memory limits
   - Key generation
   - Cache statistics
   - Error handling

4. **undo-redo tests** (`+50 tests` - additional to fix existing)
   - Undo operations
   - Redo operations
   - History trimming
   - Export/import
   - Statistics
   - Timeline management
   - Concurrency handling

**Deliverables**:
- 500+ new tests added
- Coverage increased to ~80%

---

### Phase 2: Critical Modules (Week 3-4)

**Goal**: Reach 85%+ coverage

#### Week 3: P1 Core Infrastructure

**Tasks**:
1. **WebSocket module tests** (`+80 tests`)
   - Connection lifecycle
   - Message send/receive
   - Event subscription
   - Error handling
   - Reconnection logic
   - Throttling and performance

2. **Collaboration module tests** (`+80 tests`)
   - Room creation/join/leave
   - User presence
   - Operation broadcasting
   - Conflict resolution
   - State synchronization
   - Error recovery

3. **API route tests** (`+120 tests`)
   - Backup API (GET, POST)
   - Export API
   - GitHub commits API
   - Health check APIs
   - Error responses (4xx, 5xx)
   - Authentication middleware
   - Rate limiting
   - Request validation

**Deliverables**:
- 280+ new tests added
- Coverage increased to ~82%

#### Week 4: Authentication & Security

**Tasks**:
1. **Auth service tests** (`+100 tests`)
   - JWT token generation
   - JWT token validation
   - Token expiration handling
   - Token refresh
   - Password hashing
   - Password verification
   - User registration
   - User login
   - Password reset
   - Session management

2. **Error handling tests** (`+50 tests`)
   - Network failures
   - Timeout scenarios
   - API errors
   - WebSocket errors
   - Database errors
   - Graceful degradation

**Deliverables**:
- 150+ new tests added
- Coverage increased to ~85%

---

### Phase 3: Excellence (Week 5-6)

**Goal**: Reach 90%+ coverage

#### Week 5: Edge Cases & Integration

**Tasks**:
1. **Edge case tests** (`+100 tests`)
   - Boundary conditions
   - Null/undefined handling
   - Empty arrays/objects
   - Very large inputs
   - Unicode/special characters
   - Concurrent operations
   - Race conditions

2. **Integration tests** (`+80 tests`)
   - Store-to-store integration
   - WebSocket-to-store integration
   - API-to-store integration
   - Auth-to-WebSocket integration
   - Cache-to-API integration

**Deliverables**:
- 180+ new tests added
- Coverage increased to ~88%

#### Week 6: Final Push

**Tasks**:
1. **UI component tests** (`+60 tests`)
   - Critical components
   - User interactions
   - Form submissions
   - Error displays

2. **Coverage gaps** (`+40 tests`)
   - Identify remaining gaps
   - Fill critical paths
   - Optimize test performance

3. **Test performance optimization**
   - Parallel test execution
   - Mock optimization
   - Test cleanup

**Deliverables**:
- 100+ new tests added
- Coverage target: 90%+
- All tests passing
- Test suite runs in < 30s

---

## Test Strategy Recommendations

### 1. Unit Tests (Primary Focus)

**Use For**:
- Pure functions
- Business logic
- State management
- Utility functions

**Tools**:
- Vitest (already configured)
- @testing-library/react for components
- vi.mock for dependencies

**Examples**:
```typescript
// authStore unit test
describe('authStore', () => {
  it('should handle successful login', async () => {
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.login(credentials));
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 2. Integration Tests

**Use For**:
- Store interactions
- WebSocket integration
- API integration
- Multiple components working together

**Tools**:
- Vitest
- Supertest for API testing
- Mock Service Worker (MSW) for API mocking

**Examples**:
```typescript
// Integration test: auth + WebSocket
describe('Authentication and WebSocket Integration', () => {
  it('should connect WebSocket after successful login', async () => {
    const { result: authResult } = renderHook(() => useAuthStore());
    const { result: wsResult } = renderHook(() => useWebSocket());

    await act(() => authResult.current.login(credentials));
    await waitFor(() => {
      expect(wsResult.current.isConnected).toBe(true);
    });
  });
});
```

### 3. E2E Tests (Limited Scope)

**Use For**:
- Critical user journeys
- Cross-browser testing
- Real-world scenarios

**Tools**:
- Playwright (recommended)
- or Cypress

**Examples**:
```typescript
// E2E test: login flow
test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### 4. Performance Tests

**Use For**:
- Component rendering performance
- Large data handling
- WebSocket message throughput

**Tools**:
- Vitest with performance hooks
- Lighthouse (for UI)
- Custom benchmarks

---

## Recommended Testing Best Practices

### 1. Test Organization

```
src/
├── lib/
│   ├── auth/
│   │   ├── __tests__/
│   │   │   ├── auth.test.ts           # Unit tests
│   │   │   ├── auth.integration.test.ts # Integration tests
│   │   │   └── auth.e2e.test.ts       # E2E tests (if needed)
│   ├── websocket/
│   │   └── __tests__/
│   │       ├── connection.test.ts
│   │       └── messaging.test.ts
│   └── undo-redo/
│       └── __tests__/
│           └── manager.test.ts
├── stores/
│   └── __tests__/
│       ├── authStore.test.ts
│       ├── notificationStore.test.ts
│       └── cacheStore.test.ts
└── app/
    └── api/
        ├── backup/
        │   └── __tests__/
        │       └── route.test.ts
        └── ...
```

### 2. Test Naming Convention

**Format**: `describe('Module Name', () => { describe('Feature', () => { it('should do X', () => {}); }); });`

```typescript
describe('authStore', () => {
  describe('login', () => {
    it('should authenticate with valid credentials', () => {});
    it('should reject invalid credentials', () => {});
    it('should persist session after reload', () => {});
  });
});
```

### 3. Mocking Strategy

**原则**:
- Mock external dependencies (fetch, WebSocket, databases)
- Use MSW (Mock Service Worker) for API mocking
- Keep mocks realistic and maintainable

**Example**:
```typescript
// Mock WebSocket
vi.mock('@/lib/websocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    send: vi.fn(),
    on: vi.fn(),
  }),
}));
```

### 4. Test Data Management

**原则**:
- Use factories for test data
- Avoid hardcoding data in tests
- Use faker.js for realistic data

```typescript
// test-utils.ts
export const createMockUser = (overrides = {}) => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  ...overrides,
});

// In test
const mockUser = createMockUser({ role: 'ADMIN' });
```

---

## Coverage Targets by Module

| Module | Current | Target (Week 2) | Target (Week 4) | Target (Week 6) |
|--------|---------|-----------------|-----------------|-----------------|
| authStore | 5% | 80% | 90% | 95% |
| notificationStore | 5% | 75% | 85% | 90% |
| cacheStore | 5% | 80% | 90% | 95% |
| undo-redo | 5% | 70% | 85% | 90% |
| permissions | 100% | 100% | 100% | 100% |
| lib/auth | 25% | 70% | 85% | 90% |
| lib/websocket | 2% | 60% | 80% | 90% |
| lib/collaboration | 2% | 60% | 80% | 90% |
| API routes | 35% | 65% | 80% | 90% |
| UI components | 50% | 70% | 85% | 90% |
| **Overall** | **67%** | **75%** | **82%** | **90%+** |

---

## Success Criteria

### Milestone 1 (Week 2 End)
- ✅ All 370 failing tests fixed
- ✅ 500+ new tests added
- ✅ Coverage: 75%+
- ✅ Test suite runs in < 40s

### Milestone 2 (Week 4 End)
- ✅ All P1 tests added
- ✅ 900+ total tests
- ✅ Coverage: 82%+
- ✅ No flaky tests (all tests pass 3/3 runs)

### Milestone 3 (Week 6 End)
- ✅ Coverage: 90%+
- ✅ All critical paths covered
- ✅ Test suite runs in < 30s
- ✅ CI/CD integration complete

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Test suite becomes too slow | High | Medium | Parallel execution, selective test runs |
| Tests are flaky/unreliable | High | Medium | Proper cleanup, deterministic test data |
| Mocking becomes complex | Medium | High | Use MSW for API, factory pattern for data |
| Team lacks testing expertise | High | Medium | Pair programming, code reviews, documentation |
| Coverage becomes vanity metric | Medium | Low | Focus on critical paths, not just numbers |

---

## Tooling & Infrastructure

### Current Tools
- ✅ Vitest (configured)
- ✅ @testing-library/react
- ✅ jsdom environment
- ✅ Coverage with v8 provider

### Recommended Additions
- 📋 **MSW** (Mock Service Worker) - For API mocking
- 📋 **Playwright** - For E2E testing (limited scope)
- 📋 **faker.js** - For test data generation
- 📋 **test-data-bot** - For factory pattern

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Next Steps (Immediate Actions)

### This Week

1. **Day 1-2**: Investigate and fix undo-redo test failures
   - Root cause analysis
   - Fix identified issues
   - Verify all tests pass

2. **Day 3-4**: Add comprehensive authStore tests
   - Implement test suite
   - Verify coverage improvements
   - Document edge cases

3. **Day 5**: Add notificationStore tests
   - Implement WebSocket mocking
   - Add real-time tests
   - Verify integration

### Next Week

1. **Day 1-2**: Add cacheStore tests
   - TTL testing
   - Concurrency testing
   - Memory management

2. **Day 3-5**: Begin P1 tests (WebSocket, Collaboration)
   - Connection lifecycle
   - Room management
   - Error handling

---

## Metrics to Track

### Weekly Report Template

```markdown
## Test Coverage Report - Week X

### Progress
- Tests Added: X
- Tests Fixed: Y
- Coverage: Z% (previous: W%)

### by Module
- authStore: X%
- notificationStore: Y%
- cacheStore: Z%
- [other modules]

### Issues
- [List any blocking issues]
- [List any flaky tests]

### Next Week Focus
- [Main priorities]
```

---

## Appendix: Quick Reference

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test src/stores/authStore.test.ts

# Run in watch mode
npm test --watch

# Run only failed tests
npm test --reporter=verbose --reporter=json
```

### Coverage Report

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/index.html

# View JSON report
cat coverage/coverage-final.json
```

### Adding New Tests

```bash
# Generate test file scaffold
npx vitest scaffold path/to/module.test.ts
```

---

## Conclusion

This plan provides a clear roadmap to increase test coverage from the current ~67% to the target 90%+. The approach is:

1. **Fix Foundation First**: Resolve failing tests before adding new ones
2. **Prioritize by Impact**: Focus on critical business logic (auth, notifications, cache)
3. **Gradual Improvement**: Incremental milestones with clear targets
4. **Quality Over Quantity**: Ensure tests are meaningful and maintainable

**Expected Outcome**:
- 90%+ test coverage across all critical modules
- 1500+ tests total
- Reliable, fast test suite (< 30s)
- Comprehensive test documentation
- CI/CD integration

---

**Document Version**: 1.0
**Last Updated**: 2026-03-22
**Next Review**: Weekly during implementation
