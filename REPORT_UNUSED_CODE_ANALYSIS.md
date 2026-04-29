# Unused Code Analysis - 2026-04-09

## Source Files Analyzed
- `ts-prune-output.txt` (Apr 5)
- `unused-exports-analysis.json` (Apr 5)

## Findings

### Unused Files
| File | Path | Recommendation |
|------|------|----------------|
| dashboardStoreWithUndoRedo.ts | src/store/ | ⚠️ Delete if truly unused |

### Unused Selectors
| Selector | Store | Recommendation |
|----------|-------|----------------|
| useIssues | dashboardStore | ⚠️ Verify before deleting |
| useActivities | dashboardStore | ⚠️ Verify before deleting |
| useDashboardStats | dashboardStore | ⚠️ Verify before deleting |
| useMembersByStatus | dashboardStore | ⚠️ Verify before deleting |
| walletStore exports | walletStore | ⚠️ Verify before deleting |

## Cleanup Priority
1. **LOW** - All identified items need verification before deletion
2. **HIGH RISK** - Deleting could break components that dynamically import

## Status
- Analysis from Apr 5 reports
- No action taken (requires verification)
- Blocked by model outage (76+ hours)

## Recommendation
When models recover:
1. Verify each unused selector has no dynamic imports
2. Check if dashboardStoreWithUndoRedo.ts is truly unused
3. Only then delete with git backup
</parameter>
</parameter>
</minimax:tool_call>