-- SIMOKARDI - Migration 001: Users & Auth
-- Jalankan: mysql -u root -p simokardi < database/migrations/001_users.sql

USE simokardi;

-- Tabel users (admin & pasien)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  role ENUM('admin', 'pasien') NOT NULL DEFAULT 'pasien',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Seed admin default (password: admin123) - HAPUS atau ubah di production
-- Admin default: admin@simokardi.local / admin123 (ubah di production)
INSERT IGNORE INTO users (email, password_hash, nama, role) VALUES
  ('admin@simokardi.local', '$2b$10$CnUS1iMA3NUZHcMVcfF5gu/jhziZ2re1MJ8uY4H2UBm1MPigCOw2G', 'Administrator', 'admin');
