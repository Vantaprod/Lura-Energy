# Lura Energy — Developer Notes

## Start dev
npm run dev
# Opens on http://localhost:3000

## Key URLs
- Public: http://localhost:3000
- Admin: /admin/login
- Master: /admin/master
- Notifications: /admin/notifications
- Audit log: /admin/audit-log
- Audit CSV: /api/admin/audit-log/export

## Login
- Master: josephchimaobi28@gmail.com / Luraenergy2026
- Test: test-admin@luraenergy.local / Luraenergy2026

## Required .env
DATABASE_URL, DIRECT_URL, SESSION_SECRET, APP_URL,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, CRON_SECRET

## Database (Neon)
"SELECT 1;" | npx prisma db execute --stdin --schema prisma\schema.prisma
npx prisma generate
npx prisma migrate dev --name X

WARNING: URLs must NOT contain channel_binding=require.

## Email digest
- Cron: /api/cron/digest (daily 06:00 UTC)
- Manual: curl.exe -s -H "Authorization: Bearer $CRON_SECRET" "https://www.luraenergy.com/api/cron/digest"
- UI: /admin/master → Email digest card

## Reset dev
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force '.next' -ErrorAction SilentlyContinue
npm run dev

## Gotchas
1. Never .Replace() on dictionaries.ts with key anchors — hits all 3 language blocks.
2. PowerShell here-strings mangle French apostrophes.
3. SW disabled on localhost (public/sw-nuke.js).
4. npx prisma generate fails if dev running — kill node first.
5. Hard refresh browser twice after dictionaries.ts or layout.tsx edits.
6. Never regex-strip CSS. Append higher-specificity overrides instead.

## Accounts
Neon: console.neon.tech
Vercel: project lura-energy
Resend: domain luraenergy.com verified
DNS: Cloudflare