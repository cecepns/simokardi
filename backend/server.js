/**
 * SIMOKARDI - Sistem Monitoring Kardio Digital
 * Backend Express.js - Single file server
 */

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'simokardi-secret-change-in-production';
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Konfigurasi MySQL - sesuaikan dengan environment Anda
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simokardi',
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Hitung usia dari tanggal lahir
function hitungUsia(tglLahir) {
  const today = new Date();
  const birth = new Date(tglLahir);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Skor pola makan: karbohidrat ≤60%, protein ≥0.8g/kgBB, lemak ≤30%
function hitungSkorPolaMakan(data, beratBadan) {
  const safeNum = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const karbo = safeNum(data?.karbohidrat_persen);
  const protein = safeNum(data?.protein_gram);
  const lemak = safeNum(data?.lemak_persen);
  const bb = safeNum(beratBadan) || 1;

  const proteinPerKg = bb > 0 ? protein / bb : 0;

  const skorKarbo = karbo <= 60 ? 100 : Math.max(0, 100 - (karbo - 60) * 2);
  const skorProtein = proteinPerKg >= 0.8 ? 100 : Math.min(100, (proteinPerKg / 0.8) * 100);
  const skorLemak = lemak <= 30 ? 100 : Math.max(0, 100 - (lemak - 30) * 3);

  const skor = (skorKarbo * 0.33) + (skorProtein * 0.33) + (skorLemak * 0.34);
  const result = Math.round(Math.min(100, Math.max(0, skor)) * 100) / 100;
  return Number.isFinite(result) ? result : 0;
}

// Skor istirahat: 7-9 jam (18-64 th) atau 7-8 jam (≥65 th) = 100
function hitungSkorIstirahat(jamTidur, usia) {
  const optimal = usia >= 65 ? { min: 7, max: 8 } : { min: 7, max: 9 };
  if (jamTidur >= optimal.min && jamTidur <= optimal.max) return 100;
  if (jamTidur < optimal.min) return Math.max(0, (jamTidur / optimal.min) * 100);
  return Math.max(0, 100 - (jamTidur - optimal.max) * 15);
}

// Skor aktivitas fisik: 150-300 menit sedang atau 75-150 menit berat per minggu
function hitungSkorAktivitasFisik(menitPerMinggu, intensitas) {
  const targetMin = intensitas === 'berat' ? 75 : 150;
  const targetMax = intensitas === 'berat' ? 150 : 300;
  if (menitPerMinggu >= targetMin && menitPerMinggu <= targetMax) return 100;
  if (menitPerMinggu < targetMin) return Math.min(100, (menitPerMinggu / targetMin) * 100);
  return Math.max(70, 100 - (menitPerMinggu - targetMax) * 0.1);
}

// Skor konsumsi obat: skala 1-5, 5 = sangat patuh
function hitungSkorKonsumsiObat(skorKepatuhan) {
  return (skorKepatuhan / 5) * 100;
}

function getKategori(skor) {
  return skor >= 70 ? 'adekuat' : 'tidak_adekuat';
}

// Estimasikan nilai gizi (karbohidrat, protein, lemak) dari makanan & minuman via Gemini AI
async function estimasiGiziDenganGemini(makanan, minuman) {
  const apiKey = "";
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum diatur. Tambahkan di file .env');
  }

  const makananStr = makanan
    .filter((m) => m.jenis?.trim())
    .map((m) => `- ${m.jenis} (${m.jumlah || '-'}, cara masak: ${m.cara_masak || '-'})`)
    .join('\n');
  const minumanStr = minuman
    .filter((m) => m.jenis?.trim())
    .map((m) => `- ${m.jenis} (${m.jumlah || '-'})`)
    .join('\n');

  const prompt = `Kamu adalah ahli gizi untuk pasien penyakit jantung (lansia Indonesia).
Estimasi total asupan gizi HARIAN dari makanan dan minuman berikut.

MAKANAN:
${makananStr || '(tidak ada)'}

MINUMAN:
${minumanStr || '(tidak ada)'}

Return HANYA JSON valid dengan format ini (tanpa markdown, tanpa penjelasan):
{"karbohidrat_persen": number, "protein_gram": number, "lemak_persen": number}

Ketentuan:
- karbohidrat_persen: % dari total kalori (rekomendasi ≤60)
- protein_gram: gram protein total per hari (rekomendasi ≥0.8g/kgBB untuk lansia)
- lemak_persen: % dari total kalori (rekomendasi ≤30)
- Gunakan pengetahuan makanan Indonesia (nasi, tempe, sayur, dll)
- 1 porsi nasi ≈ 50-60g karbo, 1 porsi ayam goreng lebih banyak lemak dari rebus`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini API error:', err);
    throw new Error('Gagal menganalisis gizi.');
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = json?.candidates?.[0]?.finishReason;
    if (reason === 'MAX_TOKENS') {
      throw new Error('Respons Gemini terpotong (limit token). Coba input lebih singkat.');
    }
    console.error('Gemini response structure:', JSON.stringify(json, null, 2).slice(0, 1500));
    throw new Error('Respons Gemini tidak valid');
  }

  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  let karbo = 0, protein = 0, lemak = 0;
  let parsed;
  try {
    let raw = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const start = raw.indexOf('{');
    if (start >= 0) {
      let depth = 0;
      for (let i = start; i < raw.length; i++) {
        if (raw[i] === '{') depth++;
        else if (raw[i] === '}') { depth--; if (depth === 0) { raw = raw.slice(start, i + 1); break; } }
      }
    }
    parsed = JSON.parse(raw);
    karbo = num(parsed.karbohidrat_persen ?? parsed.karbohidratPersen ?? parsed.karbohidrat);
    protein = num(parsed.protein_gram ?? parsed.proteinGram ?? parsed.protein);
    lemak = num(parsed.lemak_persen ?? parsed.lemakPersen ?? parsed.lemak);
  } catch (e) {
    const m = (key) => { const r = text.match(new RegExp(`"${key}"\\s*:\\s*([\\d.]+)`)); return r ? num(r[1]) : 0; };
    karbo = m('karbohidrat_persen') || m('karbohidratPersen') || m('karbohidrat');
    protein = m('protein_gram') || m('proteinGram') || m('protein');
    lemak = m('lemak_persen') || m('lemakPersen') || m('lemak');
    if (karbo === 0 && protein === 0 && lemak === 0) {
      console.error('Gemini raw text:', text?.slice(0, 500));
      throw new Error('Respons Gemini tidak valid (bukan JSON)');
    }
  }
  return {
    karbohidrat_persen: Math.min(100, Math.max(0, karbo)),
    protein_gram: Math.max(0, protein),
    lemak_persen: Math.min(100, Math.max(0, lemak)),
  };
}

// ============ AUTH MIDDLEWARE ============

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

function pasienOnly(req, res, next) {
  if (req.user?.role !== 'pasien' || !req.user?.patient_id) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SIMOKARDI' });
});

// ---------- AUTH (public) ----------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nama, no_rm, tgl_lahir, gender, berat_badan, tinggi_badan } = req.body;
    if (!email || !password || !nama || !no_rm || !tgl_lahir || !gender || berat_badan == null || tinggi_badan == null) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    const db = await getPool();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [insPatient] = await conn.query(
        'INSERT INTO patients (no_rm, nama, tgl_lahir, gender, berat_badan, tinggi_badan) VALUES (?, ?, ?, ?, ?, ?)',
        [no_rm.trim(), nama.trim(), tgl_lahir, gender, parseFloat(berat_badan), parseFloat(tinggi_badan)]
      );
      const patientId = insPatient.insertId;
      const hash = await bcrypt.hash(password, 10);
      await conn.query(
        'INSERT INTO users (email, password_hash, nama, role, patient_id) VALUES (?, ?, ?, ?, ?)',
        [email.trim().toLowerCase(), hash, nama.trim(), 'pasien', patientId]
      );
      const [[row]] = await conn.query(
        'SELECT id, email, nama, role, patient_id FROM users WHERE email = ?',
        [email.trim().toLowerCase()]
      );
      await conn.commit();
      const token = jwt.sign({ id: row.id, email: row.email, role: row.role, patient_id: row.patient_id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: row });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: err.sqlMessage?.includes('no_rm') ? 'No. RM sudah terdaftar' : 'Email sudah terdaftar' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });
    const db = await getPool();
    const [rows] = await db.query('SELECT id, email, nama, role, patient_id, password_hash, is_active FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Email atau password salah' });
    const u = rows[0];
    if (!u.is_active) return res.status(403).json({ error: 'Akun dinonaktifkan' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email atau password salah' });
    const token = jwt.sign({ id: u.id, email: u.email, role: u.role, patient_id: u.patient_id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, email: u.email, nama: u.nama, role: u.role, patient_id: u.patient_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT id, email, nama, role, patient_id FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- PASIEN: data sendiri ----------
app.get('/api/me/patient', authMiddleware, pasienOnly, async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM patients WHERE id = ?', [req.user.patient_id]);
    if (!rows.length) return res.status(404).json({ error: 'Data pasien tidak ditemukan' });
    const p = rows[0];
    res.json({
      ...p,
      usia: hitungUsia(p.tgl_lahir),
      tgl_lahir: p.tgl_lahir.toISOString().split('T')[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/me/monitoring', authMiddleware, pasienOnly, async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query(
      'SELECT * FROM monitoring WHERE patient_id = ? ORDER BY tanggal DESC',
      [req.user.patient_id]
    );
    res.json(rows.map((m) => ({ ...m, tanggal: m.tanggal.toISOString().split('T')[0] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ---------- ADMIN: User management ----------
app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query(`
      SELECT u.id, u.email, u.nama, u.role, u.patient_id, u.is_active, u.created_at, p.nama as patient_nama, p.no_rm
      FROM users u LEFT JOIN patients p ON p.id = u.patient_id
      ORDER BY u.created_at DESC
    `);
    res.json(rows.map((u) => ({ ...u, created_at: u.created_at?.toISOString?.() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, password, nama, role, patient_id } = req.body;
    if (!email || !password || !nama) return res.status(400).json({ error: 'Email, password, nama wajib' });
    if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
    const r = role || 'pasien';
    if (r === 'pasien' && !patient_id) return res.status(400).json({ error: 'Pasien harus punya patient_id' });
    const db = await getPool();
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password_hash, nama, role, patient_id) VALUES (?, ?, ?, ?, ?)',
      [email.trim().toLowerCase(), hash, nama.trim(), r, r === 'pasien' ? patient_id : null]
    );
    const [[row]] = await db.query('SELECT id, email, nama, role, patient_id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email sudah terdaftar' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama, role, is_active, patient_id } = req.body;
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID tidak valid' });
    const db = await getPool();
    const updates = [];
    const vals = [];
    if (nama !== undefined) { updates.push('nama = ?'); vals.push(nama.trim()); }
    if (role !== undefined) { updates.push('role = ?'); vals.push(role); }
    if (is_active !== undefined) { updates.push('is_active = ?'); vals.push(is_active ? 1 : 0); }
    if (patient_id !== undefined) { updates.push('patient_id = ?'); vals.push(patient_id || null); }
    if (updates.length === 0) return res.status(400).json({ error: 'Tidak ada field untuk diupdate' });
    vals.push(id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, vals);
    const [[row]] = await db.query('SELECT id, email, nama, role, patient_id, is_active FROM users WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
    const id = parseInt(req.params.id, 10);
    const db = await getPool();
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'Password berhasil direset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Protected routes (require auth) ----------
app.use('/api/patients', authMiddleware);
app.use('/api/dashboard', authMiddleware);

function canAccessPatient(req, patientId) {
  if (req.user.role === 'admin') return true;
  return req.user.role === 'pasien' && Number(req.user.patient_id) === Number(patientId);
}

// Daftar pasien (admin only)
app.get('/api/patients', adminOnly, async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query(
      'SELECT id, no_rm, nama, tgl_lahir, gender, berat_badan, tinggi_badan, created_at FROM patients ORDER BY nama'
    );
    const patients = rows.map((p) => ({
      ...p,
      usia: hitungUsia(p.tgl_lahir),
      tgl_lahir: p.tgl_lahir.toISOString().split('T')[0],
    }));
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Detail pasien (admin: any, pasien: own only)
app.get('/api/patients/:id', (req, res, next) => {
  if (!canAccessPatient(req, req.params.id)) return res.status(403).json({ error: 'Forbidden' });
  next();
}, async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Pasien tidak ditemukan' });
    const p = rows[0];
    res.json({
      ...p,
      usia: hitungUsia(p.tgl_lahir),
      tgl_lahir: p.tgl_lahir.toISOString().split('T')[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Tambah pasien (admin only)
app.post('/api/patients', adminOnly, async (req, res) => {
  try {
    const { no_rm, nama, tgl_lahir, gender, berat_badan, tinggi_badan } = req.body;
    if (!no_rm || !nama || !tgl_lahir || !gender || berat_badan == null || tinggi_badan == null) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    const db = await getPool();
    const [result] = await db.query(
      'INSERT INTO patients (no_rm, nama, tgl_lahir, gender, berat_badan, tinggi_badan) VALUES (?, ?, ?, ?, ?, ?)',
      [no_rm, nama, tgl_lahir, gender, parseFloat(berat_badan), parseFloat(tinggi_badan)]
    );
    res.status(201).json({ id: result.insertId, message: 'Pasien berhasil ditambahkan' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'No. RM sudah terdaftar' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update pasien (admin only)
app.put('/api/patients/:id', adminOnly, async (req, res) => {
  try {
    const { no_rm, nama, tgl_lahir, gender, berat_badan, tinggi_badan } = req.body;
    const db = await getPool();
    await db.query(
      'UPDATE patients SET no_rm=?, nama=?, tgl_lahir=?, gender=?, berat_badan=?, tinggi_badan=? WHERE id=?',
      [no_rm, nama, tgl_lahir, gender, parseFloat(berat_badan), parseFloat(tinggi_badan), req.params.id]
    );
    res.json({ message: 'Pasien berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Hapus pasien (admin only)
app.delete('/api/patients/:id', adminOnly, async (req, res) => {
  try {
    const db = await getPool();
    const [r] = await db.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Pasien tidak ditemukan' });
    res.json({ message: 'Pasien berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function handlePostMonitoring(req, res, patientId) {
  const { tanggal, domain, data } = req.body;
  if (!tanggal || !domain || !data) {
    return res.status(400).json({ error: 'tanggal, domain, dan data wajib diisi' });
  }
  const validDomains = ['pola_makan', 'istirahat', 'aktivitas_fisik', 'konsumsi_obat'];
  if (!validDomains.includes(domain)) return res.status(400).json({ error: 'Domain tidak valid' });
  const db = await getPool();
  const [[patient]] = await db.query('SELECT berat_badan, tgl_lahir FROM patients WHERE id = ?', [patientId]);
  if (!patient) return res.status(404).json({ error: 'Pasien tidak ditemukan' });
  let skorAkhir;
  const usia = hitungUsia(patient.tgl_lahir);
  if (domain === 'pola_makan') {
    const { makanan = [], minuman = [] } = data;
    const hasMakananMinuman = Array.isArray(makanan) && Array.isArray(minuman) && (makanan.some((m) => m.jenis?.trim()) || minuman.some((m) => m.jenis?.trim()));
    if (hasMakananMinuman) {
      const estimasi = await estimasiGiziDenganGemini(makanan, minuman);
      console.log('[pola_makan] Estimasi Gemini:', estimasi);
      Object.assign(data, estimasi);
    }
  }
  switch (domain) {
    case 'pola_makan': skorAkhir = hitungSkorPolaMakan(data, patient.berat_badan); break;
    case 'istirahat': skorAkhir = hitungSkorIstirahat(parseFloat(data.jam_tidur) || 0, usia); break;
    case 'aktivitas_fisik': skorAkhir = hitungSkorAktivitasFisik(parseFloat(data.menit_per_minggu) || 0, data.intensitas || 'sedang'); break;
    case 'konsumsi_obat': skorAkhir = hitungSkorKonsumsiObat(parseFloat(data.skor_kepatuhan) || 0); break;
    default: return res.status(400).json({ error: 'Domain tidak valid' });
  }
  const skorAman = Number.isFinite(skorAkhir) ? skorAkhir : 0;
  const kategori = getKategori(skorAman);
  await db.query(
    `INSERT INTO monitoring (patient_id, tanggal, domain, data_json, skor_akhir, kategori)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), skor_akhir = VALUES(skor_akhir), kategori = VALUES(kategori)`,
    [patientId, tanggal, domain, JSON.stringify(data), skorAman, kategori]
  );
  const payload = { skor_akhir: skorAman, kategori };
  if (domain === 'pola_makan') payload.estimasi_gizi = { karbohidrat_persen: data.karbohidrat_persen, protein_gram: data.protein_gram, lemak_persen: data.lemak_persen };
  res.status(201).json(payload);
}

app.post('/api/me/monitoring', authMiddleware, pasienOnly, (req, res) => {
  handlePostMonitoring(req, res, req.user.patient_id).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });
});

// Daftar monitoring pasien (admin: any, pasien: own only)
app.get('/api/patients/:id/monitoring', (req, res, next) => {
  if (!canAccessPatient(req, req.params.id)) return res.status(403).json({ error: 'Forbidden' });
  next();
}, async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query(
      'SELECT * FROM monitoring WHERE patient_id = ? ORDER BY tanggal DESC',
      [req.params.id]
    );
    res.json(rows.map((m) => ({ ...m, tanggal: m.tanggal.toISOString().split('T')[0] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Tambah/update monitoring (admin: any, pasien: own only)
app.post('/api/patients/:id/monitoring', (req, res, next) => {
  if (!canAccessPatient(req, req.params.id)) return res.status(403).json({ error: 'Forbidden' });
  next();
}, async (req, res) => {
  try {
    await handlePostMonitoring(req, res, req.params.id);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard ringkasan (admin: all, pasien: own)
app.get('/api/dashboard', async (req, res) => {
  try {
    const db = await getPool();
    if (req.user.role === 'pasien' && req.user.patient_id) {
      const [[patient]] = await db.query('SELECT * FROM patients WHERE id = ?', [req.user.patient_id]);
      if (!patient) return res.status(404).json({ error: 'Data pasien tidak ditemukan' });
      const [monitoring] = await db.query(
        'SELECT * FROM monitoring WHERE patient_id = ? ORDER BY tanggal DESC LIMIT 20',
        [req.user.patient_id]
      );
      res.json({
        total_pasien: 1,
        pasien: { ...patient, usia: hitungUsia(patient.tgl_lahir), tgl_lahir: patient.tgl_lahir?.toISOString?.()?.split('T')[0] },
        monitoring_terbaru: monitoring.map((m) => ({ ...m, patient_nama: patient.nama })),
      });
    } else {
      const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM patients');
      const [recent] = await db.query(
        `SELECT m.*, p.nama as patient_nama FROM monitoring m
         JOIN patients p ON p.id = m.patient_id
         ORDER BY m.created_at DESC LIMIT 10`
      );
      res.json({ total_pasien: total, monitoring_terbaru: recent });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`SIMOKARDI API berjalan di http://localhost:${PORT}`);
});
