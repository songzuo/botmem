# ESLint Config - 2026-04-09

## Fix Applied

**Created:** `/root/.openclaw/workspace/7zi-frontend/.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "off"
  }
}
```

## Notes
- Uses `next/core-web-vitals` + `next/typescript`
- `no-explicit-any`: off (too strict for existing codebase)
- `no-unused-vars`: warn (less disruptive)

## Status
- ✅ ESLint config created
- ⚠️ Could not run `pnpm lint` to verify (model outage)
</parameter>
