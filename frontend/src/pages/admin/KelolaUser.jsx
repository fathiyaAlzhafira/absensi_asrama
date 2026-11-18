import React, { useState, useEffect, useMemo } from 'react';
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
  const [gedungs, setGedungs] = useState([]);
  const [kamars, setKamars] = useState([]);
  const [selectedGedungId, setSelectedGedungId] = useState('');
  const [selectedLantai, setSelectedLantai] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [customPasswordEdited, setCustomPasswordEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    nim: '',
    role: 'penghuni',
    kamar_id: '',
    asal: '',
    jekel: 'L',
    no_hp: '',
    password: ''
  });

  // Ambil data users, gedung, dan daftar kamar terbaru dari backend
  const loadUsers = async () => {
    setLoading(true);
    try {
      const [res, gedungRes, kamarRes] = await Promise.all([
        api.getUsers(),
        api.getGedungs().catch(() => ({ data: [] })),
        api.getKamars().catch(() => ({ data: [] }))
      ]);
      if (res && res.status === 'success' && Array.isArray(res.data)) {
        setUsers(res.data.filter(u => u.role !== 'admin'));
      }
      if (Array.isArray(gedungRes?.data)) {
        setGedungs(gedungRes.data);
      }
      if (Array.isArray(kamarRes?.data)) {
        setKamars(kamarRes.data);
      }
    } catch (err) {
      console.warn('Gagal memuat pengguna dari server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Daftar gedung gabungan (dari tabel gedungs dan kamars)
  const buildingOptions = useMemo(() => {
    const map = new Map();
    gedungs.forEach((g) => {
      if (g.is_active !== false || String(g.id) === String(selectedGedungId)) {
        map.set(String(g.id), {
          id: String(g.id),
          nama: g.nama,
          lantais: Array.isArray(g.lantais) ? g.lantais.map((l) => Number(l.nomor_lantai)) : []
        });
      }
    });
    kamars.forEach((k) => {
      const gId = String(k.gedung_id || '');
      if (!gId) return;
      if (!map.has(gId)) {
        map.set(gId, { id: gId, nama: k.gedung_nama || `Gedung ${gId}`, lantais: [] });
      }
      const entry = map.get(gId);
      const fl = Number(k.lantai || 1);
      if (!entry.lantais.includes(fl)) {
        entry.lantais.push(fl);
      }
    });
    return [...map.values()].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [gedungs, kamars, selectedGedungId]);

  // Daftar lantai untuk gedung yang sedang dipilih
  const availableFloors = useMemo(() => {
    if (!selectedGedungId) return [];
    const b = buildingOptions.find((item) => item.id === String(selectedGedungId));
    const floorSet = new Set(b?.lantais || []);
    kamars
      .filter((k) => String(k.gedung_id) === String(selectedGedungId))
      .forEach((k) => floorSet.add(Number(k.lantai || 1)));
    return [...floorSet].sort((a, b) => a - b);
  }, [buildingOptions, kamars, selectedGedungId]);

  // Daftar kamar yang sudah difilter berdasarkan Gedung -> Lantai -> Pencarian Nomor Kamar
  const filteredRooms = useMemo(() => {
    if (!selectedGedungId) return [];
    const q = roomSearch.trim().toLowerCase();
    return kamars.filter((room) => {
      if (String(room.gedung_id) !== String(selectedGedungId)) return false;
      if (selectedLantai && String(room.lantai) !== String(selectedLantai)) return false;
      if (q && !String(room.nomor_kamar || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [kamars, selectedGedungId, selectedLantai, roomSearch]);

  // Buat password default dari Nama Gedung Asrama + NIM (mis. RPX2311521001)
  const buildDefaultPassword = (gedungIdVal, nimVal) => {
    const foundBuilding = buildingOptions.find((b) => String(b.id) === String(gedungIdVal));
    const buildingPrefix = foundBuilding?.nama
      ? String(foundBuilding.nama).replace(/\s+/g, '')
      : 'Asrama';
    const cleanNim = String(nimVal || '').replace(/\D/g, '');
    return `${buildingPrefix}${cleanNim}`;
  };

  const defaultPasswordSuggestion = buildDefaultPassword(selectedGedungId, formData.nim);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormError('');
    setSelectedGedungId('');
    setSelectedLantai('');
    setRoomSearch('');
    setCustomPasswordEdited(false);
    setFormData({
      nama: '',
      email: '',
      nim: '',
      role: 'penghuni',
      kamar_id: '',
      asal: '',
      jekel: 'L',
      no_hp: '',
      password: 'Asrama'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUserId(user.id);
    setFormError('');
    setRoomSearch('');
    setCustomPasswordEdited(false);
    const currentRoom = kamars.find((r) => String(r.id) === String(user.kamar_id));
    setSelectedGedungId(currentRoom ? String(currentRoom.gedung_id) : '');
    setSelectedLantai(currentRoom ? String(currentRoom.lantai) : '');
    setFormData({
      nama: user.nama || '',
      email: user.email || '',
      nim: user.nim ? String(user.nim).replace(/\D/g, '') : '',
      role: user.role === 'fasil' ? 'fasil' : 'penghuni',
      kamar_id: user.kamar_id ? String(user.kamar_id) : '',
      asal: user.asal || '',
      jekel: user.jekel || 'L',
      no_hp: user.no_hp || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleGedungSelect = (nextGedungId) => {
    setSelectedGedungId(nextGedungId);
    setSelectedLantai('');
    setRoomSearch('');
    const nextDefaultPwd = buildDefaultPassword(nextGedungId, formData.nim);
    if (!nextGedungId) {
      setFormData((prev) => ({
        ...prev,
        kamar_id: '',
        password: (!editingUserId && !customPasswordEdited) ? nextDefaultPwd : prev.password
      }));
      return;
    }
    const roomsInBuilding = kamars.filter((r) => String(r.gedung_id) === String(nextGedungId));
    const firstAvailable = roomsInBuilding.find((r) => (r.jumlah_penghuni ?? 0) < (r.kapasitas ?? 4)) || roomsInBuilding[0];
    setFormData((prev) => ({
      ...prev,
      kamar_id: firstAvailable ? String(firstAvailable.id) : '',
      password: (!editingUserId && !customPasswordEdited) ? nextDefaultPwd : prev.password
    }));
  };

  const handleLantaiSelect = (nextLantai) => {
    setSelectedLantai(nextLantai);
    setRoomSearch('');
    const matchingRooms = kamars.filter((r) =>
      String(r.gedung_id) === String(selectedGedungId) &&
      (!nextLantai || String(r.lantai) === String(nextLantai))
    );
    if (!matchingRooms.some((r) => String(r.id) === String(formData.kamar_id))) {
      const firstAvailable = matchingRooms.find((r) => (r.jumlah_penghuni ?? 0) < (r.kapasitas ?? 4)) || matchingRooms[0];
      setFormData((prev) => ({
        ...prev,
        kamar_id: firstAvailable ? String(firstAvailable.id) : ''
      }));
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.nim && !/^\d+$/.test(formData.nim)) {
      setFormError('NIM hanya boleh berisi angka.');
      return;
    }

    if (formData.role === 'penghuni' && selectedGedungId && !formData.kamar_id) {
      setFormError('Silakan pilih nomor kamar pada gedung yang dipilih, atau ubah gedung menjadi "Belum ditempatkan".');
      return;
    }

    setSubmitting(true);

    const payload = {
      ...formData,
      nim: formData.nim ? formData.nim.trim() : null,
      kamar_id: formData.role === 'penghuni' && formData.kamar_id ? Number(formData.kamar_id) : null
    };

    if (editingUserId) {
      try {
        const res = await api.updateUser(editingUserId, payload);
        if (res && res.data) {
          setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...res.data } : u));
        } else {
          setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...payload } : u));
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
        const res = await api.createUser(payload);
        if (res && res.data) {
          const createdUser = {
            id: res.data.id || Date.now(),
            nama: res.data.nama || payload.nama,
            email: res.data.email || payload.email,
            nim: res.data.nim || payload.nim,
            role: res.data.role || payload.role,
            asal: res.data.asal || payload.asal,
            jekel: res.data.jekel || payload.jekel,
            no_hp: res.data.no_hp || payload.no_hp,
            kamar_id: res.data.kamar_id ?? payload.kamar_id,
            kamar: res.data.kamar || null,
            gedung: res.data.gedung || null
          };
          setUsers(prev => [createdUser, ...prev.filter(u => u.id !== createdUser.id)]);
        } else {
          setUsers(prev => [{ id: Date.now(), ...payload }, ...prev]);
        }
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
        await loadUsers();
      } catch (err) {
        console.warn('API delete error, menghapus dari state:', err);
        showToast('success', `Pengguna ${nama || ''} dihapus.`);
        setUsers(prev => prev.filter(u => u.id !== id));
      }
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

  const selectStyle = {
    height: '42px',
    backgroundColor: 'var(--color-surface-l2)',
    color: 'var(--color-text-primary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    padding: '0 12px',
    fontSize: '13px',
    width: '100%'
  };

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
                  color: isSelected ? '#FFFFFF' : 'var(--color-text-primary)',
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
                <th style={{ padding: '16px' }}>Gedung &amp; Kamar</th>
                <th style={{ padding: '16px' }}>NIM / No Identitas</th>
                <th style={{ padding: '16px' }}>Jenis Kelamin</th>
                <th style={{ padding: '16px' }}>Asal Daerah</th>
                <th style={{ padding: '16px' }}>Kontak &amp; Email</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                    Memuat data pengguna dari database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
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
                    <td style={{ padding: '16px', color: 'var(--color-text-primary)' }}>
                      {u.role === 'penghuni'
                        ? (u.gedung && u.kamar ? `${u.gedung} · Kamar ${u.kamar}` : 'Belum ditempatkan')
                        : '-'}
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
            maxWidth: '540px',
            padding: '24px',
            maxHeight: '92vh',
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={20}
                  value={formData.nim}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    const nextDefaultPwd = buildDefaultPassword(selectedGedungId, digitsOnly);
                    setFormData((prev) => ({
                      ...prev,
                      nim: digitsOnly,
                      password: (!editingUserId && !customPasswordEdited) ? nextDefaultPwd : prev.password
                    }));
                  }}
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
                    style={selectStyle}
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
                    style={selectStyle}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              {formData.role === 'penghuni' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-l2)',
                  border: '1px solid var(--color-border)'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Penempatan Gedung &amp; Kamar
                  </span>

                  {/* 1. Gedung Asrama */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                      Gedung Asrama
                    </label>
                    <select
                      value={selectedGedungId}
                      onChange={(e) => handleGedungSelect(e.target.value)}
                      style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)' }}
                    >
                      <option value="">Belum ditempatkan</option>
                      {buildingOptions.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Lantai */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                      Lantai
                    </label>
                    <select
                      value={selectedLantai}
                      onChange={(e) => handleLantaiSelect(e.target.value)}
                      disabled={!selectedGedungId}
                      style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)', opacity: selectedGedungId ? 1 : 0.6 }}
                    >
                      <option value="">Semua Lantai</option>
                      {availableFloors.map((fl) => (
                        <option key={fl} value={fl}>
                          Lantai {fl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Kamar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                      Kamar
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '10px' }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!selectedGedungId}
                        value={roomSearch}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setRoomSearch(val);
                          const q = val.trim().toLowerCase();
                          if (q) {
                            const firstMatch = kamars.find((r) =>
                              String(r.gedung_id) === String(selectedGedungId) &&
                              (!selectedLantai || String(r.lantai) === String(selectedLantai)) &&
                              String(r.nomor_kamar || '').toLowerCase().includes(q)
                            );
                            if (firstMatch) {
                              setFormData((prev) => ({ ...prev, kamar_id: String(firstMatch.id) }));
                            }
                          }
                        }}
                        placeholder="Cari nomor kamar..."
                        style={{
                          ...selectStyle,
                          backgroundColor: 'var(--color-surface-l1)',
                          outline: 'none',
                          opacity: selectedGedungId ? 1 : 0.6
                        }}
                      />

                      <select
                        value={formData.kamar_id}
                        disabled={!selectedGedungId}
                        onChange={(e) => setFormData({ ...formData, kamar_id: e.target.value })}
                        style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)', opacity: selectedGedungId ? 1 : 0.6 }}
                      >
                        <option value="">
                          {selectedGedungId ? `-- Pilih Kamar (${filteredRooms.length} tersedia) --` : 'Pilih gedung terlebih dahulu'}
                        </option>
                        {filteredRooms.map((room) => {
                          const terisi = Number(room.jumlah_penghuni ?? 0);
                          const kapasitas = Number(room.kapasitas ?? 4);
                          const isCurrentUserRoom = editingUserId && String(room.id) === String(formData.kamar_id);
                          const isFull = terisi >= kapasitas && !isCurrentUserRoom;
                          return (
                            <option key={room.id} value={room.id} disabled={isFull}>
                              Kamar {room.nomor_kamar} (Lt. {room.lantai}) — {terisi}/{kapasitas}{isFull ? ' [Penuh]' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {selectedGedungId && filteredRooms.length === 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                        {roomSearch
                          ? `Tidak ada kamar dengan nomor "${roomSearch}" pada filter ini.`
                          : 'Gedung/lantai ini belum memiliki kamar. Tambahkan kamar di menu Kelola Kamar.'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Asal Daerah"
                  value={formData.asal}
                  onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                  placeholder="Kota / Kabupaten"
                />
                <Input
                  label="No. WhatsApp / HP"
                  type="text"
                  inputMode="numeric"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value.replace(/[^\d+]/g, '') })}
                  placeholder="0812..."
                />
              </div>

              <Input
                label={editingUserId ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Awal'}
                type="password"
                required={!editingUserId}
                value={formData.password}
                onChange={(e) => {
                  setCustomPasswordEdited(true);
                  setFormData({ ...formData, password: e.target.value });
                }}
                placeholder={editingUserId ? 'Isi hanya jika ingin mereset password' : 'Minimal 6 karakter'}
              />

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
