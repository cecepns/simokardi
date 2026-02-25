import { useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting.current || loading) return
    setError('')
    setLoading(true)
    submitting.current = true
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SIMOKARDI</h1>
            <p className="text-slate-500 mt-1">Masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600 text-sm">
            Belum punya akun?{' '}
            <Link to="/register" className="text-rose-600 hover:underline font-medium">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
