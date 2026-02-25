-- SIMOKARDI - Migration 002: Role admin|pasien, link user ke patient
-- Jalankan: mysql -u root -p simokardi < database/migrations/002_role_pasien.sql

USE simokardi;

-- Ubah role enum (perlu 2 langkah jika ada role=user)
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'pasien') NOT NULL DEFAULT 'pasien';
UPDATE users SET role = 'pasien' WHERE role = 'user';
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'pasien') NOT NULL DEFAULT 'pasien';

-- Tambah patient_id (hanya jika belum ada)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'patient_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN patient_id INT NULL AFTER role', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tambah FK (abaikan jika constraint sudah ada)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_patient');
SET @sql2 = IF(@fk_exists = 0, 'ALTER TABLE users ADD CONSTRAINT fk_users_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

