const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.json");

const defaultData = {
  users: {},
  habit_logs: {},
  aset_logs: {},
  notes: {},
  serah_manual: {},
  serah_terima: []
};

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    }
  } catch (e) {
    console.error("DB load error:", e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

let cache = load();

const db = {
  get() {
    return cache;
  },
  set(data) {
    cache = data;
    save(cache);
  },
  // helpers
  getUser(username) {
    return cache.users[username] || null;
  },
  addUser(user) {
    cache.users[user.username] = user;
    save(cache);
  },
  getHabitKey(userId, tanggal, shift, divisi) {
    return `${userId}|${tanggal}|${shift}|${divisi}`;
  },
  getAsetKey(userId, tanggal, shift) {
    return `${userId}|${tanggal}|${shift}`;
  },
  getNotesKey(userId, tanggal, shift) {
    return `${userId}|${tanggal}|${shift}`;
  },
  getSerahManualKey(userId, tanggal, shift) {
    return `${userId}|${tanggal}|${shift}`;
  }
};

module.exports = db;
