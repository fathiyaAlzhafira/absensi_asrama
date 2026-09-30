import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { UserPlus, Search, Edit2, Trash2, X, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function KelolaUser() {
  // Hanya menampilkan akun Penghuni & Fasil (Admin tunggal tidak dikelola di sini)
  const [users, setUsers] = useState([
    { id: 2, nama: 'Fasil Muhammad Rizky', email: 'fasil.rizky@unand.ac.id', role: 'fasil', nim: '2111522001', asal: 'Bukittinggi', jekel: 'L', no_hp: '081298765432' },
    { id: 3, nama: 'Fasil Siti Nurhaliza', email: 'fasil.siti@unand.ac.id', role: 'fasil', nim: '2111522002', asal: 'Payakumbuh', jekel: 'P', no_hp: '081211223344' },
    { id: 4, nama: 'Ahmad Fauzan', email: 'ahmad.fauzan@student.unand.ac.id', role: 'penghuni', nim: '2311521001', asal: 'Solok', jekel: 'L', no_hp: '081300010002' },
    { id: 5, nama: 'Budi Santoso', email: 'budi.santoso@student.unand.ac.id', role: 'penghuni', nim: '2311521002', asal: 'Pariaman', jekel: 'L', no_hp: '081300010003' },
    { id: 6, nama: 'Annisa Rahma', email: 'annisa.rahma@student.unand.ac.id', role: 'penghuni', nim: '2311522003', asal: 'Padang Panjang', jekel: 'P', no_hp: '081300010004' }
  ]);

  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

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
  const loadUsers = () => {
    api.getUsers().then((res) => {
      if (res && res.data && res.data.length > 0) {
        setUsers(res.data.filter(u => u.role !== 'admin'));
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUserId(null);
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
    if (editingUserId) {
      try {
        await api.updateUser(editingUserId, formData);
        loadUsers();
      } catch (err) {
        setUsers(users.map(u => u.id === editingUserId ? { ...u, ...formData } : u));
      }
      setIsModalOpen(false);
    } else {
      try {
        await api.createUser(formData);
        loadUsers();
      } catch (err) {
        setUsers([...users, { id: Date.now(), ...formData }]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data pengguna ini?')) {
      setUsers(users.filter(u => u.id !== id));
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Kelola Pengguna</h1>
          <p className="text-body">Kelola data akun Penghuni Asrama dan Fasilitator</p>
        </div>
        <Button variant="primary" size="md" icon={UserPlus} onClick={handleOpenAddModal}>
          Tambah Pengguna Baru
        </Button>
      </div>

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
              {filteredUsers.length === 0 ? (
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
                        <Button size="sm" variant="ghost" icon={Trash2} style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteUser(u.id)}>
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

      {/* Modal Tambah / Edit Pengguna (Admin tidak dapat ditambah karena admin tunggal) */}
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
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" icon={Check}>
                  Simpan Pengguna
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
