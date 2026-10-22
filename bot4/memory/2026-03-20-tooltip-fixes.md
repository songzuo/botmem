# Memory - 2026-03-20

## Tooltip Test Fixes

Fixed 16/22 failing Tooltip tests by:
1. Adding `await waitFor` after `fireEvent.mouseEnter/focus` in position/size/dark mode tests
   - React state updates are async; without waitFor, assertions run before tooltip renders
   - Tests affected: all Position tests (4), all Size tests (3), Dark Mode (1)
2. Using `screen.getByRole('tooltip')` instead of `.parentElement`
   - Tooltip has `role="tooltip"`, making it more reliable to query
   - `.parentElement` returned the wrapper div, not the tooltip div
3. Wrapping `vi.advanceTimersByTime` in `act()` for fake timer tests
   - React's timer updates need act() to flush state changes
   - Tests affected: respects show delay, respects hide delay

Result: Tooltip.test.tsx: 16 failed → 0 failed (22/22 passing)

## Key Lesson Learned

When using `fireEvent` to trigger React state updates, always wrap subsequent assertions in `await waitFor` to ensure React has processed the updates. This is especially important for components that:
- Use `setTimeout` for delays (like show/hide delays)
- Update state in event handlers
- Use `cloneElement` to attach event handlers to children

## Other Notes

- Total tests: 4966 (up from 4686)
- Passing: 4346 (87.5%)
- Failing: 620 (12.5%)
- TypeScript errors: 550 (down from 514, some test errors)
