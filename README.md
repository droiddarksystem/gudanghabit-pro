# GudangHabit Pro — Fullstack (Node.js + SQLite)

Sistem checklist habit, aset gudang, dan serah terima shift untuk operasional logistik.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: Token session + bcrypt password hash
- **Frontend**: HTML / CSS / Vanilla JS

## Cara Menjalankan

```bash
cd server
npm install
npm start
```

Lalu buka browser: **http://localhost:3000**

## Struktur Folder

```
gudanghabit-fullstack/
├── public/          → Frontend (HTML, CSS, JS)
├── server/
│   ├── index.js     → API server
│   ├── db.js        → SQLite setup & tables
│   ├── package.json
│   └── gudanghabit.db  (otomatis dibuat saat pertama jalan)
└── README.md
```

## API Endpoints

| Method | Path | Keterangan |
|--------|------|------------|
| POST | /api/register | Daftar akun |
| POST | /api/login | Login |
| POST | /api/logout | Logout |
| GET | /api/me | Info user login |
| GET/POST | /api/habits | Checklist habit |
| GET/POST | /api/aset | Checklist aset |
| GET/POST | /api/notes | Catatan shift |
| GET/POST | /api/serah-manual | Item manual serah terima |
| GET/POST | /api/serah-terima | Riwayat serah terima |
| GET | /api/habits/history | Progress 7 hari |

## Fitur
- Login & register (password di-hash)
- Habit checklist per divisi (Inbound, Outbound, Packing, Return, Tracer, Putaway, Forklift, Umum)
- Checklist aset gudang (wajib & opsional)
- Serah terima shift terkunci sampai semua syarat terpenuhi
- Riwayat serah terima & progress habit
- Data tersimpan di SQLite (file `gudanghabit.db`)
