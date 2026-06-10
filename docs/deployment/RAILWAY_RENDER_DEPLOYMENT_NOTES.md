# SBTS Railway / Render Deployment Notes

## Railway

### Service
Create a Node.js service from the SBTS repository or uploaded project.

### Build command
```bash
pnpm install && pnpm build
```

### Start command
```bash
pnpm start
```

### Variables
Set:

```txt
NODE_ENV=production
PORT=3000
APP_PUBLIC_URL=https://your-railway-domain.up.railway.app
ALLOWED_ORIGIN=https://your-railway-domain.up.railway.app
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/SBTS_DB
COOKIE_SECURE=true
SBTS_APP_VERSION=16.0.0
```

Run once after deployment:

```bash
pnpm db:push
pnpm db:verify
pnpm seed:admin
```

## Render

### Service type
Use Web Service.

### Build command
```bash
pnpm install && pnpm build
```

### Start command
```bash
pnpm start
```

### Health check path
```txt
/api/health
```

### Variables
Same as Railway.

## Notes
- Use MySQL-compatible database for Sprint 16.
- PostgreSQL requires a separate migration sprint.
- Keep admin seed password only during setup.
- Browser PDF printing remains client-side through Chrome/Edge print dialog.
