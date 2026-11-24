-- ==========================================================
-- DATABASE: absensi_asrama
-- Sistem Absensi Penghuni Asrama Universitas Andalas (Unand)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `absensi_asrama` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `absensi_asrama`;

-- Matikan foreign key check sementara agar drop/create berjalan aman
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `izin`;
DROP TABLE IF EXISTS `presensi`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `kamar`;
DROP TABLE IF EXISTS `gedung`;
DROP TABLE IF EXISTS `lantai`;
DROP TABLE IF EXISTS `auth_token`;
DROP TABLE IF EXISTS `pengaturan_presensi`;

DROP VIEW IF EXISTS `izins`;
DROP VIEW IF EXISTS `presensis`;
DROP VIEW IF EXISTS `users`;
DROP VIEW IF EXISTS `kamars`;
DROP VIEW IF EXISTS `gedungs`;
DROP VIEW IF EXISTS `lantais`;
DROP VIEW IF EXISTS `auth_tokens`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- 1. TABEL: gedung (Gedung Asrama Unand)
-- ----------------------------------------------------------
CREATE TABLE `gedung` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(100) NOT NULL COMMENT 'Nama Gedung Asrama',
    `id_user` INT UNSIGNED NULL COMMENT 'Fasil / Pembina penanggung jawab gedung',
    `latitude` DECIMAL(10, 8) NULL COMMENT 'Titik koordinat asrama untuk geofencing',
    `longitude` DECIMAL(11, 8) NULL COMMENT 'Titik koordinat asrama untuk geofencing',
    `radius_meter` INT UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Radius toleransi presensi dalam meter',
    `keterangan` TEXT NULL,
    `geofence_geojson` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. TABEL: kamar (Kamar Penghuni dalam Gedung)
-- ----------------------------------------------------------
CREATE TABLE `kamar` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `gedung_id` INT UNSIGNED NOT NULL COMMENT 'Relasi ke tabel gedung',
    `nomor_kamar` VARCHAR(20) NOT NULL COMMENT 'Nomor kamar, misal: 101, 204',
    `lantai` INT NOT NULL DEFAULT 1 COMMENT 'Lantai kamar',
    `kapasitas` INT NOT NULL DEFAULT 4 COMMENT 'Kapasitas maksimal penghuni kamar',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_kamar_gedung` FOREIGN KEY (`gedung_id`) 
        REFERENCES `gedung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. TABEL: lantai (Lantai Gedung Asrama)
-- ----------------------------------------------------------
CREATE TABLE `lantai` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `gedung_id` INT UNSIGNED NOT NULL,
    `nomor_lantai` INT UNSIGNED NOT NULL,
    `nama` VARCHAR(80) NOT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_lantai_gedung` FOREIGN KEY (`gedung_id`) 
        REFERENCES `gedung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. TABEL: user (Pengguna: Admin, Fasil, Penghuni)
-- ----------------------------------------------------------
CREATE TABLE `user` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(100) NOT NULL,
    `nim` VARCHAR(20) NULL UNIQUE COMMENT 'Nomor Induk Mahasiswa (untuk penghuni / fasil)',
    `asal` VARCHAR(100) NULL COMMENT 'Daerah asal mahasiswa',
    `kamar_id` INT UNSIGNED NULL COMMENT 'Kamar tempat tinggal penghuni (FK ke kamar)',
    `gedung_id` INT UNSIGNED NULL COMMENT 'Gedung penempatan fasil / penghuni',
    `lantai` INT NULL COMMENT 'Lantai binaan fasil',
    `jekel` ENUM('L', 'P') NOT NULL COMMENT 'Jenis Kelamin: L = Laki-laki, P = Perempuan',
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'fasil', 'penghuni') NOT NULL DEFAULT 'penghuni' COMMENT 'Peran pengguna',
    `no_hp` VARCHAR(20) NULL,
    `foto_profil` VARCHAR(255) NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_kamar` FOREIGN KEY (`kamar_id`) 
        REFERENCES `kamar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_user_gedung` FOREIGN KEY (`gedung_id`) 
        REFERENCES `gedung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `gedung`
    ADD CONSTRAINT `fk_gedung_user` FOREIGN KEY (`id_user`) 
        REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- 5. TABEL: presensi (Presensi Harian: Subuh & Malam)
-- ----------------------------------------------------------
CREATE TABLE `presensi` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'Penghuni yang melakukan presensi',
    `tanggal` DATE NOT NULL COMMENT 'Tanggal presensi',
    `waktu` TIME NOT NULL COMMENT 'Jam presensi dilakukan',
    `sesi` ENUM('subuh', 'malam') NOT NULL COMMENT 'Subuh / Malam',
    `lat` DECIMAL(10, 8) NULL COMMENT 'Latitude GPS saat presensi',
    `long` DECIMAL(11, 8) NULL COMMENT 'Longitude GPS saat presensi',
    `status` ENUM('hadir', 'terlambat', 'izin', 'alpa') NOT NULL DEFAULT 'hadir',
    `foto_wajah` VARCHAR(255) NULL COMMENT 'File foto bukti kehadiran / selfie wajah',
    `keterangan` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_tanggal_sesi` (`user_id`, `tanggal`, `sesi`),
    CONSTRAINT `fk_presensi_user` FOREIGN KEY (`user_id`) 
        REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. TABEL: izin (Pengajuan Izin Penghuni Asrama)
-- ----------------------------------------------------------
CREATE TABLE `izin` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'Penghuni yang mengajukan izin',
    `jenis_izin` ENUM('sakit', 'pulang_kampung', 'kegiatan_kampus', 'keperluan_keluarga', 'lainnya') NOT NULL,
    `sesi` ENUM('semua', 'subuh', 'malam') NOT NULL DEFAULT 'semua',
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `keterangan` TEXT NOT NULL,
    `bukti_file` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'disetujui', 'ditolak') NOT NULL DEFAULT 'pending',
    `catatan_fasil` TEXT NULL,
    `disetujui_oleh` INT UNSIGNED NULL COMMENT 'ID Fasil yang memverifikasi izin',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_izin_user` FOREIGN KEY (`user_id`) 
        REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_izin_fasil` FOREIGN KEY (`disetujui_oleh`) 
        REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. TABEL: pengaturan_presensi (Konfigurasi Jadwal & Radius)
-- ----------------------------------------------------------
CREATE TABLE `pengaturan_presensi` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `jam_subuh_mulai` TIME NOT NULL DEFAULT '04:00:00',
    `jam_subuh_selesai` TIME NOT NULL DEFAULT '06:00:00',
    `jam_malam_mulai` TIME NOT NULL DEFAULT '18:00:00',
    `jam_malam_selesai` TIME NOT NULL DEFAULT '20:30:00',
    `lat_default` DECIMAL(10, 8) NOT NULL DEFAULT -0.91420000,
    `long_default` DECIMAL(11, 8) NOT NULL DEFAULT 100.46190000,
    `radius_default_meter` INT UNSIGNED NOT NULL DEFAULT 100,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 8. TABEL: auth_token (Sesi Login Pengguna)
-- ----------------------------------------------------------
CREATE TABLE `auth_token` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_auth_token_user` FOREIGN KEY (`user_id`) 
        REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- ALIAS VIEWS UNTUK COMPATIBILITY
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW `izins` AS SELECT * FROM `izin`;
CREATE OR REPLACE VIEW `presensis` AS SELECT * FROM `presensi`;
CREATE OR REPLACE VIEW `gedungs` AS SELECT * FROM `gedung`;
CREATE OR REPLACE VIEW `kamars` AS SELECT * FROM `kamar`;
CREATE OR REPLACE VIEW `lantais` AS SELECT * FROM `lantai`;
CREATE OR REPLACE VIEW `users` AS SELECT * FROM `user`;
CREATE OR REPLACE VIEW `auth_tokens` AS SELECT * FROM `auth_token`;
