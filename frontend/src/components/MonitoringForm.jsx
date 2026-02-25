import { useState } from 'react'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { API } from '../utils/api'
const domainLabels = {
  pola_makan: 'Pola Makan',
  istirahat: 'Istirahat',
  aktivitas_fisik: 'Aktivitas Fisik',
  konsumsi_obat: 'Konsumsi Obat',
}

const CARA_MASAK_OPTIONS = [
  { value: 'goreng', label: 'Goreng' },
  { value: 'rebus', label: 'Rebus' },
  { value: 'kukus', label: 'Kukus' },
  { value: 'bakar', label: 'Bakar' },
  { value: 'tumis', label: 'Tumis' },
  { value: 'lainnya', label: 'Lainnya' },
]

export default function MonitoringForm({ patientId, patient, domain, onSaved, onCancel, useMeApi }) {
  const { fetchWithAuth } = useAuth()
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({})
  const [makananItems, setMakananItems] = useState([{ jenis: '', jumlah: '', cara_masak: 'rebus' }])
  const [minumanItems, setMinumanItems] = useState([{ jenis: '', jumlah: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successResult, setSuccessResult] = useState(null)

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const addMakanan = () => setMakananItems((prev) => [...prev, { jenis: '', jumlah: '', cara_masak: 'rebus' }])
  const removeMakanan = (i) => setMakananItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateMakanan = (i, field, val) => {
    setMakananItems((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  const addMinuman = () => setMinumanItems((prev) => [...prev, { jenis: '', jumlah: '' }])
  const removeMinuman = (i) => setMinumanItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateMinuman = (i, field, val) => {
    setMinumanItems((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let data = {}
    if (domain === 'pola_makan') {
      const makanan = makananItems.filter((m) => m.jenis?.trim())
      const minuman = minumanItems.filter((m) => m.jenis?.trim())
      if (!makanan.length && !minuman.length) {
        setError('Isi minimal 1 makanan atau 1 minuman')
        setLoading(false)
        return
      }
      data = { makanan, minuman }
    } else if (domain === 'istirahat') {
      data = { jam_tidur: parseFloat(form.jam_tidur) || 0 }
    } else if (domain === 'aktivitas_fisik') {
      data = {
        menit_per_minggu: parseFloat(form.menit_per_minggu) || 0,
        intensitas: form.intensitas || 'sedang',
      }
    } else if (domain === 'konsumsi_obat') {
      data = { skor_kepatuhan: parseFloat(form.skor_kepatuhan) || 0 }
    }

    try {
      const url = useMeApi ? `${API}/me/monitoring` : `${API}/patients/${patientId}/monitoring`
      const res = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, domain, data }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan')
      setSuccessResult(result)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleCloseSuccess = () => {
    setSuccessResult(null)
    onSaved()
  }

  return (
    <>
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Data Berhasil Disimpan</h3>
              <p className="text-emerald-100 text-sm">Monitoring self-care telah dicatat</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Skor</span>
                <span className="text-2xl font-bold text-slate-800">{successResult.skor_akhir}</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Kategori</span>
                <span className={`font-semibold capitalize ${successResult.kategori === 'adekuat' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {successResult.kategori === 'adekuat' ? 'Adekuat' : 'Tidak Adekuat'}
                </span>
              </div>
              {successResult.estimasi_gizi && (
                <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Estimasi Gizi (AI)</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-white shadow-sm">
                      <p className="text-xs text-slate-500">Karbohidrat</p>
                      <p className="text-lg font-bold text-slate-800">{successResult.estimasi_gizi.karbohidrat_persen}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white shadow-sm">
                      <p className="text-xs text-slate-500">Protein</p>
                      <p className="text-lg font-bold text-slate-800">{successResult.estimasi_gizi.protein_gram}g</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white shadow-sm">
                      <p className="text-xs text-slate-500">Lemak</p>
                      <p className="text-lg font-bold text-slate-800">{successResult.estimasi_gizi.lemak_persen}%</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleCloseSuccess}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-medium text-slate-800">Input Data: {domainLabels[domain]}</h3>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal *</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          required
          className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg"
        />
      </div>

      {domain === 'pola_makan' && (
        <>
          <p className="text-xs text-slate-500">
            Catat makanan dan minuman sehari-hari. Nilai gizi akan dihitung otomatis dengan AI.
          </p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700">Makanan</label>
                <button
                  type="button"
                  onClick={addMakanan}
                  className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>
              <div className="space-y-3">
                {makananItems.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg"
                  >
                    <input
                      type="text"
                      placeholder="Jenis makanan (misal: nasi putih, ayam, sayur bayam)"
                      value={item.jenis}
                      onChange={(e) => updateMakanan(i, 'jenis', e.target.value)}
                      className="sm:col-span-4 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Jumlah (misal: 1 porsi, 100 gram)"
                      value={item.jumlah}
                      onChange={(e) => updateMakanan(i, 'jumlah', e.target.value)}
                      className="sm:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <select
                      value={item.cara_masak}
                      onChange={(e) => updateMakanan(i, 'cara_masak', e.target.value)}
                      className="sm:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      {CARA_MASAK_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMakanan(i)}
                      className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-2 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700">Minuman</label>
                <button
                  type="button"
                  onClick={addMinuman}
                  className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>
              <div className="space-y-3">
                {minumanItems.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg"
                  >
                    <input
                      type="text"
                      placeholder="Jenis minuman (misal: teh manis, air putih, susu)"
                      value={item.jenis}
                      onChange={(e) => updateMinuman(i, 'jenis', e.target.value)}
                      className="sm:col-span-5 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Jumlah (misal: 2 gelas, 300 ml)"
                      value={item.jumlah}
                      onChange={(e) => updateMinuman(i, 'jumlah', e.target.value)}
                      className="sm:col-span-5 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeMinuman(i)}
                      className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-2 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {domain === 'istirahat' && (
        <>
          <p className="text-xs text-slate-500">
            Rekomendasi NSF: 7–9 jam (18–64 th) atau 7–8 jam (≥65 th) per malam
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Jam tidur per malam</label>
            <input
              type="number"
              value={form.jam_tidur || ''}
              onChange={(e) => handleChange('jam_tidur', e.target.value)}
              min="0"
              max="24"
              step="0.5"
              placeholder="Contoh: 7.5"
              className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </>
      )}

      {domain === 'aktivitas_fisik' && (
        <>
          <p className="text-xs text-slate-500">
            WHO: Sedang 150–300 menit/minggu atau Berat 75–150 menit/minggu
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Menit per minggu</label>
              <input
                type="number"
                value={form.menit_per_minggu || ''}
                onChange={(e) => handleChange('menit_per_minggu', e.target.value)}
                min="0"
                placeholder="Contoh: 150"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Intensitas</label>
              <select
                value={form.intensitas || 'sedang'}
                onChange={(e) => handleChange('intensitas', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="sedang">Sedang</option>
                <option value="berat">Berat</option>
              </select>
            </div>
          </div>
        </>
      )}

      {domain === 'konsumsi_obat' && (
        <>
          <p className="text-xs text-slate-500">Skala 1–5: 1 = tidak patuh, 5 = sangat patuh</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Skor kepatuhan (1-5)</label>
            <input
              type="number"
              value={form.skor_kepatuhan || ''}
              onChange={(e) => handleChange('skor_kepatuhan', e.target.value)}
              min="1"
              max="5"
              step="0.5"
              placeholder="1 s/d 5"
              className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">
          Batal
        </button>
      </div>
    </form>
    </>
  )
}
