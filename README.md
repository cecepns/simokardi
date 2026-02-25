# SIMOKARDI - Sistem Monitoring Kardio Digital

Aplikasi monitoring self-care pasien penyakit jantung koroner (PJK) berbasis 4 domain: pola makan, istirahat, aktivitas fisik, dan konsumsi obat.

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, React Router
- **Backend:** Express.js (single file server)
- **Database:** MySQL

## Persyaratan

- Node.js 18+
- MySQL 5.7+ atau 8+
- npm atau yarn

## Setup

### 1. Database MySQL

Buat database dan tabel:

```bash
mysql -u root -p < database/schema.sql
```

Atau jalankan secara manual isi file `database/schema.sql` di MySQL client Anda.

### 2. Konfigurasi Backend

Buat file `.env` di root project (copy dari `.env.example`):

```bash
cp .env.example .env
```

Isi `.env`:
- `DB_*` — kredensial MySQL
- `GEMINI_API_KEY` — API key Google Gemini untuk estimasi gizi (dapatkan di [Google AI Studio](https://aistudio.google.com/app/apikey))

### 3. Install Dependencies

```bash
# Dependencies root
npm install

# Frontend
cd frontend && npm install
```

### 4. Menjalankan Aplikasi

**Terminal 1 - Backend (port 3001):**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend (port 5173):**
```bash
npm run dev:frontend
```

Buka browser: http://localhost:5173

## Domain Monitoring

1. **Pola Makan** (ramah lansia): User mengisi makanan (jenis, jumlah, cara masak) dan minuman (jenis, jumlah). AI (Gemini) mengestimasi karbohidrat, protein, lemak secara otomatis. Rekomendasi: Karbohidrat ≤60%, Protein ≥0.8 g/kgBB, Lemak ≤30%
2. **Istirahat**: 7–9 jam/malam (18–64 th) atau 7–8 jam (≥65 th)
3. **Aktivitas Fisik**: 150–300 menit sedang/minggu atau 75–150 menit berat/minggu
4. **Konsumsi Obat**: Skor kepatuhan 1–5

Skor ≥70 = adekuat, skor <70 = tidak adekuat.

## Struktur Project

```
simokardi/
├── backend/
│   └── server.js          # Express API (single file)
├── database/
│   └── schema.sql         # MySQL schema
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, MonitoringForm, MonitoringList
│   │   ├── pages/         # Dashboard, PasienList, PasienForm, PasienDetail
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── ...
├── package.json
└── README.md
```
# simokardi
