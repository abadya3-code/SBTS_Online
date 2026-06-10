# SBTS Pilot Quick Start

## 1. Install
```powershell
pnpm install
```

## 2. Configure database
```powershell
copy .env.example .env
```

Edit:
```txt
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/SBTS_DB
```

## 3. Apply and verify database
```powershell
pnpm db:push
pnpm db:verify
```

## 4. Run QA
```powershell
pnpm qa:security
pnpm qa:approval
pnpm qa:print
pnpm qa:pilot
pnpm check
pnpm build
```

## 5. Run application
```powershell
pnpm dev
```

## 6. Pilot documents
Open:
```txt
docs/pilot/PILOT_CHECKLIST.md
docs/pilot/PILOT_ADMIN_GUIDE.md
docs/pilot/PILOT_USER_GUIDE.md
docs/pilot/PILOT_ACCEPTANCE_FORM.md
```

## 7. Sample data
Use:
```txt
samples/pilot_sample_data.json
samples/pilot_blinds_import_template.csv
```
