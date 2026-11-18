
/**
 * Base API Service for Absensi Asrama Unand
 * Menghubungkan Frontend React ke Backend CakePHP.
 */

const PRIMARY_API_URL = 'http://localhost:8765/api';
const FALLBACK_API_URL = '/api';

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

  let response;

  try {
    response = await fetch(
      `${PRIMARY_API_URL}${endpoint}`,
      config
    );
  } catch (primaryError) {
    try {
      response = await fetch(
        `${FALLBACK_API_URL}${endpoint}`,
        config
      );
    } catch (fallbackError) {
      console.error(
        `API Error on ${endpoint}:`,
        fallbackError
      );

      throw new Error(
        'Tidak dapat terhubung ke server. Pastikan backend CakePHP berjalan.'
      );
    }
  }

  const responseData = await response
    .json()
    .catch(() => ({}));

  if (response.status === 401 && endpoint !== '/auth/login') {
    clearInvalidSession();
  }

  if (!response.ok) {
    throw new Error(
      responseData.message ||
      `Terjadi kesalahan pada server (HTTP ${response.status}).`
    );
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

  getProfile: () =>
    apiRequest('/auth/profile'),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),

  // =========================
  // PRESENSI
  // =========================

  submitPresensi: (data) =>
    apiRequest('/presensis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyPresensi: () =>
    apiRequest('/presensis/my-history'),

  getTodayStatus: () =>
    apiRequest('/presensis/today-status'),

  getFasilDashboard: () =>
    apiRequest('/presensis/fasil-dashboard'),

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

  // =========================
  // IZIN
  // =========================

  submitIzin: (formData) =>
    apiRequest('/izins', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),

  getMyIzins: () =>
    apiRequest('/izins/my-permits'),

  getPendingIzins: () =>
    apiRequest('/izins/pending'),

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

  // =========================
  // USERS (ADMIN)
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
};
