
/**
 * Base API Service for Absensi Asrama Unand
 * Menghubungkan Frontend React ke Backend CakePHP.
 */

const PRIMARY_API_URL = '/api';
const FALLBACK_API_URL = 'http://127.0.0.1:8765/api';

/**
 * Membersihkan sesi lokal ketika backend mengembalikan HTTP 401.
 */
function clearInvalidSession() {
  localStorage.removeItem('asrama_token');
  localStorage.removeItem('asrama_auth_user');

  window.dispatchEvent(
    new Event('asrama:unauthorized')
  );
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('asrama_token');

  const defaultHeaders = {
    Accept: 'application/json',

    ...(options.isFormData
      ? {}
      : { 'Content-Type': 'application/json' }),

    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Coba ke /api (Vite proxy) terlebih dahulu. Fallback ke http://127.0.0.1:8765/api
  // hanya dipakai jika koneksi jaringan terputus, bukan saat server membalas error validasi.
  let response;
  try {
    response = await fetch(`${PRIMARY_API_URL}${endpoint}`, config);
  } catch (netErr) {
    try {
      response = await fetch(`${FALLBACK_API_URL}${endpoint}`, config);
    } catch {
      console.warn(`Network Error on ${endpoint}:`, netErr.message);
      throw new Error('Tidak dapat terhubung ke server backend. Pastikan server CakePHP sedang aktif.');
    }
  }

  const rawText = await response.text();
  let responseData = {};
  if (rawText) {
    try {
      responseData = JSON.parse(rawText);
    } catch {
      responseData = { _raw: rawText.slice(0, 200) };
    }
  }

  if (response.status === 401 && endpoint !== '/auth/login') {
    clearInvalidSession();
  }

  if (!response.ok) {
    let errorMsg = responseData.message;
    if (!errorMsg && responseData.errors) {
      errorMsg = Object.values(responseData.errors)
        .map((err) => (typeof err === 'object' ? Object.values(err).join(', ') : err))
        .join(', ');
    }
    const error = new Error(errorMsg || `Permintaan gagal (status: ${response.status})`);
    error.status = response.status;
    error.errors = responseData.errors;
    throw error;
  }

  if (responseData._raw) {
    throw new Error(`Respons server tidak valid (bukan JSON): ${responseData._raw.replace(/<[^>]+>/g, ' ').trim().slice(0, 120)}`);
  }

  return responseData;
}

// Shortcut API Methods.
export const api = {
  // =========================
  // AUTHENTICATION
  // =========================
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }).catch(() => ({})),

  // =========================
  // PRESENSI
  // =========================
  submitPresensi: (data) =>
    apiRequest('/presensis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyPresensi: () => apiRequest('/presensis/my-history'),
  getTodayStatus: () => apiRequest('/presensis/today-status'),
  getFasilDashboard: () => apiRequest('/presensis/fasil-dashboard'),

  getPresensiMonitoring: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return apiRequest(`/presensis/monitoring${qs ? `?${qs}` : ''}`);
  },

  getPresensiDetail: (id) =>
    apiRequest(`/presensis/monitoring/${id}`),

  getLaporanPresensi: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return apiRequest(`/presensis/laporan${qs ? `?${qs}` : ''}`);
  },

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

  // =========================
  // IZIN
  // =========================
  submitIzin: (formData) =>
    apiRequest('/izins', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),

  getMyIzins: () => apiRequest('/izins/my-permits'),
  getPendingIzins: () => apiRequest('/izins/pending'),

  getIzins: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return apiRequest(`/izins/list${qs ? `?${qs}` : ''}`);
  },

  getIzinDetail: (id) =>
    apiRequest(`/izins/${id}`),

  verifyIzin: (id, status, catatan) =>
    apiRequest(`/izins/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status, catatan }),
    }),

  cancelIzin: (id) => apiRequest(`/izins/${id}`, { method: 'DELETE' }),

  // =========================
  // USERS (ADMIN & FASIL)
  // =========================
  getUsers: (role) =>
    apiRequest(
      `/users${role ? `?role=${encodeURIComponent(role)}` : ''}`
    ),

  getPenghuni: (params = {}) => {
    const searchParams = new URLSearchParams({ role: 'penghuni' });
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, val);
      }
    });
    return apiRequest(`/users?${searchParams.toString()}`);
  },

  getPenghuniDetail: (id) =>
    apiRequest(`/users/${id}/detail`),

  getPenghuniPresensis: (id) =>
    apiRequest(`/users/${id}/presensis`),

  getPenghuniIzins: (id) =>
    apiRequest(`/users/${id}/izins`),

  createUser: (data) =>
    apiRequest('/users/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => apiRequest(`/users/${id}/delete`, { method: 'DELETE' }),

  // =========================
  // BUILDINGS, FLOORS & ROOMS
  // =========================
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
  deleteLantai: (id) => apiRequest(`/lantais/${id}`, { method: 'DELETE' }),

  // =========================
  // PENGATURAN JADWAL PRESENSI
  // =========================
  getPengaturanPresensi: () => apiRequest('/pengaturan-presensi'),
  updatePengaturanPresensi: (data) => apiRequest('/pengaturan-presensi', { method: 'PUT', body: JSON.stringify(data) }),

  // =========================
  // DASHBOARD ADMINISTRATOR
  // =========================
  getDashboardStats: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  }
};
