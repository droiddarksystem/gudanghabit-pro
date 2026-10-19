// ===================== API HELPER =====================
const API = "";
let token = localStorage.getItem("ghpro_token") || null;

async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request gagal");
  return data;
}

// ===================== DATA MASTER =====================
const HABITS = {
  inbound: [
    { id: "in1", title: "Cek surat jalan & dokumen", desc: "SJ, PO lengkap", badge: "quality" },
    { id: "in2", title: "Hitung & cocokkan jumlah barang", desc: "Fisik vs dokumen", badge: "quality" },
    { id: "in3", title: "Cek kondisi barang", desc: "Laporkan jika rusak", badge: "quality" },
    { id: "in4", title: "Scan / input sistem penerimaan", desc: "WMS/ERP benar", badge: "prod" },
    { id: "in5", title: "Letakkan di area staging", desc: "Sesuai zona", badge: "prod" },
    { id: "in6", title: "Update status inbound selesai", desc: "Konfirmasi sistem", badge: "disc" },
    { id: "in7", title: "Pakai APD lengkap", desc: "Sepatu, rompi, helm", badge: "safety" },
  ],
  outbound: [
    { id: "out1", title: "Cek picking list / order", desc: "Order sudah benar", badge: "quality" },
    { id: "out2", title: "Ambil barang FIFO/FEFO", desc: "Barang lama duluan", badge: "quality" },
    { id: "out3", title: "Scan barcode setiap item", desc: "Hindari salah kirim", badge: "quality" },
    { id: "out4", title: "Cek ulang jumlah & jenis", desc: "Double-check", badge: "quality" },
    { id: "out5", title: "Serahkan ke packing", desc: "Label & dokumen lengkap", badge: "prod" },
    { id: "out6", title: "Update status outbound", desc: "Tracking akurat", badge: "disc" },
    { id: "out7", title: "Pakai APD & hati-hati di jalur", desc: "Keselamatan", badge: "safety" },
  ],
  packing: [
    { id: "pk1", title: "Cek kelengkapan dari outbound", desc: "Jumlah & jenis sesuai", badge: "quality" },
    { id: "pk2", title: "Pilih kemasan sesuai", desc: "Ukuran & kekuatan", badge: "quality" },
    { id: "pk3", title: "Packing rapi & aman", desc: "Pelindung jika perlu", badge: "quality" },
    { id: "pk4", title: "Tempel label alamat benar", desc: "Nama, alamat, HP jelas", badge: "quality" },
    { id: "pk5", title: "Scan & update status packing", desc: "Masuk sistem", badge: "prod" },
    { id: "pk6", title: "Siapkan dokumen pengiriman", desc: "Resi / surat jalan", badge: "disc" },
    { id: "pk7", title: "Rapikan area packing", desc: "Kardus & sisa material", badge: "disc" },
  ],
  return: [
    { id: "rt1", title: "Terima & catat barang retur", desc: "Dari kurir/customer", badge: "quality" },
    { id: "rt2", title: "Cek alasan & kondisi retur", desc: "Rusak / salah kirim dll", badge: "quality" },
    { id: "rt3", title: "Foto barang retur", desc: "Dokumentasi kondisi", badge: "quality" },
    { id: "rt4", title: "Input data retur ke sistem", desc: "Lengkap & akurat", badge: "prod" },
    { id: "rt5", title: "Pisahkan barang (baik/rusak/quarantine)", desc: "Sesuai kategori", badge: "prod" },
    { id: "rt6", title: "Laporkan ke supervisor/QC", desc: "Keputusan lanjutan", badge: "disc" },
    { id: "rt7", title: "Update status retur selesai", desc: "Inventory akurat", badge: "disc" },
  ],
  tracer: [
    { id: "tr1", title: "Cek lokasi barang sesuai sistem", desc: "Rak & bin code", badge: "quality" },
    { id: "tr2", title: "Cycle count / stock opname harian", desc: "Sesuai jadwal area", badge: "prod" },
    { id: "tr3", title: "Laporkan selisih stok segera", desc: "Jangan ditunda", badge: "quality" },
    { id: "tr4", title: "Update lokasi barang di sistem", desc: "Jika ada pindah", badge: "prod" },
    { id: "tr5", title: "Cek barang expired / near expired", desc: "FEFO dijaga", badge: "quality" },
    { id: "tr6", title: "Bantu cari barang hilang/salah lokasi", desc: "Responsif", badge: "disc" },
    { id: "tr7", title: "Dokumentasikan temuan", desc: "Logbook / sistem", badge: "disc" },
  ],
  putaway: [
    { id: "pa1", title: "Ambil barang dari staging inbound", desc: "Sesuai prioritas", badge: "prod" },
    { id: "pa2", title: "Cek lokasi penyimpanan di sistem", desc: "Rak kosong / kategori", badge: "quality" },
    { id: "pa3", title: "Simpan sesuai FIFO/FEFO", desc: "Barang lama di depan", badge: "quality" },
    { id: "pa4", title: "Scan lokasi & barang saat simpan", desc: "Sistem akurat", badge: "quality" },
    { id: "pa5", title: "Susun rapi & aman di rak", desc: "Tidak overload", badge: "safety" },
    { id: "pa6", title: "Update status putaway selesai", desc: "Di WMS", badge: "disc" },
    { id: "pa7", title: "Laporkan rak penuh / bermasalah", desc: "Ke supervisor", badge: "disc" },
  ],
  forklift: [
    { id: "fk1", title: "Cek kondisi forklift sebelum pakai", desc: "Ban, rem, oli, baterai", badge: "safety" },
    { id: "fk2", title: "Isi checklist harian alat", desc: "Tanda tangan", badge: "disc" },
    { id: "fk3", title: "Pakai APD lengkap", desc: "Sepatu safety, helm", badge: "safety" },
    { id: "fk4", title: "Patuhi kecepatan & jalur", desc: "Tidak ngebut", badge: "safety" },
    { id: "fk5", title: "Angkut barang dengan aman", desc: "Tidak overload", badge: "safety" },
    { id: "fk6", title: "Parkir di area ditentukan", desc: "Kunci dicabut", badge: "disc" },
    { id: "fk7", title: "Laporkan kerusakan alat segera", desc: "Jangan dipaksakan", badge: "safety" },
  ],
  general: [
    { id: "gn1", title: "Hadir tepat waktu / 10 menit awal", desc: "Siap sebelum briefing", badge: "disc" },
    { id: "gn2", title: "Ikuti briefing awal shift", desc: "Dengarkan instruksi", badge: "disc" },
    { id: "gn3", title: "Pakai APD sepanjang shift", desc: "Tidak dilepas", badge: "safety" },
    { id: "gn4", title: "Jaga kebersihan area kerja", desc: "Tidak buang sampah sembarangan", badge: "disc" },
    { id: "gn5", title: "Komunikasi jelas ke rekan & SPV", desc: "Laporkan kendala", badge: "prod" },
    { id: "gn6", title: "Serah-terima shift rapi", desc: "Info penting disampaikan", badge: "disc" },
    { id: "gn7", title: "Tidak main HP di area kerja", desc: "Kecuali dinas", badge: "disc" },
  ]
};

const DIVISI_LABEL = {
  inbound: "Inbound", outbound: "Outbound", packing: "Packing",
  return: "Return", tracer: "Tracer", putaway: "Putaway",
  forklift: "Forklift", general: "Umum"
};

const ASET_LIST = [
  { id: "a1", title: "Forklift / Reach Truck", desc: "Kondisi baik, BBM/baterai cukup", wajib: true },
  { id: "a2", title: "Hand Pallet / Pallet Jack", desc: "Roda & handle normal", wajib: true },
  { id: "a3", title: "Scanner Barcode / HT", desc: "Baterai & koneksi OK", wajib: true },
  { id: "a4", title: "Timbangan", desc: "Kalibrasi & fungsi normal", wajib: false },
  { id: "a5", title: "APD Cadangan (helm, sepatu, rompi)", desc: "Tersedia di pos", wajib: true },
  { id: "a6", title: "Alat Pemadam (APAR)", desc: "Tekanan & segel OK", wajib: true },
  { id: "a7", title: "P3K / Kotak P3K", desc: "Isi lengkap & tidak expired", wajib: true },
  { id: "a8", title: "Lampu & Penerangan Gudang", desc: "Semua area terang", wajib: false },
  { id: "a9", title: "Pintu / Rolling Door", desc: "Buka-tutup lancar & aman", wajib: false },
  { id: "a10", title: "Komputer / Printer Admin", desc: "Siap pakai untuk dokumen", wajib: false },
];

// ===================== STATE =====================
let currentUser = null;
let currentDivisi = "general";
let currentShift = "pagi";
let habitData = {};
let asetData = {};
let manualSerah = {};
let notesContent = "";

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".login-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".login-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("loginForm").style.display = tab.dataset.tab === "login" ? "block" : "none";
      document.getElementById("registerForm").style.display = tab.dataset.tab === "register" ? "block" : "none";
    });
  });

  if (token) {
    try {
      const res = await api("GET", "/api/me");
      currentUser = res.user;
      enterApp();
    } catch {
      token = null;
      localStorage.removeItem("ghpro_token");
    }
  }
});

// ===================== AUTH =====================
async function handleRegister(e) {
  e.preventDefault();
  try {
    await api("POST", "/api/register", {
      name: document.getElementById("regName").value.trim(),
      username: document.getElementById("regUser").value.trim(),
      password: document.getElementById("regPass").value,
      divisi: document.getElementById("regDivisi").value
    });
    toast("Akun berhasil dibuat! Silakan masuk.");
    document.querySelector('.login-tab[data-tab="login"]').click();
    document.getElementById("loginUser").value = document.getElementById("regUser").value.trim();
  } catch (err) {
    toast(err.message);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const res = await api("POST", "/api/login", {
      username: document.getElementById("loginUser").value.trim(),
      password: document.getElementById("loginPass").value
    });
    token = res.token;
    localStorage.setItem("ghpro_token", token);
    currentUser = res.user;
    enterApp();
  } catch (err) {
    toast(err.message);
  }
}

async function logout() {
  try { await api("POST", "/api/logout"); } catch {}
  token = null;
  localStorage.removeItem("ghpro_token");
  currentUser = null;
  document.getElementById("appScreen").classList.remove("active");
  document.getElementById("loginScreen").classList.add("active");
}

function enterApp() {
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("appScreen").classList.add("active");
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userDivisi").textContent = DIVISI_LABEL[currentUser.divisi] || currentUser.divisi;
  currentDivisi = currentUser.divisi || "general";

  const now = new Date();
  document.getElementById("headerDate").textContent = now.toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short"
  });

  renderDivisiPills();
  loadAll();
}

async function loadAll() {
  await Promise.all([loadHabits(), loadAset(), loadNotes(), loadManualSerah()]);
  renderHabits();
  renderAset();
  updateSerahStatus();
}

// ===================== NAV =====================
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelector(`.nav-btn[data-page="${page}"]`).classList.add("active");
  if (page === "serah") updateSerahStatus();
  if (page === "riwayat") showRiwayat("serah");
  if (page === "aset") renderAset();
}

// ===================== HABITS =====================
function renderDivisiPills() {
  document.getElementById("divisiPills").innerHTML = Object.keys(HABITS).map(k =>
    `<button class="pill ${k === currentDivisi ? "active" : ""}" onclick="switchDivisi('${k}')">${DIVISI_LABEL[k]}</button>`
  ).join("");
}

async function switchDivisi(k) {
  currentDivisi = k;
  renderDivisiPills();
  await loadHabits();
  renderHabits();
  await loadNotes();
}

async function onShiftChange() {
  currentShift = document.getElementById("shiftSelect").value;
  await loadAll();
}

async function loadHabits() {
  try {
    const res = await api("GET", `/api/habits?shift=${currentShift}&divisi=${currentDivisi}`);
    habitData = res.data || {};
  } catch { habitData = {}; }
}

async function toggleHabit(id) {
  try {
    const res = await api("POST", "/api/habits/toggle", {
      shift: currentShift, divisi: currentDivisi, habit_id: id
    });
    habitData[id] = res.done;
    renderHabits();
    updateSerahStatus();
  } catch (err) { toast(err.message); }
}

function renderHabits() {
  const list = HABITS[currentDivisi] || [];
  const el = document.getElementById("habitList");
  const badgeMap = { safety: "b-safety", quality: "b-quality", prod: "b-prod", disc: "b-disc" };
  const labelMap = { safety: "Safety", quality: "Kualitas", prod: "Produktivitas", disc: "Disiplin" };

  el.innerHTML = list.map(h => {
    const done = !!habitData[h.id];
    return `
      <div class="habit-item ${done ? "done" : ""}" onclick="toggleHabit('${h.id}')">
        <div class="check-box">${done ? '<i class="fas fa-check"></i>' : ""}</div>
        <div>
          <div class="h-title">${h.title}</div>
          <div class="h-desc">${h.desc}</div>
        </div>
        <span class="badge ${badgeMap[h.badge]}">${labelMap[h.badge]}</span>
      </div>`;
  }).join("");

  const doneCount = list.filter(h => habitData[h.id]).length;
  const pct = list.length ? Math.round(doneCount / list.length * 100) : 0;
  document.getElementById("habitProgressText").textContent = `${doneCount}/${list.length} selesai`;
  document.getElementById("habitPercent").textContent = pct + "%";
  document.getElementById("habitProgressFill").style.width = pct + "%";
}

async function loadNotes() {
  try {
    const res = await api("GET", `/api/notes?shift=${currentShift}`);
    notesContent = res.content || "";
    document.getElementById("habitNotes").value = notesContent;
  } catch {
    document.getElementById("habitNotes").value = "";
  }
}

async function saveHabitNotes() {
  const val = document.getElementById("habitNotes").value;
  try {
    await api("POST", "/api/notes", { shift: currentShift, content: val });
    notesContent = val;
    toast("Catatan disimpan");
    updateSerahStatus();
  } catch (err) { toast(err.message); }
}

// ===================== ASET =====================
async function loadAset() {
  try {
    const res = await api("GET", `/api/aset?shift=${currentShift}`);
    asetData = res.data || {};
  } catch { asetData = {}; }
}

async function toggleAset(id) {
  try {
    const res = await api("POST", "/api/aset/toggle", { shift: currentShift, aset_id: id });
    asetData[id] = res.done;
    renderAset();
    updateSerahStatus();
  } catch (err) { toast(err.message); }
}

function renderAset() {
  const el = document.getElementById("asetList");
  el.innerHTML = ASET_LIST.map(a => {
    const done = !!asetData[a.id];
    return `
      <div class="aset-item ${done ? "done" : ""}" onclick="toggleAset('${a.id}')">
        <div class="check-box">${done ? '<i class="fas fa-check"></i>' : ""}</div>
        <div style="flex:1">
          <div class="h-title">${a.title}</div>
          <div class="h-desc">${a.desc}</div>
        </div>
        ${a.wajib ? '<span class="badge b-wajib">WAJIB</span>' : ""}
      </div>`;
  }).join("");

  const wajib = ASET_LIST.filter(a => a.wajib);
  const wajibDone = wajib.filter(a => asetData[a.id]).length;
  const totalDone = ASET_LIST.filter(a => asetData[a.id]).length;
  document.getElementById("asetSummary").innerHTML =
    `Aset wajib: <strong>${wajibDone}/${wajib.length}</strong> &nbsp;|&nbsp; Total dicek: <strong>${totalDone}/${ASET_LIST.length}</strong>`;
}

// ===================== SERAH TERIMA =====================
async function loadManualSerah() {
  try {
    const res = await api("GET", `/api/serah-manual?shift=${currentShift}`);
    manualSerah = res.data || {};
  } catch { manualSerah = {}; }
}

async function toggleManualSerah(id) {
  try {
    const res = await api("POST", "/api/serah-manual/toggle", { shift: currentShift, item_id: id });
    manualSerah[id] = res.done;
    updateSerahStatus();
  } catch (err) { toast(err.message); }
}

function checkSerahConditions() {
  const list = HABITS[currentDivisi] || [];
  const habitDone = list.filter(h => habitData[h.id]).length;
  const habitPct = list.length ? habitDone / list.length : 0;
  const wajibAset = ASET_LIST.filter(a => a.wajib);
  const asetOk = wajibAset.every(a => asetData[a.id]);
  const notesOk = (notesContent || "").trim().length >= 5;

  return {
    habitOk: habitPct >= 0.8,
    habitPct: Math.round(habitPct * 100),
    asetOk,
    notesOk,
    manual: {
      sw4: !!manualSerah.sw4,
      sw5: !!manualSerah.sw5,
      sw6: !!manualSerah.sw6
    },
    allOk: false
  };
}

function updateSerahStatus() {
  const c = checkSerahConditions();
  c.allOk = c.habitOk && c.asetOk && c.notesOk && c.manual.sw4 && c.manual.sw5 && c.manual.sw6;

  const statusEl = document.getElementById("serahStatus");
  if (c.allOk) {
    statusEl.className = "serah-status ok";
    statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Semua syarat serah terima TERPENUHI. Siap serah terima.';
  } else {
    statusEl.className = "serah-status bad";
    statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Masih ada item yang belum lengkap. Selesaikan dulu sebelum serah terima.';
  }

  const items = [
    { ok: c.habitOk, label: `Checklist Habit ≥ 80% (sekarang ${c.habitPct}%)` },
    { ok: c.asetOk, label: "Semua aset WAJIB sudah dicek" },
    { ok: c.notesOk, label: "Catatan shift sudah diisi" },
    { ok: c.manual.sw4, label: "Area kerja sudah dirapikan", id: "sw4" },
    { ok: c.manual.sw5, label: "Tidak ada isu safety yang belum dilaporkan", id: "sw5" },
    { ok: c.manual.sw6, label: "Dokumen / sistem sudah di-update", id: "sw6" },
  ];

  document.getElementById("serahChecklist").innerHTML = items.map(item => `
    <div class="serah-item" ${item.id ? `onclick="toggleManualSerah('${item.id}')" style="cursor:pointer"` : ""}>
      <div class="status-icon ${item.ok ? "ok" : "no"}">
        <i class="fas fa-${item.ok ? "check" : "times"}"></i>
      </div>
      <div class="label">${item.label}${item.id && !item.ok ? " ← ketuk untuk centang" : ""}</div>
      <span class="wajib-tag">WAJIB</span>
    </div>
  `).join("");

  document.getElementById("btnSerah").disabled = !c.allOk;
  document.getElementById("serahHint").textContent = c.allOk
    ? "Semua lengkap. Isi nama penerima lalu konfirmasi."
    : "Lengkapi semua item wajib di atas agar tombol aktif.";
}

async function submitSerahTerima() {
  const c = checkSerahConditions();
  if (!c.allOk) { toast("Belum lengkap!"); return; }

  const penerima = document.getElementById("serahPenerima").value.trim();
  if (!penerima) { toast("Isi nama penerima shift!"); return; }

  try {
    await api("POST", "/api/serah-terima", {
      shift: currentShift,
      divisi: currentDivisi,
      penerima,
      catatan: document.getElementById("serahCatatan").value.trim(),
      habit_pct: c.habitPct
    });
    toast("Serah terima berhasil dicatat!");
    document.getElementById("serahPenerima").value = "";
    document.getElementById("serahCatatan").value = "";
    showPage("riwayat");
  } catch (err) { toast(err.message); }
}

// ===================== RIWAYAT =====================
async function showRiwayat(type) {
  document.querySelectorAll(".r-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.r-tab[data-r="${type}"]`).classList.add("active");
  const el = document.getElementById("riwayatContent");

  if (type === "serah") {
    try {
      const res = await api("GET", "/api/serah-terima");
      const history = res.data || [];
      if (!history.length) {
        el.innerHTML = '<p style="color:#64748b;text-align:center;padding:30px;">Belum ada riwayat serah terima.</p>';
        return;
      }
      el.innerHTML = history.map(h => `
        <div class="riwayat-card">
          <div class="r-date">${h.waktu} · Shift ${h.shift}</div>
          <div class="r-title">${h.dari_nama} → ${h.penerima}</div>
          <div class="r-meta">Divisi: ${DIVISI_LABEL[h.divisi] || h.divisi} · Habit: ${h.habit_pct}%${h.catatan ? " · " + h.catatan : ""}</div>
        </div>
      `).join("");
    } catch {
      el.innerHTML = '<p style="color:#64748b;text-align:center;padding:30px;">Gagal memuat data.</p>';
    }
  } else {
    try {
      const res = await api("GET", `/api/habits/history?divisi=${currentDivisi}`);
      el.innerHTML = (res.data || []).map(h => `
        <div class="riwayat-card">
          <div class="r-title">${h.label}</div>
          <div class="r-meta">Progress terbaik: <strong>${h.percent}%</strong></div>
        </div>
      `).join("");
    } catch {
      el.innerHTML = '<p style="color:#64748b;text-align:center;padding:30px;">Gagal memuat data.</p>';
    }
  }
}

// ===================== TOAST =====================
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
