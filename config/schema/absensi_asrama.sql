-- ==========================================================
-- DATABASE: absensi_asrama
-- Sistem Absensi Penghuni Asrama Universitas Andalas (Unand)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `absensi_asrama` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `absensi_asrama`;

-- Matikan foreign key check sementara agar drop/create berjalan aman
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `izins`;
DROP TABLE IF EXISTS `presensis`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `kamars`;
DROP TABLE IF EXISTS `gedungs`;
DROP TABLE IF EXISTS `pengaturan_presensi`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- 1. TABEL: gedungs (Gedung Asrama Unand)
-- ----------------------------------------------------------
CREATE TABLE `gedungs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(100) NOT NULL COMMENT 'Nama Gedung Asrama, misal: Gedung Asrama Putri A',
    `id_user` INT UNSIGNED NULL COMMENT 'Fasil / Pembina penanggung jawab gedung',
    `latitude` DECIMAL(10, 8) NULL COMMENT 'Titik koordinat asrama untuk geofencing',
    `longitude` DECIMAL(11, 8) NULL COMMENT 'Titik koordinat asrama untuk geofencing',
    `radius_meter` INT UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Radius toleransi presensi dalam meter',
    `keterangan` TEXT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. TABEL: kamars (Kamar Penghuni dalam Gedung)
-- ----------------------------------------------------------
CREATE TABLE `kamars` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `gedung_id` INT UNSIGNED NOT NULL COMMENT 'Relasi ke tabel gedungs',
    `nomor_kamar` VARCHAR(20) NOT NULL COMMENT 'Nomor kamar, misal: 101, 204',
    `lantai` INT NOT NULL DEFAULT 1 COMMENT 'Lantai kamar',
    `kapasitas` INT NOT NULL DEFAULT 4 COMMENT 'Kapasitas maksimal penghuni kamar',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_kamars_gedung` FOREIGN KEY (`gedung_id`) 
        REFERENCES `gedungs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. TABEL: users (Pengguna: Admin, Fasil, Penghuni)
-- ----------------------------------------------------------
CREATE TABLE `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(100) NOT NULL,
    `nim` VARCHAR(20) NULL UNIQUE COMMENT 'Nomor Induk Mahasiswa (untuk penghuni / fasil)',
    `asal` VARCHAR(100) NULL COMMENT 'Daerah asal mahasiswa',
    `kamar_id` INT UNSIGNED NULL COMMENT 'Kamar tempat tinggal penghuni (FK ke kamars)',
    `jekel` ENUM('L', 'P') NOT NULL COMMENT 'Jenis Kelamin: L = Laki-laki, P = Perempuan',
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'fasil', 'penghuni') NOT NULL DEFAULT 'penghuni' COMMENT 'Peran pengguna',
    `no_hp` VARCHAR(20) NULL,
    `foto_profil` VARCHAR(255) NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_kamar` FOREIGN KEY (`kamar_id`) 
        REFERENCES `kamars` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tambahkan foreign key untuk fasil penanggung jawab gedung ke tabel users
ALTER TABLE `gedungs`
    ADD CONSTRAINT `fk_gedungs_user` FOREIGN KEY (`id_user`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- 4. TABEL: presensis (Presensi Harian: Subuh & Malam)
-- ----------------------------------------------------------
CREATE TABLE `presensis` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'Penghuni yang melakukan presensi',
    `tanggal` DATE NOT NULL COMMENT 'Tanggal presensi',
    `waktu` TIME NOT NULL COMMENT 'Jam presensi dilakukan',
    `sesi` ENUM('subuh', 'malam') NOT NULL COMMENT 'Subuh (04.00-06.00) / Malam (18.00-20.30)',
    `lat` DECIMAL(10, 8) NULL COMMENT 'Latitude GPS saat presensi',
    `long` DECIMAL(11, 8) NULL COMMENT 'Longitude GPS saat presensi',
    `status` ENUM('hadir', 'terlambat', 'izin', 'alpa') NOT NULL DEFAULT 'hadir' COMMENT 'Status kehadiran',
    `foto_wajah` VARCHAR(255) NULL COMMENT 'File foto bukti kehadiran / selfie wajah',
    `keterangan` TEXT NULL COMMENT 'Catatan tambahan presensi',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_tanggal_sesi` (`user_id`, `tanggal`, `sesi`),
    CONSTRAINT `fk_presensis_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. TABEL: izins (Pengajuan Izin Penghuni Asrama)
-- Fitur: Form pengajuan + bukti (jpg/pdf), persetujuan fasil
-- ----------------------------------------------------------
CREATE TABLE `izins` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT 'Penghuni yang mengajukan izin',
    `jenis_izin` ENUM('sakit', 'pulang_kampung', 'kegiatan_kampus', 'keperluan_keluarga', 'lainnya') NOT NULL,
    `tanggal_mulai` DATE NOT NULL COMMENT 'Mulai tanggal izin',
    `tanggal_selesai` DATE NOT NULL COMMENT 'Sampai tanggal izin',
    `keterangan` TEXT NOT NULL COMMENT 'Alasan pengajuan izin',
    `bukti_file` VARCHAR(255) NOT NULL COMMENT 'File lampiran bukti (.jpg / .pdf)',
    `status` ENUM('pending', 'disetujui', 'ditolak') NOT NULL DEFAULT 'pending' COMMENT 'Status persetujuan oleh fasil',
    `catatan_fasil` TEXT NULL COMMENT 'Catatan dari fasil jika disetujui / ditolak',
    `disetujui_oleh` INT UNSIGNED NULL COMMENT 'ID Fasil yang memverifikasi izin',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_izins_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_izins_fasil` FOREIGN KEY (`disetujui_oleh`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. TABEL: pengaturan_presensi (Konfigurasi Jadwal & Radius)
-- ----------------------------------------------------------
CREATE TABLE `pengaturan_presensi` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `jam_subuh_mulai` TIME NOT NULL DEFAULT '04:00:00',
    `jam_subuh_selesai` TIME NOT NULL DEFAULT '06:00:00',
    `jam_malam_mulai` TIME NOT NULL DEFAULT '18:00:00',
    `jam_malam_selesai` TIME NOT NULL DEFAULT '20:30:00',
    `lat_default` DECIMAL(10, 8) NOT NULL DEFAULT -0.91420000 COMMENT 'Latitude Asrama Unand Limau Manis',
    `long_default` DECIMAL(11, 8) NOT NULL DEFAULT 100.46190000 COMMENT 'Longitude Asrama Unand Limau Manis',
    `radius_default_meter` INT UNSIGNED NOT NULL DEFAULT 100,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DATA AWAL (SEED DATA SAMPLE)
-- ==========================================================

-- Data Pengaturan Default
INSERT INTO `pengaturan_presensi` (`id`, `jam_subuh_mulai`, `jam_subuh_selesai`, `jam_malam_mulai`, `jam_malam_selesai`, `lat_default`, `long_default`, `radius_default_meter`)
VALUES (1, '04:00:00', '06:00:00', '18:00:00', '20:30:00', -0.91420000, 100.46190000, 100);

-- Data Pengguna Awal (Password default hash / plain untuk dev: password123)
-- Catatan: di CakePHP disarankan memakai Authentication bawaan
INSERT INTO `users` (`id`, `nama`, `nim`, `asal`, `kamar_id`, `jekel`, `email`, `password`, `role`, `no_hp`) VALUES
(1, 'Administrator Asrama', NULL, 'Padang', NULL, 'L', 'admin@unand.ac.id', '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe', 'admin', '081234567890'),
(2, 'Fasil Muhammad Rizky', '2111522001', 'Bukittinggi', NULL, 'L', 'fasil.rizky@unand.ac.id', '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe', 'fasil', '081298765432'),
(3, 'Fasil Siti Nurhaliza', '2111522002', 'Payakumbuh', NULL, 'P', 'fasil.siti@unand.ac.id', '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe', 'fasil', '081211223344');

-- Data Gedung
INSERT INTO `gedungs` (`id`, `nama`, `id_user`, `latitude`, `longitude`, `radius_meter`, `keterangan`) VALUES
(1, 'Asrama Putra Unand (Gedung A)', 2, -0.91420000, 100.46190000, 100, 'Gedung asrama khusus mahasiswa putra'),
(2, 'Asrama Putri Unand (Gedung B)', 3, -0.91480000, 100.46250000, 100, 'Gedung asrama khusus mahasiswi putri');

-- Data Kamar
INSERT INTO `kamars` (`id`, `gedung_id`, `nomor_kamar`, `lantai`, `kapasitas`) VALUES
(1, 1, 'A-101', 1, 4),
(2, 1, 'A-102', 1, 4),
(3, 1, 'A-201', 2, 4),
(4, 2, 'B-101', 1, 4),
(5, 2, 'B-102', 1, 4);

-- Data Penghuni Asrama
INSERT INTO `users` (`id`, `nama`, `nim`, `asal`, `kamar_id`, `jekel`, `email`, `password`, `role`, `no_hp`) VALUES
(4, 'Ahmad Fauzan', '2311521001', 'Solok', 1, 'L', 'ahmad.fauzan@student.unand.ac.id', '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe', 'penghuni', '081300010002'),
(5, 'Budi Santoso', '2311521002', 'Pariaman', 1, 'L', 'budi.santoso@student.unand.ac.id', '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe', 'penghuni', '081300010003'),
(6, 'Annisa Rahma', '2311522003', 'Padang Panjang', 4, 'P', 'annisa.rahma@student.unand.ac.id', '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe', 'penghuni', '081300010004');

-- Contoh Data Presensi
INSERT INTO `presensis` (`user_id`, `tanggal`, `waktu`, `sesi`, `lat`, `long`, `status`, `foto_wajah`, `keterangan`) VALUES
(4, CURRENT_DATE(), '05:15:00', 'subuh', -0.91421000, 100.46191000, 'hadir', 'uploads/presensi/subuh_4_sample.jpg', 'Tepat waktu di asrama'),
(5, CURRENT_DATE(), '05:40:00', 'subuh', -0.91420500, 100.46189500, 'hadir', 'uploads/presensi/subuh_5_sample.jpg', 'Tepat waktu di asrama');

-- Contoh Pengajuan Izin
INSERT INTO `izins` (`user_id`, `jenis_izin`, `tanggal_mulai`, `tanggal_selesai`, `keterangan`, `bukti_file`, `status`, `catatan_fasil`, `disetujui_oleh`) VALUES
(6, 'pulang_kampung', CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 2 DAY), 'Pulang ke rumah orang tua ada acara keluarga', 'uploads/izin/bukti_izin_sample.pdf', 'disetujui', 'Disetujui, harap kembali sebelum jam presensi malam', 3);
