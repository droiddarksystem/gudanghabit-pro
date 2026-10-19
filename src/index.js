/**
 * GudangHabit Pro — Cloudflare Workers + D1
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hashArr = new Uint8Array(bits);
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = [...hashArr].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hashArr = new Uint8Array(bits);
  const checkHex = [...hashArr].map((b) => b.toString(16).padStart(2, "0")).join("");
  return checkHex === hashHex;
}

async function getUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const row = await env.DB.prepare("SELECT * FROM sessions WHERE token = ?").bind(token).first();
  if (!row) return null;
  return {
    token,
    userId: row.user_id,
    username: row.username,
    name: row.name,
    divisi: row.divisi,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        },
      });
    }

    try {
      // ========== AUTH ==========
      if (path === "/api/register" && method === "POST") {
        const body = await request.json();
        const { username, password, name, divisi } = body;
        if (!username || !password || !name) return json({ error: "Data tidak lengkap" }, 400);
        if (password.length < 4) return json({ error: "Password minimal 4 karakter" }, 400);

        const uname = username.toLowerCase().trim();
        const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(uname).first();
        if (existing) return json({ error: "Username sudah terdaftar" }, 400);

        const id = crypto.randomUUID();
        const hash = await hashPassword(password);
        await env.DB.prepare(
          "INSERT INTO users (id, username, password, name, divisi, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
          .bind(id, uname, hash, name.trim(), divisi || "general", new Date().toISOString())
          .run();

        return json({ success: true, message: "Akun berhasil dibuat" });
      }

      if (path === "/api/login" && method === "POST") {
        const body = await request.json();
        const uname = (body.username || "").toLowerCase().trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(uname).first();
        if (!user || !(await verifyPassword(body.password || "", user.password))) {
          return json({ error: "Username atau password salah" }, 401);
        }

        const token = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO sessions (token, user_id, username, name, divisi, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
          .bind(token, user.id, user.username, user.name, user.divisi, new Date().toISOString())
          .run();

        return json({
          token,
          user: { username: user.username, name: user.name, divisi: user.divisi },
        });
      }

      if (path === "/api/logout" && method === "POST") {
        const user = await getUser(request, env);
        if (user) {
          await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(user.token).run();
        }
        return json({ success: true });
      }

      if (path === "/api/me" && method === "GET") {
        const user = await getUser(request, env);
        if (!user) return json({ error: "Unauthorized" }, 401);
        return json({ user: { username: user.username, name: user.name, divisi: user.divisi } });
      }

      // Auth required below
      const user = await getUser(request, env);

      // ========== HABITS ==========
      if (path === "/api/habits" && method === "GET") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const tgl = url.searchParams.get("tanggal") || today();
        const sh = url.searchParams.get("shift") || "pagi";
        const div = url.searchParams.get("divisi") || user.divisi;
        const rows = await env.DB.prepare(
          "SELECT habit_id, done FROM habit_logs WHERE user_id = ? AND tanggal = ? AND shift = ? AND divisi = ?"
        )
          .bind(user.userId, tgl, sh, div)
          .all();
        const data = {};
        (rows.results || []).forEach((r) => {
          data[r.habit_id] = !!r.done;
        });
        return json({ data });
      }

      if (path === "/api/habits/toggle" && method === "POST") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const body = await request.json();
        const tgl = body.tanggal || today();
        const sh = body.shift || "pagi";
        const div = body.divisi || user.divisi;
        const habit_id = body.habit_id;

        const existing = await env.DB.prepare(
          "SELECT done FROM habit_logs WHERE user_id = ? AND tanggal = ? AND shift = ? AND divisi = ? AND habit_id = ?"
        )
          .bind(user.userId, tgl, sh, div, habit_id)
          .first();
        const newVal = existing ? (existing.done ? 0 : 1) : 1;

        await env.DB.prepare(
          `INSERT INTO habit_logs (user_id, tanggal, shift, divisi, habit_id, done)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, tanggal, shift, divisi, habit_id) DO UPDATE SET done = excluded.done`
        )
          .bind(user.userId, tgl, sh, div, habit_id, newVal)
          .run();

        return json({ done: !!newVal });
      }

      // ========== ASET ==========
      if (path === "/api/aset" && method === "GET") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const tgl = url.searchParams.get("tanggal") || today();
        const sh = url.searchParams.get("shift") || "pagi";
        const rows = await env.DB.prepare(
          "SELECT aset_id, done FROM aset_logs WHERE user_id = ? AND tanggal = ? AND shift = ?"
        )
          .bind(user.userId, tgl, sh)
          .all();
        const data = {};
        (rows.results || []).forEach((r) => {
          data[r.aset_id] = !!r.done;
        });
        return json({ data });
      }

      if (path === "/api/aset/toggle" && method === "POST") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const body = await request.json();
        const tgl = body.tanggal || today();
        const sh = body.shift || "pagi";
        const aset_id = body.aset_id;

        const existing = await env.DB.prepare(
          "SELECT done FROM aset_logs WHERE user_id = ? AND tanggal = ? AND shift = ? AND aset_id = ?"
        )
          .bind(user.userId, tgl, sh, aset_id)
          .first();
        const newVal = existing ? (existing.done ? 0 : 1) : 1;

        await env.DB.prepare(
          `INSERT INTO aset_logs (user_id, tanggal, shift, aset_id, done)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, tanggal, shift, aset_id) DO UPDATE SET done = excluded.done`
        )
          .bind(user.userId, tgl, sh, aset_id, newVal)
          .run();

        return json({ done: !!newVal });
      }

      // ========== NOTES ==========
      if (path === "/api/notes" && method === "GET") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const tgl = url.searchParams.get("tanggal") || today();
        const sh = url.searchParams.get("shift") || "pagi";
        const row = await env.DB.prepare(
          "SELECT content FROM notes WHERE user_id = ? AND tanggal = ? AND shift = ?"
        )
          .bind(user.userId, tgl, sh)
          .first();
        return json({ content: row?.content || "" });
      }

      if (path === "/api/notes" && method === "POST") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const body = await request.json();
        const tgl = body.tanggal || today();
        const sh = body.shift || "pagi";
        await env.DB.prepare(
          `INSERT INTO notes (user_id, tanggal, shift, content)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, tanggal, shift) DO UPDATE SET content = excluded.content`
        )
          .bind(user.userId, tgl, sh, body.content || "")
          .run();
        return json({ success: true });
      }

      // ========== SERAH MANUAL ==========
      if (path === "/api/serah-manual" && method === "GET") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const tgl = url.searchParams.get("tanggal") || today();
        const sh = url.searchParams.get("shift") || "pagi";
        const rows = await env.DB.prepare(
          "SELECT item_id, done FROM serah_manual WHERE user_id = ? AND tanggal = ? AND shift = ?"
        )
          .bind(user.userId, tgl, sh)
          .all();
        const data = {};
        (rows.results || []).forEach((r) => {
          data[r.item_id] = !!r.done;
        });
        return json({ data });
      }

      if (path === "/api/serah-manual/toggle" && method === "POST") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const body = await request.json();
        const tgl = body.tanggal || today();
        const sh = body.shift || "pagi";
        const item_id = body.item_id;

        const existing = await env.DB.prepare(
          "SELECT done FROM serah_manual WHERE user_id = ? AND tanggal = ? AND shift = ? AND item_id = ?"
        )
          .bind(user.userId, tgl, sh, item_id)
          .first();
        const newVal = existing ? (existing.done ? 0 : 1) : 1;

        await env.DB.prepare(
          `INSERT INTO serah_manual (user_id, tanggal, shift, item_id, done)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, tanggal, shift, item_id) DO UPDATE SET done = excluded.done`
        )
          .bind(user.userId, tgl, sh, item_id, newVal)
          .run();

        return json({ done: !!newVal });
      }

      // ========== SERAH TERIMA ==========
      if (path === "/api/serah-terima" && method === "POST") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const body = await request.json();
        if (!body.penerima) return json({ error: "Nama penerima wajib diisi" }, 400);

        await env.DB.prepare(
          `INSERT INTO serah_terima (user_id, tanggal, shift, divisi, dari_nama, penerima, catatan, habit_pct, waktu)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            user.userId,
            today(),
            body.shift || "pagi",
            body.divisi || user.divisi,
            user.name,
            body.penerima,
            body.catatan || "",
            body.habit_pct || 0,
            new Date().toLocaleString("id-ID")
          )
          .run();

        return json({ success: true });
      }

      if (path === "/api/serah-terima" && method === "GET") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const rows = await env.DB.prepare(
          "SELECT * FROM serah_terima WHERE user_id = ? ORDER BY id DESC LIMIT 50"
        )
          .bind(user.userId)
          .all();
        return json({ data: rows.results || [] });
      }

      // ========== HISTORY ==========
      if (path === "/api/habits/history" && method === "GET") {
        if (!user) return json({ error: "Unauthorized" }, 401);
        const div = url.searchParams.get("divisi") || user.divisi;
        const result = [];

        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          let best = 0;
          for (const sh of ["pagi", "siang", "malam"]) {
            const rows = await env.DB.prepare(
              "SELECT done FROM habit_logs WHERE user_id = ? AND tanggal = ? AND shift = ? AND divisi = ?"
            )
              .bind(user.userId, tgl, sh, div)
              .all();
            const list = rows.results || [];
            if (list.length) {
              const done = list.filter((r) => r.done).length;
              const pct = Math.round((done / 7) * 100);
              if (pct > best) best = pct;
            }
          }
          result.push({
            tanggal: tgl,
            label: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }),
            percent: best,
          });
        }
        return json({ data: result });
      }

      // Static assets (frontend)
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: err.message || "Server error" }, 500);
    }
  },
};
