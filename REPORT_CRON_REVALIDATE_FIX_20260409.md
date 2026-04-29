# revalidateTag Fix - 2026-04-09

## Task
Fix Next.js 16 `revalidateTag()` API - remove second `'max'` parameter

## Files Modified

### 1. `src/app/actions/revalidate.ts`
- Removed `'max'` parameter from all `revalidateTag()` calls
- Updated comments to reflect Next.js 16 API

**Before:**
```typescript
revalidateTag('posts', 'max')
revalidateTag('projects', 'max')
```

**After:**
```typescript
revalidateTag('posts')
revalidateTag('projects')
```

### 2. `src/app/api/revalidate/__tests__/new_cache_api.test.ts`
- Fixed 8 test assertions to expect single parameter
- Updated test descriptions

## Status
- ✅ revalidate.ts fixed
- ✅ Test file updated
- Models: ALL DOWN (72+ hours) - couldn't run tests to verify
</parameter>
