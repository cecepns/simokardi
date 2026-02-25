import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const API = '/api'

export default function PasienForm() {
  const { fetchWithAuth } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    no_rm: '',
    nama: '',
    tgl_lahir: '',
    gender: 'L',
    berat_badan: '',
    tinggi_badan: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      fetchWithAuth(`${API}/patients/${id}`)
        .then((res) => res.json())
        .then((data) =>
          setForm({
            no_rm: data.no_rm || '',
            nama: data.nama || '',
            tgl_lahir: data.tgl_lahir || '',
            gender: data.gender || 'L',
            berat_badan: data.berat_badan ?? '',
            tinggi_badan: data.tinggi_badan ?? '',
          })
        )
        .catch(() => setError('Gagal memuat data pasien'))
    }
  }, [id, isEdit, fetchWithAuth])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const url = isEdit ? `${API}/patients/${id}` : `${API}/patients`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')
      navigate(isEdit ? `/pasien/${id}` : '/pasien')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {isEdit ? 'Edit Pasien' : 'Tambah Pasien'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">No. RM *</label>
            <input
              type="text"
              name="no_rm"
              value={form.no_rm}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Nomor Rekam Medis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap *</label>
            <input
              type="text"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Nama pasien"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Lahir *</label>
            <input
              type="date"
              name="tgl_lahir"
              value={form.tgl_lahir}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Berat Badan (kg) *</label>
            <input
              type="number"
              name="berat_badan"
              value={form.berat_badan}
              onChange={handleChange}
              required
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Contoh: 65"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tinggi Badan (cm) *</label>
            <input
              type="number"
              name="tinggi_badan"
              value={form.tinggi_badan}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Contoh: 170"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
