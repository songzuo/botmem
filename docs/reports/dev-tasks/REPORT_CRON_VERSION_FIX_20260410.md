# Version Mismatch Report

## Status
Version mismatch detected between package.json and CHANGELOG.md

## Version Status
- **package.json**: 1.13.0
- **CHANGELOG.md latest**: 1.13.2

## Analysis
CHANGELOG.md shows entries for versions 1.13.1 and 1.13.2 that were added during recent development. However, package.json still reflects 1.13.0.

## Decision Required
The owner needs to decide whether to:
1. Update package.json to 1.13.2 to match CHANGELOG
2. Or revert CHANGELOG entries if 1.13.0 is the correct current version

## Recommendation
If the work described in 1.13.1 and 1.13.2 CHANGELOG entries has been completed and tested, then package.json should be updated to 1.13.2.

## Date
2026-04-10