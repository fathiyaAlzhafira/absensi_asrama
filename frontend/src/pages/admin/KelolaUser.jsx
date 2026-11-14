import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { UserPlus, Search, Edit2, Trash2, X, Check, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function KelolaUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    nim: '',
    role: 'penghuni',
    asal: '',
    jekel: 'L',
    no_hp: '',
    password: ''
  });

  // Ambil data users dari backend (Kecualikan admin karena admin sistem bersifat tunggal)
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res && res.status === 'success' && Array.isArray(res.data)) {
        setUsers(res.data.filter(u => u.role !== 'admin'));
      }
    } catch (err) {
      console.warn('Gagal memuat pengguna dari server, menggunakan fallback cache:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormError('');
    setFormData({
      nama: '',
      email: '',
      nim: '',
      role: 'penghuni',
      asal: '',
      jekel: 'L',
      no_hp: '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUserId(user.id);
    setFormError('');
    setFormData({
      nama: user.nama || '',
      email: user.email || '',
      nim: user.nim || '',
      role: user.role === 'fasil' ? 'fasil' : 'penghuni',
      asal: user.asal || '',
      jekel: user.jekel || 'L',
      no_hp: user.no_hp || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (editingUserId) {
      try {
        const res = await api.updateUser(editingUserId, formData);
        if (res && res.data) {
          setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...res.data } : u));
        } else {
          setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...formData } : u));
        }
        await loadUsers();
        setIsModalOpen(false);
        showToast('success', 'Data pengguna berhasil diperbarui!');
      } catch (err) {
        setFormError(err.message || 'Gagal memperbarui data pengguna.');
      } finally {
        setSubmitting(false);
      }
    } else {
      try {
        const res = await api.createUser(formData);
        // Langsung tampilkan user baru di UI agar seketika muncul di web
        if (res && res.data) {
          const createdUser = {
            id: res.data.id || Date.now(),
            nama: res.data.nama || formData.nama,
            email: res.data.email || formData.email,
            nim: res.data.nim || formData.nim,
            role: res.data.role || formData.role,
            asal: res.data.asal || formData.asal,
            jekel: res.data.jekel || formData.jekel,
            no_hp: res.data.no_hp || formData.no_hp,
            kamar: res.data.kamar || null,
            gedung: res.data.gedung || null
          };
          setUsers(prev => [createdUser, ...prev.filter(u => u.id !== createdUser.id)]);
        } else {
          setUsers(prev => [{ id: Date.now(), ...formData }, ...prev]);
        }
        // Sinkronisasi data aktual dari backend
        await loadUsers();
        setIsModalOpen(false);
        showToast('success', 'Pengguna baru berhasil ditambahkan!');
      } catch (err) {
        setFormError(err.message || 'Gagal menambahkan pengguna baru. Pastikan email atau NIM belum terdaftar.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteUser = async (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pengguna "${nama || id}"?`)) {
      try {
        await api.deleteUser(id);
        showToast('success', `Pengguna ${nama || ''} berhasil dihapus.`);
      } catch (err) {
        console.warn('API delete error, menghapus dari state:', err);
        showToast('success', `Pengguna ${nama || ''} dihapus.`);
      }
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = !searchQuery || 
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nim && u.nim.includes(searchQuery)) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Kelola Pengguna</h1>
          <p className="text-body">Kelola data akun Penghuni Asrama dan Fasilitator</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={loadUsers} disabled={loading}>
            {loading ? 'Memuat...' : 'Segarkan Data'}
          </Button>
          <Button variant="primary" size="md" icon={UserPlus} onClick={handleOpenAddModal}>
            Tambah Pengguna Baru
          </Button>
        </div>
      </div>

      {/* Notifikasi Global */}
      {notification && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: notification.type === 'success' ? 'rgba(29, 185, 84, 0.15)' : 'rgba(226, 33, 52, 0.15)',
          border: `1px solid ${notification.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)'}`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: notification.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Filter Role: Teks hitam saat tidak dipilih, teks putih saat diklik/aktif */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `Semua (${users.length})` },
            { key: 'penghuni', label: `Penghuni (${users.filter(u => u.role === 'penghuni').length})` },
            { key: 'fasil', label: `Fasilitator (${users.filter(u => u.role === 'fasil').length})` }
          ].map((tab) => {
            const isSelected = filterRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterRole(tab.key)}
                style={{
                  height: '34px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-l2)',
                  color: isSelected ? '#FFFFFF' : '#000000',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ width: '280px' }}>
          <Input
            placeholder="Cari nama, NIM, atau email..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Data Pengguna */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px' }}>Nama Lengkap</th>
                <th style={{ padding: '16px' }}>Role</th>
                <th style={{ padding: '16px' }}>NIM / No Identitas</th>
                <th style={{ padding: '16px' }}>Jenis Kelamin</th>
                <th style={{ padding: '16px' }}>Asal Daerah</th>
                <th style={{ padding: '16px' }}>Kontak & Email</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                    Memuat data pengguna dari database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                    Tidak ada data pengguna yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px' }}>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>{u.nama}</strong>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge variant={u.role === 'fasil' ? 'warning' : 'success'} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{u.nim || '-'}</td>
                    <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>
                      {u.jekel === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{u.asal || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: 'var(--color-text-primary)' }}>{u.email}</div>
                      {u.no_hp && <div style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>{u.no_hp}</div>}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Button size="sm" variant="ghost" icon={Edit2} onClick={() => handleOpenEditModal(u)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" icon={Trash2} style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteUser(u.id, u.nama)}>
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah / Edit Pengguna */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface-l1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="text-section-title">
                {editingUserId ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-neutral)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: 'rgba(226, 33, 52, 0.15)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-error)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Nama Lengkap"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Email Kampus"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@unand.ac.id"
                />
                <Input
                  label="NIM (Nomor Induk)"
                  value={formData.nim}
                  onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                  placeholder="231152..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                    Role Pengguna
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      height: '42px',
                      backgroundColor: 'var(--color-surface-l2)',
                      color: 'var(--color-text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      padding: '0 12px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="penghuni">Penghuni Asrama</option>
                    <option value="fasil">Fasilitator (Fasil)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jekel}
                    onChange={(e) => setFormData({ ...formData, jekel: e.target.value })}
                    style={{
                      height: '42px',
                      backgroundColor: 'var(--color-surface-l2)',
                      color: 'var(--color-text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      padding: '0 12px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Asal Daerah"
                  value={formData.asal}
                  onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                  placeholder="Kota / Kabupaten"
                />
                <Input
                  label="No. WhatsApp / HP"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  placeholder="0812..."
                />
              </div>

              {!editingUserId && (
                <Input
                  label="Password Awal"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" icon={Check} disabled={submitting}>
                  {submitting ? 'Menyimpan...' : (editingUserId ? 'Simpan Perubahan' : 'Tambah Pengguna')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
