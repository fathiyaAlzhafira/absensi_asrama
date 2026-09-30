# Panduan Struktur Frontend & Pembagian Tugas Kelompok
## Sistem Absensi Penghuni Asrama Unand (Green Deck Design System)

Frontend aplikasi ini dibangun menggunakan **React JS + Vite** dengan menerapkan sistem desain **Green Deck** (Dark-first, Spotify Green `#1DB954`, DM Sans Typography).

---

### 1. Cara Menjalankan Frontend

Buka terminal di folder `frontend` dan jalankan:
```bash
cd frontend
npm run dev
```
Aplikasi akan berjalan di: **`http://localhost:5173`**

> **Fitur Dev Role Switcher:**
> Di bagian bawah Sidebar kiri, terdapat tombol pintas **[Penghuni]**, **[Fasil]**, dan **[Admin]**.
> Anggota kelompok dapat mengklik tombol ini untuk langsung berganti tampilan role secara instan saat menguji halamannya!

---

### 2. Standar Desain Sistem (Green Deck)

Setiap anggota kelompok yang mendesain isi halaman diharapkan mengikuti panduan di `green-deck-DESIGN.md`:
* **Warna Utama**:
  * Primary Accent: `#1DB954` (Spotify Green)
  * Primary Hover: `#1ED760`
  * Background Utama: `#121212` (Void Black)
  * Surface Card (Level 1): `#181818`
  * Surface Input / Elevated (Level 2): `#282828`
  * Text Primary: `#FFFFFF` (Pure White)
  * Text Secondary: `#A7A7A7` / `#B3B3B3`
  * Error: `#E22134`, Warning: `#F59B23`
* **Komponen yang Sudah Tersedia & Siap Pakai**:
  * `<Button variant="primary | secondary | ghost | danger" size="sm | md | lg" icon={Icon}>`
  * `<Card hoverable={true | false}>`
  * `<Input label="..." placeholder="..." icon={Icon} value={...} onChange={...}>`
  * `<Badge variant="success | warning | error | neutral | default">`

---

### 3. Rekomendasi Pembagian Tugas Anggota Kelompok

Struktur file telah dirancang modular sehingga setiap anggota kelompok dapat fokus pada filenya masing-masing tanpa takut terjadi *merge conflict*:

#### 👤 ANGGOTA 1: Modul Autentikasi & Penghuni (Bagian 1)
* `src/pages/auth/Login.jsx` (Halaman Login sistem & validasi)
* `src/pages/auth/Profile.jsx` (Halaman biodata diri & ganti password)
* `src/pages/penghuni/DashboardPenghuni.jsx` (Dashboard status presensi subuh/malam hari ini)
* `src/pages/penghuni/RiwayatPresensi.jsx` (Tabel riwayat kehadiran & filter tanggal)

#### 👤 ANGGOTA 2: Modul Presensi Mandiri & Perizinan (Penghuni Bagian 2)
* `src/pages/penghuni/Presensi.jsx` (Kamera selfie wajah & validasi GPS geofencing radius asrama)
* `src/pages/penghuni/PengajuanIzin.jsx` (Form izin + upload bukti format JPG/PDF)
* `src/pages/penghuni/StatusIzin.jsx` (Daftar pengajuan izin & melihat catatan fasil)

#### 👤 ANGGOTA 3: Modul Fasilitator (Fasil)
* `src/pages/fasil/DashboardFasil.jsx` (Ringkasan statistik kehadiran gedung binaan)
* `src/pages/fasil/MonitoringPresensi.jsx` (Kelola presensi penghuni, cek foto selfie & titik GPS)
* `src/pages/fasil/VerifikasiIzin.jsx` (Tinjau berkas JPG/PDF izin + tombol Setujui/Tolak)
* `src/pages/fasil/DataPenghuni.jsx` (Daftar mahasiswa binaan di gedung + kontak WA)
* `src/pages/fasil/LaporanPresensi.jsx` (Rekapitulasi presensi gedung binaan)

#### 👤 ANGGOTA 4: Modul Administrator (Admin)
* `src/pages/admin/DashboardAdmin.jsx` (Dashboard statistik seluruh asrama)
* `src/pages/admin/KelolaUser.jsx` (Tambah & kelola akun penghuni + fasil)
* `src/pages/admin/KelolaGedung.jsx` (Data gedung asrama, koordinat GPS, & plot fasil)
* `src/pages/admin/KelolaKamar.jsx` (Data kamar, lantai, kapasitas, & status penghuni)
* `src/pages/admin/PengaturanPresensi.jsx` (Konfigurasi jam Subuh 04.00-06.00 & Malam 18.00-20.30)
* `src/pages/admin/LaporanGlobal.jsx` (Laporan kehadiran global & ekspor Excel/PDF)

---

### 4. Struktur Folder Lengkap (`frontend/src/`)

```
src/
├── components/
│   ├── common/             # Komponen UI Green Deck (Button, Card, Input, Badge)
│   └── layout/             # Sidebar (240px), Topbar, MainLayout
├── context/
│   └── AuthContext.jsx     # State user login & Role Switcher
├── pages/
│   ├── auth/               # Login.jsx, Profile.jsx
│   ├── penghuni/           # 5 Halaman untuk Mahasiswa Asrama
│   ├── fasil/              # 5 Halaman untuk Fasilitator
│   └── admin/              # 6 Halaman untuk Administrator
├── services/
│   └── api.js              # Service penghubung ke Backend CakePHP
├── styles/
│   └── index.css           # Desain token CSS Green Deck
├── App.jsx                 # Routing React Router (sudah terpetakan semua)
└── main.jsx
```
