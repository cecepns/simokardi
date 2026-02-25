import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', nama: '', no_rm: '', tgl_lahir: '',
    gender: 'L', berat_badan: '', tinggi_badan: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    setLoading(true)
    try {
      await register(form.email, form.password, form.nama, {
        no_rm: form.no_rm,
        tgl_lahir: form.tgl_lahir,
        gender: form.gender,
        berat_badan: form.berat_badan,
        tinggi_badan: form.tinggi_badan,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
            <p className="text-slate-500 mt-1">Buat akun baru</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama lengkap *</label>
              <input type="text" name="nama" value={form.nama} onChange={handleChange} required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500" placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No. RM *</label>
              <input type="text" name="no_rm" value={form.no_rm} onChange={handleChange} required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500" placeholder="Nomor Rekam Medis" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tgl lahir *</label>
                <input type="date" name="tgl_lahir" value={form.tgl_lahir} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Berat (kg) *</label>
                <input type="number" name="berat_badan" value={form.berat_badan} onChange={handleChange} required step="0.1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500" placeholder="65" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tinggi (cm) *</label>
                <input type="number" name="tinggi_badan" value={form.tinggi_badan} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500" placeholder="170" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500" placeholder="nama@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500" placeholder="Minimal 6 karakter" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600 text-sm">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-rose-600 hover:underline font-medium">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
