const rawBase = "https://api-inventory.isavralabel.com/simokardi/api"

// Gunakan env jika ada, fallback ke '/api' (untuk dev + proxy)
const base = rawBase && rawBase.length > 0 ? rawBase : '/api'

// Hilangkan trailing slash supaya bisa aman digabung dengan path
export const API = base.replace(/\/+$/, '')

export function apiPath(path = '') {
  if (!path) return API
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API}${normalized}`
}

