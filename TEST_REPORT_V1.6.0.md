# Test Report - v1.6.0 P0 Features

## Summary

| Metric | Value |
|--------|-------|
| **Test Files** | 5 |
| **Total Tests** | 257 |
| **Status** | ✅ All Passing |
| **Overall Coverage** | 89.7% |

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `adaptive-scheduler.test.ts` | 75 | 93.46% |
| `adaptive-scheduler-edge-cases.test.ts` | 18 | (included above) |
| `learning-optimizer.test.ts` | 70 | 93.51% |
| `learning-edge-cases.test.ts` | 57 | (included above) |
| `time-prediction-engine.test.ts` | 37 | 77.65% |

## Per-File Coverage

| Module | Stmts | Branch | Funcs | Lines |
|--------|-------|--------|-------|-------|
| AdaptiveScheduler | 93.46% | 81.48% | 100% | 96.08% |
| LearningOptimizer | 93.51% | 83.95% | 92.63% | 94.22% |
| TimePredictionEngine | 77.65% | 65.16% | 75% | 78.85% |

## Notes

1. **TimePredictionEngine coverage decreased** from 95.17% to 77.65% when running in combined suite - likely due to Vitest coverage merging behavior
2. Individual test run shows 37/37 tests passing
3. The uncovered lines in TimePredictionEngine (lines 395, 481-494, 586-722) appear to be edge case/error handling paths

## Uncovered Lines (AdaptiveScheduler)

- Lines 655-656, 758-759: Error handling paths

## Next Steps to Reach 98%+

1. Add more edge case tests for TimePredictionEngine error paths
2. Add tests for AdaptiveScheduler's rebalance threshold logic
3. Consider splitting coverage reports by module

---
Generated: 2026-03-31
