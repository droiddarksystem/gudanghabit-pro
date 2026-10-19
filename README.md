# GudangHabit Pro — Cloudflare Workers + D1

Sistem checklist habit, aset gudang, dan serah terima shift.  
Hosted di **Cloudflare** (gratis, tanpa kartu kredit).

## Tech
- Cloudflare Workers (backend API)
- Cloudflare D1 (database SQLite)
- Static assets (frontend HTML/CSS/JS)

## Deploy dari komputer (sekali saja)

### 1. Install tools
```bash
npm install -g wrangler
wrangler login
```

### 2. Buat database D1
```bash
cd gudanghabit-cf
wrangler d1 create gudanghabit-db
```
Copy `database_id` yang muncul, tempel ke `wrangler.toml` (ganti `GANTI_DENGAN_DATABASE_ID`).

### 3. Jalankan migrasi (buat tabel)
```bash
wrangler d1 execute gudanghabit-db --file=./migrations/0001_init.sql
```

### 4. Deploy
```bash
npm install
npm run deploy
```

URL akan muncul, contoh: `https://gudanghabit-pro.USERNAME.workers.dev`

---

## Deploy lewat Dashboard Cloudflare (bisa dari HP + GitHub)

1. Upload/folder project ini ke GitHub
2. Cloudflare Dashboard → **Workers & Pages** → **Create**
3. Connect ke repo GitHub
4. Buat D1 database bernama `gudanghabit-db`
5. Bind D1 ke Worker (binding name: `DB`)
6. Jalankan SQL migrasi di tab D1 → Console (copy isi `migrations/0001_init.sql`)
7. Deploy

---

## Fitur
- Login & register
- Habit per divisi (Inbound, Outbound, Packing, Return, Tracer, Putaway, Forklift, Umum)
- Checklist aset gudang
- Serah terima shift (terkunci sampai syarat lengkap)
- Riwayat

## API
Sama seperti versi Node: `/api/register`, `/api/login`, `/api/habits`, `/api/aset`, dll.
