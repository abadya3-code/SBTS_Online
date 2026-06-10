# SBTS Pilot Deployment Notes

## Local pilot run

```powershell
pnpm install
copy .env.example .env
pnpm db:push
pnpm db:verify
pnpm qa:full
pnpm dev
```

## Production-like run

```powershell
pnpm install
pnpm db:push
pnpm db:verify
pnpm check
pnpm build
pnpm start
```

## Environment variables

```txt
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/SBTS_DB
PORT=3000
NODE_ENV=production
SBTS_AUTH_MODE=password
SBTS_SESSION_HOURS=12
```

## Recommended browser
Use Microsoft Edge or Google Chrome.

## Print settings
For certificates/reports:
- Paper: A4
- Scale: 100%
- Background graphics: enabled

For tags:
- Paper: 11 cm × 7 cm where printer supports custom size
- Scale: 100%
- Background graphics: enabled

## Pilot recommendation
Run the first pilot in a controlled environment with duplicated/non-critical data. Do not replace official isolation records until pilot sign-off.
