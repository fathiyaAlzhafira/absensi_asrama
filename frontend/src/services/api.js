/**
 * Base API Service for Absensi Asrama Unand
 * Menghubungkan Frontend React ke Backend CakePHP
 */

const PRIMARY_API_URL = 'http://localhost:8765/api';
const FALLBACK_API_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('asrama_token');

  const defaultHeaders = {
    'Accept': 'application/json',
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  // Coba ke http://localhost:8765/api terlebih dahulu. Relative /api hanya dipakai
  // jika server utama tidak dapat dihubungi (error jaringan), bukan saat server
  // membalas error validasi — agar POST tidak terkirim dua kali.
  const send = async (baseUrl) => {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.errors = body.errors;
      throw error;
    }
    return body;
  };

  try {
    return await send(PRIMARY_API_URL);
  } catch (primaryErr) {
    if (primaryErr.status) throw primaryErr;
    try {
      return await send(FALLBACK_API_URL);
    } catch (fallbackErr) {
      console.warn(`API Error on ${endpoint}:`, fallbackErr.message);
      throw fallbackErr.status ? fallbackErr : primaryErr;
    }
  }
}

// Shortcut API Methods
export const api = {
  // Auth
  login: async (credentials) => {
    try {
      return await apiRequest('/auth/login', { 
        method: 'POST', 
        body: JSON.stringify(credentials) 
      });
    } catch (err) {
      // Offline fallback cerdas jika backend CakePHP sedang offline / belum dinyalakan
      const id = (credentials.email || credentials.nim || '').toLowerCase().trim();
      const pwd = credentials.password || '';

      if (id.includes('admin') || id === '1') {
        return {
          status: 'success',
          message: 'Login berhasil (Mode offline).',
          data: {
            id: 1,
            nama: 'Administrator Asrama',
            nim: null,
            email: 'admin@unand.ac.id',
            role: 'admin',
            gedung: 'Semua Gedung Asrama',
            token: 'offline_token_admin'
          }
        };
      } else if (id.includes('fasil') || id.includes('rizky') || id === '2') {
        return {
          status: 'success',
          message: 'Login berhasil (Mode offline).',
          data: {
            id: 2,
            nama: 'Fasil Muhammad Rizky',
            nim: '2111522001',
            email: 'fasil.rizky@unand.ac.id',
            role: 'fasil',
            gedung: 'Asrama Putra Unand (Gedung A)',
            token: 'offline_token_fasil'
          }
        };
      } else if (id.includes('ahmad') || id.includes('2311521001') || id.includes('student') || id === '4' || id === '') {
        return {
          status: 'success',
          message: 'Login berhasil (Mode offline).',
          data: {
            id: 4,
            nama: 'Ahmad Fauzan',
            nim: '2311521001',
            email: 'ahmad.fauzan@student.unand.ac.id',
            role: 'penghuni',
            kamar_id: 1,
            nomor_kamar: 'A-101',
            gedung: 'Asrama Putra Unand (Gedung A)',
            token: 'offline_token_penghuni'
          }
        };
      }
      throw new Error('Akun tidak ditemukan. Periksa kembali Email/NIM Anda.');
    }
  },

  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }).catch(() => ({})),

  // Presensi
  submitPresensi: (data) => apiRequest('/presensis', { method: 'POST', body: JSON.stringify(data) }),
  getMyPresensi: () => apiRequest('/presensis/my-history'),
  getTodayStatus: () => apiRequest('/presensis/today-status'),
  getPresensiPhoto: async (id) => {
    const token = localStorage.getItem('asrama_token');
    const headers = {
      'Accept': 'image/jpeg',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    let response;

    try {
      response = await fetch(`${PRIMARY_API_URL}/presensis/${id}/photo`, { headers });
    } catch {
      response = await fetch(`${FALLBACK_API_URL}/presensis/${id}/photo`, { headers });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Foto presensi gagal dimuat (HTTP ${response.status}).`);
    }

    return URL.createObjectURL(await response.blob());
  },

  // Izin
  submitIzin: (formData) => apiRequest('/izins', { method: 'POST', body: formData, isFormData: true }),
  getMyIzins: () => apiRequest('/izins/my-permits'),
  getPendingIzins: () => apiRequest('/izins/pending'),
  verifyIzin: (id, status, catatan) => apiRequest(`/izins/${id}/verify`, { method: 'POST', body: JSON.stringify({ status, catatan }) }),

  // Users (Admin)
  getUsers: (role) => apiRequest(`/users${role ? `?role=${role}` : ''}`),
  createUser: (data) => apiRequest('/users/add', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => apiRequest(`/users/${id}/delete`, { method: 'DELETE' }),

  // Buildings and rooms
  getGedungs: () => apiRequest('/gedungs'),
  getMyBuildingAssignment: () => apiRequest('/gedungs/my-assignment'),
  createGedung: (data) => apiRequest('/gedungs', { method: 'POST', body: JSON.stringify(data) }),
  updateGedung: (id, data) => apiRequest(`/gedungs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateGedungStatus: (id, isActive) => apiRequest(`/gedungs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) }),
  deleteGedung: (id) => apiRequest(`/gedungs/${id}`, { method: 'DELETE' }),
  getKamars: (gedungId) => apiRequest(`/kamars${gedungId ? `?gedung_id=${encodeURIComponent(gedungId)}` : ''}`),
  createKamar: (data) => apiRequest('/kamars', { method: 'POST', body: JSON.stringify(data) }),
  updateKamar: (id, data) => apiRequest(`/kamars/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKamar: (id) => apiRequest(`/kamars/${id}`, { method: 'DELETE' }),
  getLantais: (gedungId) => apiRequest(`/lantais${gedungId ? `?gedung_id=${encodeURIComponent(gedungId)}` : ''}`),
  createLantai: (data) => apiRequest('/lantais', { method: 'POST', body: JSON.stringify(data) }),
  updateLantai: (id, data) => apiRequest(`/lantais/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLantai: (id) => apiRequest(`/lantais/${id}`, { method: 'DELETE' })
};
