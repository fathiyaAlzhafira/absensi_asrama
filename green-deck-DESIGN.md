# Green Deck Design System
## Sistem Presensi Penghuni Asrama Universitas Andalas

## 1. Overview
Green Deck adalah sistem desain modern dan responsif yang dirancang untuk **Sistem Presensi Digital Penghuni Asrama Universitas Andalas**. Green Deck memadukan aksen hijau berenergi tinggi (*Spotify Green* `#1DB954`) dengan tata letak permukaan yang bersih dan fungsional. 

Sistem ini mendukung **Device-Adaptive Theming (Mode Terang & Gelap)** secara otomatis mengikuti preferensi perangkat pengguna (*prefers-color-scheme*), memastikan keterbacaan tinggi, kontras optimal, dan kenyamanan visual baik di siang hari maupun malam hari.

---

## 2. Palet Warna (Color System)

### A. Token Warna Umum & Aksen
- **Primary** (`#1DB954`): Aksen interaktif utama, tombol aksi presensi, status hadir, tautan aktif.
- **Primary Hover** (`#1ED760` / `#169C46`): Keadaan *hover* elemen interaktif hijau.
- **Success** (`#1DB954`): Status presensi hadir, izin disetujui, konfirmasi berhasil.
- **Warning** (`#F59B23`): Status presensi terlambat, izin menunggu verifikasi, badge fasilitator.
- **Error** (`#E22134`): Status alpa/tidak hadir, izin ditolak, tombol hapus, badge admin.

### B. Mode Gelap (Dark Mode — Default)
- **Background** (`#121212`): Latar belakang utama aplikasi (*Void Black*).
- **Surface Level 1** (`#181818`): Kartu data, header topbar, panel form modal.
- **Surface Level 2** (`#282828`): Latar belakang input, select, chip filter, tabel zebra.
- **Surface Level 3** (`#333333`): Kontainer dropdown, popover dialog.
- **Text Primary** (`#FFFFFF`): Judul, teks utama, nama mahasiswa, data presensi.
- **Text Secondary** (`#A7A7A7`): Deskripsi pendukung, metadata, jam sesi presensi.
- **Neutral** (`#B3B3B3`): Placeholder input, teks label form, ikon sekunder.
- **Border** (`#282828`): Garis pembatas kartu, separator tabel, pembatas sidebar.
- **Sidebar Background** (`#000000`): Latar belakang pekat sidebar navigasi.

### C. Mode Terang (Light Mode — Device Adaptive)
- **Background** (`#F4F6F8`): Latar belakang utama bernuansa terang dan bersih.
- **Surface Level 1** (`#FFFFFF`): Kartu data, kartu modal, topbar header.
- **Surface Level 2** (`#E5E9EE`): Latar belakang input form, filter chips, baris header tabel.
- **Surface Level 3** (`#DDE2E7`): Dropdown panel, kontainer aktif.
- **Text Primary** (`#111827`): Teks utama berwarna gelap pekat dengan kontras tinggi.
- **Text Secondary** (`#4B5563`): Sub-judul, metadata pendukung.
- **Neutral** (`#6B7280`): Teks label, placeholder, garis sekunder.
- **Border** (`#D1D5DB`): Garis batas kartu dan pemisah kolom.
- **Sidebar Background** (`#FFFFFF`): Latar belakang bersih sidebar navigasi.

---

## 3. Tipografi (Typography)
- **Display & Body Font**: `DM Sans` (Google Fonts) — geometris, modern, dan sangat mudah dibaca.
- **Code & Coordinate Font**: `JetBrains Mono` (Google Fonts) — digunakan untuk titik koordinat GPS (`lat/long`), nomor kamar, dan kode sistem.

### Skala Tipografi:
- **Hero**: DM Sans 48px/56px, weight 800, tracking -0.03em
- **Page Title**: DM Sans 28px/36px, weight 700, tracking -0.02em
- **Section Title**: DM Sans 22px/30px, weight 700, tracking -0.01em
- **Card Title**: DM Sans 16px/22px, weight 700
- **Body**: DM Sans 14px/22px, weight 400/500, adaptif `var(--color-text-primary)`
- **Body Small**: DM Sans 12px/18px, weight 400
- **Label / Overline**: DM Sans 11px/16px, weight 700, tracking 0.08em, uppercase
- **Code / GPS**: JetBrains Mono 12px/18px, weight 500

---

## 4. Komponen Antarmuka (Components)

### A. Form Input & Dropdown (`Input`, `select`, `textarea`)
- **Tinggi Input**: 42px dengan horizontal padding 12px.
- **Warna Teks Ketik**: Menggunakan token dinamis `var(--color-text-primary)` (gelap di mode terang, putih di mode gelap), **tidak boleh hardcoded #FFFFFF**.
- **Latar Belakang**: `var(--color-surface-l2)`.
- **Border**: `1px solid var(--color-border)`. Saat status fokus berubah menjadi `1px solid var(--color-primary)`.
- **Placeholder**: `var(--color-neutral)` dengan opasitas 0.85.
- **Border Radius**: 4px (`--radius-sm`).
- **Calendar Picker Indicator**: Menggunakan CSS filter adaptif (`invert(1)` di dark mode, `none` di light mode) sehingga ikon kalender selalu kontras.

### B. Filter Chips / Tab Filter Pengguna
- **Bentuk**: Pil memanjang (`border-radius: 9999px`), tinggi 34px, padding horizontal 16px, DM Sans 12px weight 700 uppercase.
- **Keadaan Tidak Dipilih (Unselected)**:
  - Teks: **Warna Hitam** (`#000000` / `#111827`).
  - Latar Belakang: `var(--color-surface-l2)`.
  - Border: `1px solid var(--color-border)`.
- **Keadaan Dipilih / Diklik (Selected / Active)**:
  - Teks: **Warna Putih** (`#FFFFFF`).
  - Latar Belakang: `var(--color-primary)` (`#1DB954`).
  - Border: `1px solid var(--color-primary)`.

### C. Tombol (`Button`)
- **Primary**: Latar belakang `#1DB954`, teks putih `#FFFFFF`, pill-radius, hover scale 1.03x.
- **Secondary**: Latar belakang `var(--color-surface-l2)`, border `1px solid var(--color-border)`, teks adaptif `var(--color-text-primary)`.
- **Ghost**: Transparan, teks `var(--color-neutral)`, saat hover berubah ke `var(--color-text-primary)`.
- **Danger**: Latar belakang `#E22134`, teks putih `#FFFFFF`.

### D. Sidebar Navigasi
- **Lebar**: 240px saat terbuka, 72px saat ciut/tertutup.
- **Identitas**: Menampilkan logo resmi Universitas Andalas (`TB.png`), bukan inisial AU.
- **Toggle Hamburger**: Terpusat eksklusif di Sidebar (satu-satunya tombol toggle menu di aplikasi).
- **Tombol Keluar (Logout)**: Tersemat rapi di bagian paling bawah sidebar.

### E. Topbar Header
- **Tinggi**: 64px, *sticky* di bagian atas layar.
- **Sisi Kiri**: Menampilkan informasi sesi presensi aktif (`Subuh 04.00-06.00 & Malam 18.00-20.30`) dan lokasi asrama.
- **Sisi Kanan**: Profil pengguna.
- **Perilaku Responsif (Layar Kecil / Minimized)**:
  - Profil otomatis bertransformasi menjadi **Avatar-Only** (hanya foto/lingkaran ikon profil) tanpa teks nama panjang agar **tidak menimpa (*overlap*) badge Sesi**.
  - Teks sesi bertransformasi menjadi ringkas (`Subuh & Malam`) sehingga posisi keduanya tetap sejajar dalam satu baris horizontal.
  - Tidak memuat duplikasi tombol hamburger maupun tombol logout (keduanya telah dipindahkan ke sidebar).

### F. Aturan Hak Akses Pengguna (User Management Rules)
- **Akun Administrator**: Bersifat tunggal (*singleton superuser*). Administrator tidak dapat ditambah baru maupun dihapus melalui menu Kelola Pengguna.
- **Kelola Pengguna**: Dikhususkan untuk pendataan dan manajemen akun **Penghuni Asrama** dan **Fasilitator (Fasil)**.

---

## 5. Spacing Scale & Border Radius
- **Spacing**: Base 8px (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Border Radius**:
  - `2px` (`--radius-xs`): Badge kecil, indikator mikro.
  - `4px` (`--radius-sm`): Input, textarea, dropdown select.
  - `8px` (`--radius-md`): Kartu konten (`Card`), dialog modal.
  - `12px` (`--radius-lg`): Kartu hero, pratinjau foto kamera.
  - `9999px` (`--radius-pill`): Tombol aksi, filter chips, badge status, avatar profil.

---

## 6. Prinsip Desain (Do's and Don'ts)
1. **DO** gunakan variabel CSS (`var(--color-text-primary)`, `var(--color-surface-l2)`) pada semua teks dan form agar sinkron dengan mode perangkat pengguna.
2. **DON'T** menggunakan warna teks putih statis (`#FFFFFF`) pada kontainer yang memiliki latar belakang terang di mode siang.
3. **DO** gunakan logo resmi Universitas Andalas (`TB.png`) untuk representasi identitas kampus.
4. **DON'T** menggelapkan foto asli gedung asrama dengan overlay hitam pekat; gunakan kartu *frosted glass* untuk menjaga keterbacaan teks tanpa merusak kualitas foto.
5. **DO** jaga tombol navigasi (hamburger dan logout) terpusat di Sidebar demi kesederhanaan Topbar.
6. **DO** pastikan chip profil pengguna menyusut menjadi avatar saat layar diperkecil sehingga tidak menabrak badge sesi presensi.