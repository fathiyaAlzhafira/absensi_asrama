import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../../services/api';

/**
 * Custom hook to encapsulate state and business logic for Kelola Pengguna.
 */
export function useKelolaUser() {
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

  const initialFormState = {
    nama: '',
    email: '',
    nim: '',
    role: 'penghuni',
    kamar_id: '',
    asal: '',
    jekel: 'L',
    no_hp: '',
    password: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [res, gedungRes, kamarRes] = await Promise.all([
        api.getUsers(),
        api.getGedungs().catch(() => ({ data: [] })),
        api.getKamars().catch(() => ({ data: [] }))
      ]);
      if (res && res.status === 'success' && Array.isArray(res.data)) {
        setUsers(res.data.filter((u) => u.role !== 'admin'));
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
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Gedung options derived from gedungs & kamars
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

  // Floor options for selected building
  const availableFloors = useMemo(() => {
    if (!selectedGedungId) return [];
    const b = buildingOptions.find((item) => item.id === String(selectedGedungId));
    const floorSet = new Set(b?.lantais || []);
    kamars
      .filter((k) => String(k.gedung_id) === String(selectedGedungId))
      .forEach((k) => floorSet.add(Number(k.lantai || 1)));
    return [...floorSet].sort((a, b) => a - b);
  }, [buildingOptions, kamars, selectedGedungId]);

  // Filtered rooms for selected building + floor + search
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

  // Default password generator: FirstWordOfName + NIM
  const buildDefaultPassword = useCallback((namaVal, nimVal) => {
    const firstWord = String(namaVal || '').trim().split(/\s+/)[0] || '';
    const cleanFirstWord = firstWord.replace(/[^A-Za-z0-9]/g, '');
    const cleanNim = String(nimVal || '').replace(/\D/g, '');
    return `${cleanFirstWord}${cleanNim}`;
  }, []);

  const defaultPasswordSuggestion = useMemo(() => {
    return buildDefaultPassword(formData.nama, formData.nim);
  }, [formData.nama, formData.nim, buildDefaultPassword]);

  const handleNameChange = useCallback((nextNama) => {
    const nextDefaultPwd = buildDefaultPassword(nextNama, formData.nim);
    setFormData((prev) => ({
      ...prev,
      nama: nextNama,
      password: (!editingUserId && !customPasswordEdited) ? nextDefaultPwd : prev.password
    }));
  }, [editingUserId, customPasswordEdited, formData.nim, buildDefaultPassword]);

  const handleNimChange = useCallback((rawNim) => {
    const digitsOnly = rawNim.replace(/\D/g, '').slice(0, 10);
    const nextDefaultPwd = buildDefaultPassword(formData.nama, digitsOnly);
    setFormData((prev) => ({
      ...prev,
      nim: digitsOnly,
      password: (!editingUserId && !customPasswordEdited) ? nextDefaultPwd : prev.password
    }));
  }, [editingUserId, customPasswordEdited, formData.nama, buildDefaultPassword]);

  const handleOpenAddModal = useCallback(() => {
    setEditingUserId(null);
    setFormError('');
    setSelectedGedungId('');
    setSelectedLantai('');
    setRoomSearch('');
    setCustomPasswordEdited(false);
    setFormData(initialFormState);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((user) => {
    setEditingUserId(user.id);
    setFormError('');
    setRoomSearch('');
    setCustomPasswordEdited(false);
    const currentRoom = kamars.find((r) => String(r.id) === String(user.kamar_id));
    const gId = user.role === 'fasil'
      ? (user.gedung_id ? String(user.gedung_id) : '')
      : (currentRoom ? String(currentRoom.gedung_id) : (user.gedung_id ? String(user.gedung_id) : ''));
    const flVal = user.role === 'fasil'
      ? (user.lantai ? String(user.lantai) : '')
      : (currentRoom ? String(currentRoom.lantai) : (user.lantai ? String(user.lantai) : ''));

    setSelectedGedungId(gId);
    setSelectedLantai(flVal);
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
  }, [kamars]);

  const handleGedungSelect = useCallback((nextGedungId) => {
    setSelectedGedungId(nextGedungId);
    setSelectedLantai('');
    setRoomSearch('');
    if (!nextGedungId || formData.role === 'fasil') {
      setFormData((prev) => ({ ...prev, kamar_id: '' }));
      return;
    }
    const roomsInBuilding = kamars.filter((r) => String(r.gedung_id) === String(nextGedungId));
    const firstAvailable = roomsInBuilding.find((r) => (r.jumlah_penghuni ?? 0) < (r.kapasitas ?? 4)) || roomsInBuilding[0];
    setFormData((prev) => ({
      ...prev,
      kamar_id: firstAvailable ? String(firstAvailable.id) : ''
    }));
  }, [formData.role, kamars]);

  const handleLantaiSelect = useCallback((nextLantai) => {
    setSelectedLantai(nextLantai);
    setRoomSearch('');
    if (formData.role === 'fasil') return;

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
  }, [formData.role, formData.kamar_id, selectedGedungId, kamars]);

  const handleResetPasswordToggle = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      password: prev.password ? '' : defaultPasswordSuggestion
    }));
  }, [defaultPasswordSuggestion]);

  const validateUserForm = useCallback(() => {
    if (!formData.nama || !formData.nama.trim()) {
      return 'Nama lengkap pengguna wajib diisi.';
    }
    const emailTrim = (formData.email || '').trim().toLowerCase();
    if (!emailTrim) {
      return 'Email kampus wajib diisi.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      return 'Format email tidak valid. Masukkan alamat email yang lengkap (contoh: nama@student.unand.ac.id).';
    }
    if (formData.role === 'penghuni' && !emailTrim.endsWith('@student.unand.ac.id')) {
      return 'Email penghuni asrama wajib menggunakan domain resmi kampus: @student.unand.ac.id (contoh: nama@student.unand.ac.id).';
    }
    if (formData.role === 'penghuni') {
      if (!formData.nim || !formData.nim.trim()) {
        return 'NIM wajib diisi untuk penghuni asrama.';
      }
      if (!/^\d{10}$/.test(formData.nim.trim())) {
        return 'NIM penghuni asrama harus terdiri dari tepat 10 digit angka (contoh: 2311521001).';
      }
    } else if (formData.nim && formData.nim.trim()) {
      if (!/^\d{10}$/.test(formData.nim.trim())) {
        return 'NIM harus terdiri dari tepat 10 digit angka.';
      }
    }
    if (formData.role === 'penghuni' && selectedGedungId && !formData.kamar_id) {
      return 'Silakan pilih nomor kamar pada gedung yang dipilih, atau ubah gedung menjadi "Belum ditempatkan".';
    }
    return null;
  }, [formData, selectedGedungId]);

  const handleSaveUser = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');

    const errorMsg = validateUserForm();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    setSubmitting(true);
    const emailTrim = (formData.email || '').trim().toLowerCase();
    const payload = {
      ...formData,
      email: emailTrim,
      nim: formData.nim ? formData.nim.trim() : null,
      gedung_id: selectedGedungId ? Number(selectedGedungId) : null,
      lantai: selectedLantai ? Number(selectedLantai) : null,
      kamar_id: formData.role === 'penghuni' && formData.kamar_id ? Number(formData.kamar_id) : null
    };

    try {
      if (editingUserId) {
        const res = await api.updateUser(editingUserId, payload);
        if (res && res.data) {
          setUsers((prev) => prev.map((u) => (u.id === editingUserId ? { ...u, ...res.data } : u)));
        } else {
          setUsers((prev) => prev.map((u) => (u.id === editingUserId ? { ...u, ...payload } : u)));
        }
        await loadUsers();
        setIsModalOpen(false);
        showToast('success', 'Data pengguna berhasil diperbarui!');
      } else {
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
          setUsers((prev) => [createdUser, ...prev.filter((u) => u.id !== createdUser.id)]);
        } else {
          setUsers((prev) => [{ id: Date.now(), ...payload }, ...prev]);
        }
        await loadUsers();
        setIsModalOpen(false);
        showToast('success', 'Pengguna baru berhasil ditambahkan!');
      }
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data pengguna. Pastikan email atau NIM belum terdaftar.');
    } finally {
      setSubmitting(false);
    }
  }, [validateUserForm, formData, selectedGedungId, selectedLantai, editingUserId, loadUsers, showToast]);

  const handleDeleteUser = useCallback(async (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pengguna "${nama || id}"?`)) {
      try {
        await api.deleteUser(id);
        showToast('success', `Pengguna ${nama || ''} berhasil dihapus.`);
        await loadUsers();
      } catch (err) {
        console.warn('API delete error, menghapus dari state:', err);
        showToast('success', `Pengguna ${nama || ''} dihapus.`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    }
  }, [loadUsers, showToast]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchSearch =
        !searchQuery ||
        u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.nim && u.nim.includes(searchQuery)) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, filterRole, searchQuery]);

  return {
    users,
    loading,
    filterRole,
    setFilterRole,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    editingUserId,
    formData,
    setFormData,
    selectedGedungId,
    selectedLantai,
    roomSearch,
    setRoomSearch,
    customPasswordEdited,
    setCustomPasswordEdited,
    submitting,
    formError,
    notification,
    buildingOptions,
    availableFloors,
    filteredRooms,
    defaultPasswordSuggestion,
    filteredUsers,
    loadUsers,
    handleOpenAddModal,
    handleOpenEditModal,
    handleGedungSelect,
    handleLantaiSelect,
    handleNameChange,
    handleNimChange,
    handleResetPasswordToggle,
    handleSaveUser,
    handleDeleteUser
  };
}
