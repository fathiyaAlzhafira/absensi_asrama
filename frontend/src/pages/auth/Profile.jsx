import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  Building,
  ChevronLeft,
  ChevronDown,
  DoorOpen,
  HelpCircle,
  LockKeyhole,
  Moon,
  Phone,
  Save,
  Sun,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function Profile() {
  const { user, role, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [noHp, setNoHp] = useState(user?.no_hp || '');
  const [asal, setAsal] = useState(user?.asal || '');
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  React.useEffect(() => {
    const sectionId = location.hash.slice(1);
    if (!sectionId) return undefined;
    const timerId = window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (!section) return;
      if (section.tagName === 'DETAILS') section.open = true;
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [location.hash]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const response = await api.updateProfile({ no_hp: noHp, asal });
      if (response.status !== 'success') throw new Error(response.message || 'Profil gagal diperbarui.');
      setUser({ ...user, ...response.data, no_hp: noHp, asal });
      setProfileMessage({ type: 'success', text: 'Informasi kontak berhasil diperbarui.' });
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.message || 'Profil gagal diperbarui.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordBaru.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password baru minimal 8 karakter.' });
      return;
    }
    if (passwordBaru !== konfirmasiPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi password belum sama.' });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await api.changePassword({
        password_lama: passwordLama,
        password_baru: passwordBaru
      });
      if (response.status !== 'success') throw new Error(response.message || 'Password gagal diubah.');
      setPasswordLama('');
      setPasswordBaru('');
      setKonfirmasiPassword('');
      setPasswordMessage({ type: 'success', text: 'Password berhasil diubah.' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Password gagal diubah.' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="resident-page profile-page">
      <div className="resident-page-heading profile-page-heading">
        <div className={role === 'penghuni' ? 'resident-subpage-banner' : 'profile-page-title'}>
          {role === 'penghuni' && (
            <Link to="/penghuni/dashboard" className="resident-subpage-back" aria-label="Kembali ke beranda" title="Kembali ke beranda">
              <ChevronLeft size={22} />
            </Link>
          )}
          <h1 className={role === 'penghuni' ? 'resident-subpage-title' : 'text-page-title'}>Profil & Pengaturan</h1>
        </div>
        <p className="text-body">Kelola akun, tampilan, keamanan, dan panduan penggunaan.</p>
      </div>

      <section id="lihat-profil" className="profile-identity-section">
        <Card hoverable={false} className="profile-identity-card">
          <div className="profile-avatar"><User size={28} /></div>
          <div className="profile-identity-copy">
            <h2 className="text-card-title">{user?.nama || 'Pengguna Asrama'}</h2>
            <span>{user?.email || 'Email belum tersedia'}</span>
          </div>
          <Badge variant={role === 'admin' ? 'error' : role === 'fasil' ? 'warning' : 'success'}>
            {role}
          </Badge>
          <div className="profile-identity-details">
            {user?.nim && <span>NIM {user.nim}</span>}
            <span><Building size={15} />{user?.gedung || 'Asrama Unand'}</span>
            <span><DoorOpen size={15} />Kamar {user?.nomor_kamar || user?.kamar || '-'}</span>
          </div>
        </Card>
      </section>

      <Card hoverable={false} className="profile-settings-menu">
        <details id="tampilan" className="profile-accordion">
          <summary>
            <span className="profile-accordion-title">
              <span className="profile-section-icon"><Sun size={19} /></span>
              <span><strong>Tampilan aplikasi</strong><small>Pilih tema terang atau gelap</small></span>
            </span>
            <ChevronDown size={18} />
          </summary>
          <div className="profile-accordion-content">
            <div className="profile-theme-options">
              <button
                type="button"
                className={`profile-theme-option${theme === 'light' ? ' selected' : ''}`}
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                <Sun size={19} />
                <span><strong>Terang</strong><small>Latar cerah</small></span>
              </button>
              <button
                type="button"
                className={`profile-theme-option${theme === 'dark' ? ' selected' : ''}`}
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                <Moon size={19} />
                <span><strong>Gelap</strong><small>Latar redup</small></span>
              </button>
            </div>
          </div>
        </details>

        <details className="profile-accordion">
          <summary>
            <span className="profile-accordion-title">
              <span className="profile-section-icon"><Phone size={19} /></span>
              <span><strong>Informasi kontak</strong><small>Nomor telepon dan asal daerah</small></span>
            </span>
            <ChevronDown size={18} />
          </summary>
          <div className="profile-accordion-content">
            {profileMessage.text && (
              <p className={`profile-form-message ${profileMessage.type}`} role="status">{profileMessage.text}</p>
            )}
            <form className="profile-form" onSubmit={handleUpdateProfile}>
              <Input label="Nomor WhatsApp / HP" value={noHp} onChange={(e) => setNoHp(e.target.value)} icon={Phone} placeholder="08123456789" />
              <Input label="Asal daerah / kota" value={asal} onChange={(e) => setAsal(e.target.value)} placeholder="Contoh: Solok" />
              <Button type="submit" variant="primary" icon={Save} disabled={savingProfile}>
                {savingProfile ? 'Menyimpan...' : 'Simpan kontak'}
              </Button>
            </form>
          </div>
        </details>

        <details id="kata-sandi" className="profile-accordion">
          <summary>
            <span className="profile-accordion-title">
              <span className="profile-section-icon"><LockKeyhole size={19} /></span>
              <span><strong>Ubah kata sandi</strong><small>Perbarui keamanan akun</small></span>
            </span>
            <ChevronDown size={18} />
          </summary>
          <div className="profile-accordion-content">
            {passwordMessage.text && (
              <p className={`profile-form-message ${passwordMessage.type}`} role="status">{passwordMessage.text}</p>
            )}
            <form className="profile-form" onSubmit={handleChangePassword}>
              <Input label="Kata sandi saat ini" type="password" autoComplete="current-password" required value={passwordLama} onChange={(e) => setPasswordLama(e.target.value)} icon={LockKeyhole} />
              <Input label="Kata sandi baru" type="password" autoComplete="new-password" required value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} icon={LockKeyhole} />
              <Input label="Konfirmasi kata sandi baru" type="password" autoComplete="new-password" required value={konfirmasiPassword} onChange={(e) => setKonfirmasiPassword(e.target.value)} icon={LockKeyhole} />
              <Button type="submit" variant="secondary" icon={LockKeyhole} disabled={savingPassword}>
                {savingPassword ? 'Memperbarui...' : 'Ubah kata sandi'}
              </Button>
            </form>
          </div>
        </details>

        <details id="bantuan" className="profile-accordion">
          <summary>
            <span className="profile-accordion-title">
              <span className="profile-section-icon"><HelpCircle size={19} /></span>
              <span><strong>Bantuan & aturan penggunaan</strong><small>Panduan aplikasi presensi asrama</small></span>
            </span>
            <ChevronDown size={18} />
          </summary>
          <div className="profile-accordion-content">
            <div className="profile-help-list">
              <details>
                <summary><span>Presensi kehadiran</span><ChevronDown size={17} /></summary>
                <ul>
                  <li>Presensi Subuh dibuka pukul 04.00–06.00 WIB.</li>
                  <li>Presensi Malam dibuka pukul 18.00–20.30 WIB.</li>
                  <li>Presensi hanya dapat dilakukan saat sesi terbuka, satu kali untuk setiap sesi per hari. Izinkan kamera dan lokasi perangkat, lalu lakukan presensi di area asrama (maksimal radius 100 meter).</li>
                </ul>
              </details>
              <details>
                <summary><span>Pengajuan dan status izin</span><ChevronDown size={17} /></summary>
                <ul>
                  <li>Pilih kategori dan tanggal izin, lalu isi alasan dengan jelas.</li>
                  <li>Lampirkan bukti JPG, PNG, atau PDF dengan ukuran maksimal 5 MB.</li>
                  <li>Pantau persetujuan dan catatan fasilitator pada halaman Status Izin.</li>
                </ul>
              </details>
              <details>
                <summary><span>Riwayat dan filter</span><ChevronDown size={17} /></summary>
                <ul>
                  <li>Riwayat menampilkan status hadir, terlambat, izin, dan alfa.</li>
                  <li>Gunakan filter bulan atau rentang tanggal untuk melihat periode tertentu.</li>
                </ul>
              </details>
              <details>
                <summary><span>Masalah kamera atau lokasi</span><ChevronDown size={17} /></summary>
                <ul>
                  <li>Pastikan browser memiliki izin kamera dan lokasi.</li>
                  <li>GPS memerlukan koneksi aman (HTTPS) atau localhost. Jika lokasi belum akurat, aktifkan GPS dan coba lagi di area terbuka.</li>
                </ul>
              </details>
            </div>
          </div>
        </details>

      </Card>
    </div>
  );
}
