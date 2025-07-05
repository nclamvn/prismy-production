# 🚨 ROLLBACK PROCEDURE

## Current Stable Production
- **Deployment ID**: `prismy-v2-ir1s3fv9j-nclamvn-gmailcoms-projects.vercel.app`
- **Domain**: `https://prismy.in` 
- **Branch**: `fix/ssr-hydration` (created from feature/ocr-worker)
- **Status**: Working but has SSR/hydration issues

## Quick Rollback Command
```bash
npx vercel alias set prismy-v2-ir1s3fv9j-nclamvn-gmailcoms-projects.vercel.app prismy.in
```

## Issues Being Fixed
1. **SSR/CSR Locale Mismatch**: `/en` serves Vietnamese HTML, causes React 418 hydration error
2. **Theme Flash**: No server-side theme class, client-side theme change causes flash
3. **Double Locale URLs**: Language switcher creates `/en/vi` invalid URLs

## Testing Checklist
- [ ] Zero React 418 errors in console
- [ ] `/en` shows English content immediately (no Vietnamese flash)
- [ ] Theme switching without page flash
- [ ] No `/en/vi` URLs possible
- [ ] Vietnamese + Light theme defaults preserved