# Dark Mode Flicker Fix Report
Time: Mon Apr  6 19:40:44 CEST 2026

## Dark Mode Files
src/lib/theme
src/lib/theme/theme-config.ts
src/lib/theme/__tests__/theme.test.tsx
src/lib/theme/__tests__/profile-theme-integration.test.tsx
src/lib/theme/theme-script.ts
src/lib/theme/theme.css
src/app/demo/theme

## Theme Detection Code
src/lib/db/__tests__/draft-storage.test.ts:247:          theme: string
src/lib/db/__tests__/draft-storage.test.ts:254:        config: { theme: 'dark', language: 'en' },
src/lib/db/__tests__/draft-storage.test.ts:260:      await manager.updateDraft<TestData>(draftId, { name: 'Test', config: { theme: 'light' } })
src/lib/db/__tests__/draft-storage.test.ts:263:      // 因为只传入了 { theme: 'light' }，所以 language 丢失
src/lib/db/__tests__/draft-storage.test.ts:266:        config: { theme: 'light' },
src/lib/db/__tests__/draft-storage.test.ts:502:            theme: string
src/lib/db/__tests__/draft-storage.test.ts:519:            theme: 'dark',
src/lib/reporting/report-generator.ts:41:  theme?: 'light' | 'dark'
src/lib/reporting/report-generator.ts:235:      theme: 'light',
src/lib/theme/theme-config.ts:3: * Defines theme modes, colors, and settings
src/lib/theme/theme-config.ts:6:export type ThemeMode = 'light' | 'dark' | 'system';
src/lib/theme/theme-config.ts:55:    dark: ThemeColors;
src/lib/theme/theme-config.ts:69:export const themeConfig: ThemeConfig = {
src/lib/theme/theme-config.ts:115:    dark: {
src/lib/theme/theme-config.ts:172: * Get the actual theme based on mode
src/lib/theme/theme-config.ts:174:export function getResolvedTheme(mode: ThemeMode): 'light' | 'dark' {
src/lib/theme/theme-config.ts:178:      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
src/lib/theme/theme-config.ts:187: * Get time-based theme
src/lib/theme/theme-config.ts:189:export function getTimeBasedTheme(): 'light' | 'dark' {
src/lib/theme/theme-config.ts:191:  const { dayStart, nightStart } = themeConfig.autoSwitch;

## Global CSS Dark Mode

## Solution
Add blocking inline script in layout.tsx head to set theme before render:
  (function(){...
})()

Done at Mon Apr  6 19:40:44 CEST 2026
