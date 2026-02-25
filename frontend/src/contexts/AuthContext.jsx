import { createContext, useContext, useState, useEffect } from 'react'

const API = '/api'
const TOKEN_KEY = 'simokardi_token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const getToken = () => localStorage.getItem(TOKEN_KEY)

  const fetchWithAuth = (url, opts = {}) => {
    const token = getToken()
    return fetch(url, {
      ...opts,
      headers: {
        ...opts.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  const loadUser = async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await fetchWithAuth(`${API}/auth/me`)
      if (res.ok) {
        const u = await res.json()
        setUser(u)
      } else {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login gagal')
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  const register = async (email, password, nama, patientData = {}) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nama, ...patientData }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registrasi gagal')
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchWithAuth, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
