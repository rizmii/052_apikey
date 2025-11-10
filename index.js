const express = require("express");
const path = require("path");
const crypto = require("crypto");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🔗 Koneksi ke database
const db = mysql.createPool({
  host: "localhost",
  user: "root",      // ubah sesuai user MySQL kamu
  password: "",      // ubah sesuai password MySQL kamu
  database: "apikey_db"
});

// Fungsi untuk generate API key acak
function generateApiKey() {
  const randomPart = crypto.randomBytes(32).toString("hex");
  return "052-rizmi-" + randomPart;
}

// Endpoint GET untuk mengambil API key terakhir dari DB
app.get("/apikey", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM apikeys ORDER BY id DESC LIMIT 1");
    if (rows.length === 0) {
      return res.status(404).json({ message: "Belum ada API key." });
    }
    res.json({ apiKey: rows[0].key_value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil API key." });
  }
});

// Endpoint POST untuk membuat API key baru dan simpan ke DB
app.post("/create", async (req, res) => {
  try {
    const newKey = generateApiKey();
    await db.query("INSERT INTO apikeys (key_value) VALUES (?)", [newKey]);
    console.log("API key baru dibuat:", newKey);
    res.status(201).json({
      message: "API key baru berhasil dibuat dan disimpan ke database.",
      apiKey: newKey,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat API key." });
  }
});

// ✅ Endpoint POST untuk memvalidasi API key berdasarkan database
app.post("/check", async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ message: "API key harus disertakan!" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM apikeys WHERE key_value = ?", [apiKey]);
    if (rows.length > 0) {
      res.status(200).json({ valid: true, message: "API key valid ✅" });
    } else {
      res.status(401).json({ valid: false, message: "API key tidak valid ❌" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memeriksa API key." });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
