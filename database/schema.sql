-- SIMOKARDI - Sistem Monitoring Kardio Digital
-- Database schema untuk MySQL

CREATE DATABASE IF NOT EXISTS simokardi;
USE simokardi;

-- Tabel pasien
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_rm VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  tgl_lahir DATE NOT NULL,
  gender ENUM('L', 'P') NOT NULL,
  berat_badan DECIMAL(5,2) NOT NULL COMMENT 'kg',
  tinggi_badan DECIMAL(5,2) NOT NULL COMMENT 'cm',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel monitoring (4 domain: pola makan, istirahat, aktivitas fisik, konsumsi obat)
CREATE TABLE IF NOT EXISTS monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  tanggal DATE NOT NULL,
  domain ENUM('pola_makan', 'istirahat', 'aktivitas_fisik', 'konsumsi_obat') NOT NULL,
  -- Pola makan: karbohidrat_persen, protein_gram, lemak_persen
  -- Istirahat: jam_tidur
  -- Aktivitas fisik: menit_per_minggu, intensitas (sedang/berat)
  -- Konsumsi obat: skor_kepatuhan (1-5)
  data_json JSON NOT NULL,
  skor_akhir DECIMAL(5,2) NOT NULL,
  kategori ENUM('adekuat', 'tidak_adekuat') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  UNIQUE KEY uk_patient_date_domain (patient_id, tanggal, domain)
);

-- Indeks untuk performa
CREATE INDEX idx_monitoring_patient ON monitoring(patient_id);
CREATE INDEX idx_monitoring_tanggal ON monitoring(tanggal);
CREATE INDEX idx_monitoring_domain ON monitoring(domain);

-- Tabel users (admin & pasien)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  role ENUM('admin', 'pasien') NOT NULL DEFAULT 'pasien',
  patient_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
