const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const sessions = new Map();

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = sessions.get(token);
  next();
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ===================== AUTH =====================
app.post("/api/register", (req, res) => {
  try {
    const { username, password, name, divisi } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Password minimal 4 karakter" });
    }
    const uname = username.toLowerCase().trim();
    if (db.getUser(uname)) {
      return res.status(400).json({ error: "Username sudah terdaftar" });
    }
    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    db.addUser({
      id,
      username: uname,
      password: hash,
      name: name.trim(),
      divisi: divisi || "general",
      created_at: new Date().toISOString()
    });
    res.json({ success: true, message: "Akun berhasil dibuat" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.getUser((username || "").toLowerCase().trim());
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Username atau password salah" });
    }
    const token = uuidv4();
    sessions.set(token, {
      userId: user.id,
      username: user.username,
      name: user.name,
      divisi: user.divisi
    });
    res.json({
      token,
      user: { username: user.username, name: user.name, divisi: user.divisi }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/logout", auth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  sessions.delete(token);
  res.json({ success: true });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: req.user });
});

// ===================== HABITS =====================
app.get("/api/habits", auth, (req, res) => {
  const tgl = req.query.tanggal || today();
  const sh = req.query.shift || "pagi";
  const div = req.query.divisi || req.user.divisi;
  const key = db.getHabitKey(req.user.userId, tgl, sh, div);
  const data = db.get().habit_logs[key] || {};
  res.json({ data });
});

app.post("/api/habits/toggle", auth, (req, res) => {
  const tgl = req.body.tanggal || today();
  const sh = req.body.shift || "pagi";
  const div = req.body.divisi || req.user.divisi;
  const habit_id = req.body.habit_id;
  const key = db.getHabitKey(req.user.userId, tgl, sh, div);
  const store = db.get();
  if (!store.habit_logs[key]) store.habit_logs[key] = {};
  store.habit_logs[key][habit_id] = !store.habit_logs[key][habit_id];
  db.set(store);
  res.json({ done: !!store.habit_logs[key][habit_id] });
});

// ===================== ASET =====================
app.get("/api/aset", auth, (req, res) => {
  const tgl = req.query.tanggal || today();
  const sh = req.query.shift || "pagi";
  const key = db.getAsetKey(req.user.userId, tgl, sh);
  const data = db.get().aset_logs[key] || {};
  res.json({ data });
});

app.post("/api/aset/toggle", auth, (req, res) => {
  const tgl = req.body.tanggal || today();
  const sh = req.body.shift || "pagi";
  const aset_id = req.body.aset_id;
  const key = db.getAsetKey(req.user.userId, tgl, sh);
  const store = db.get();
  if (!store.aset_logs[key]) store.aset_logs[key] = {};
  store.aset_logs[key][aset_id] = !store.aset_logs[key][aset_id];
  db.set(store);
  res.json({ done: !!store.aset_logs[key][aset_id] });
});

// ===================== NOTES =====================
app.get("/api/notes", auth, (req, res) => {
  const tgl = req.query.tanggal || today();
  const sh = req.query.shift || "pagi";
  const key = db.getNotesKey(req.user.userId, tgl, sh);
  res.json({ content: db.get().notes[key] || "" });
});

app.post("/api/notes", auth, (req, res) => {
  const tgl = req.body.tanggal || today();
  const sh = req.body.shift || "pagi";
  const key = db.getNotesKey(req.user.userId, tgl, sh);
  const store = db.get();
  store.notes[key] = req.body.content || "";
  db.set(store);
  res.json({ success: true });
});

// ===================== SERAH MANUAL =====================
app.get("/api/serah-manual", auth, (req, res) => {
  const tgl = req.query.tanggal || today();
  const sh = req.query.shift || "pagi";
  const key = db.getSerahManualKey(req.user.userId, tgl, sh);
  res.json({ data: db.get().serah_manual[key] || {} });
});

app.post("/api/serah-manual/toggle", auth, (req, res) => {
  const tgl = req.body.tanggal || today();
  const sh = req.body.shift || "pagi";
  const item_id = req.body.item_id;
  const key = db.getSerahManualKey(req.user.userId, tgl, sh);
  const store = db.get();
  if (!store.serah_manual[key]) store.serah_manual[key] = {};
  store.serah_manual[key][item_id] = !store.serah_manual[key][item_id];
  db.set(store);
  res.json({ done: !!store.serah_manual[key][item_id] });
});

// ===================== SERAH TERIMA =====================
app.post("/api/serah-terima", auth, (req, res) => {
  const { penerima, catatan, habit_pct, shift, divisi } = req.body;
  if (!penerima) return res.status(400).json({ error: "Nama penerima wajib diisi" });

  const store = db.get();
  store.serah_terima.unshift({
    id: Date.now(),
    user_id: req.user.userId,
    tanggal: today(),
    shift: shift || "pagi",
    divisi: divisi || req.user.divisi,
    dari_nama: req.user.name,
    penerima,
    catatan: catatan || "",
    habit_pct: habit_pct || 0,
    waktu: new Date().toLocaleString("id-ID")
  });
  store.serah_terima = store.serah_terima.slice(0, 100);
  db.set(store);
  res.json({ success: true });
});

app.get("/api/serah-terima", auth, (req, res) => {
  const rows = db.get().serah_terima.filter(h => h.user_id === req.user.userId);
  res.json({ data: rows });
});

// ===================== HABIT HISTORY =====================
app.get("/api/habits/history", auth, (req, res) => {
  const div = req.query.divisi || req.user.divisi;
  const result = [];
  const store = db.get();

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    let best = 0;
    for (const sh of ["pagi", "siang", "malam"]) {
      const key = db.getHabitKey(req.user.userId, tgl, sh, div);
      const data = store.habit_logs[key] || {};
      const done = Object.values(data).filter(Boolean).length;
      const pct = Math.round((done / 7) * 100);
      if (pct > best) best = pct;
    }
    result.push({
      tanggal: tgl,
      label: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }),
      percent: best
    });
  }
  res.json({ data: result });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  GudangHabit Pro Server → http://localhost:${PORT}\n`);
});
