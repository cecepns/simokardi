import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { API } from '../utils/api'

const domainLabels = {
  pola_makan: 'Pola Makan',
  istirahat: 'Istirahat',
  aktivitas_fisik: 'Aktivitas Fisik',
  konsumsi_obat: 'Konsumsi Obat',
}

const POLA_MAKAN_OPTIONS = [
  { key: 'karbohidrat', label: 'Karbohidrat' },
  { key: 'protein', label: 'Protein' },
  { key: 'sayur', label: 'Sayur' },
  { key: 'buah', label: 'Buah' },
]

export default function MonitoringForm({ patientId, domain, onSaved, onCancel, useMeApi }) {
  const { fetchWithAuth } = useAuth()
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({
    karbohidrat: '',
    protein: '',
    sayur: '',
    buah: '',
    jam_tidur: '',
    menit_aktivitas_fisik: '',
    menit_olahraga: '',
    minum_obat: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successResult, setSuccessResult] = useState(null)

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const isAllMode = domain === 'all'

  const buildPayloads = () => {
    const payloads = []
    const trim = (s) => (s && String(s).trim()) || ''
    const karbo = trim(form.karbohidrat)
    const protein = trim(form.protein)
    const sayur = trim(form.sayur)
    const buah = trim(form.buah)
    if (isAllMode) {
      payloads.push({
        domain: 'pola_makan',
        data: { karbohidrat: karbo, protein, sayur, buah },
      })
      payloads.push({
        domain: 'istirahat',
        data: { jam_tidur: parseFloat(form.jam_tidur) || 0 },
      })
      payloads.push({
        domain: 'aktivitas_fisik',
        data: {
          menit_aktivitas_fisik: parseFloat(form.menit_aktivitas_fisik) || 0,
          menit_olahraga: parseFloat(form.menit_olahraga) || 0,
        },
      })
      payloads.push({
        domain: 'konsumsi_obat',
        data: { minum_obat: form.minum_obat === true },
      })
    } else {
      if (domain === 'pola_makan') {
        payloads.push({
          domain: 'pola_makan',
          data: { karbohidrat: karbo, protein, sayur, buah },
        })
      } else if (domain === 'istirahat') {
        payloads.push({
          domain: 'istirahat',
          data: { jam_tidur: parseFloat(form.jam_tidur) || 0 },
        })
      } else if (domain === 'aktivitas_fisik') {
        payloads.push({
          domain: 'aktivitas_fisik',
          data: {
            menit_aktivitas_fisik: parseFloat(form.menit_aktivitas_fisik) || 0,
            menit_olahraga: parseFloat(form.menit_olahraga) || 0,
          },
        })
      } else if (domain === 'konsumsi_obat') {
        payloads.push({
          domain: 'konsumsi_obat',
          data: { minum_obat: form.minum_obat === true },
        })
      }
    }
    return payloads
  }

  const validate = () => {
    if (isAllMode) {
      if (form.minum_obat === null) {
        setError('Pilih apakah hari ini minum obat atau tidak')
        return false
      }
    } else {
      if (domain === 'konsumsi_obat' && form.minum_obat === null) {
        setError('Pilih apakah hari ini minum obat atau tidak')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError('')

    const payloads = buildPayloads()
    const url = useMeApi ? `${API}/me/monitoring` : `${API}/patients/${patientId}/monitoring`

    try {
      if (payloads.length === 1) {
        const { domain: d, data } = payloads[0]
        const res = await fetchWithAuth(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tanggal, domain: d, data }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Gagal menyimpan')
        setSuccessResult(result)
      } else {
        const results = []
        for (const { domain: d, data } of payloads) {
          const res = await fetchWithAuth(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tanggal, domain: d, data }),
          })
          const result = await res.json()
          if (!res.ok) throw new Error(result.error || `Gagal menyimpan ${domainLabels[d]}`)
          results.push({ domain: d, ...result })
        }
        setSuccessResult(results)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSuccess = () => {
    setSuccessResult(null)
    onSaved()
  }

  const renderPolaMakan = (showSection) => {
    if (!showSection) return null
    const placeholders = {
      karbohidrat: 'Contoh: nasi, kentang, roti',
      protein: 'Contoh: ayam, telur, tempe, ikan',
      sayur: 'Contoh: bayam, kangkung, wortel',
      buah: 'Contoh: pisang, apel, jeruk',
    }
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Isi apa yang dikonsumsi per kategori. 4 lengkap = 100%, 3 = 75%, 2 = 50%, 1 = 25%. Di bawah 50% = tidak adekuat. AI akan memberikan estimasi nilai gizi sebagai informasi.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {POLA_MAKAN_OPTIONS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type="text"
                value={form[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholders[key]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderIstirahat = (showSection) => {
    if (!showSection) return null
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Normal 7–8 jam = 100%. Di bawah 7 jam = 50% (tidak adekuat).
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jam tidur per malam</label>
          <input
            type="number"
            value={form.jam_tidur}
            onChange={(e) => handleChange('jam_tidur', e.target.value)}
            min="0"
            max="24"
            step="0.5"
            placeholder="Contoh: 7.5"
            className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>
    )
  }

  const renderAktivitasFisik = (showSection) => {
    if (!showSection) return null
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Aktivitas fisik 50% + Olahraga 50% = 100%. Tanpa olahraga maksimal 50% = tidak adekuat.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Menit aktivitas fisik/minggu (50%)</label>
            <input
              type="number"
              value={form.menit_aktivitas_fisik}
              onChange={(e) => handleChange('menit_aktivitas_fisik', e.target.value)}
              min="0"
              placeholder="Contoh: 150"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Menit olahraga/minggu (50%)</label>
            <input
              type="number"
              value={form.menit_olahraga}
              onChange={(e) => handleChange('menit_olahraga', e.target.value)}
              min="0"
              placeholder="Contoh: 75"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderKonsumsiObat = (showSection) => {
    if (!showSection) return null
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Minum obat = adekuat. Tidak minum = tidak adekuat.
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Hari ini minum obat sesuai resep?</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="minum_obat"
                checked={form.minum_obat === true}
                onChange={() => handleChange('minum_obat', true)}
                className="border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-700">Ya</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="minum_obat"
                checked={form.minum_obat === false}
                onChange={() => handleChange('minum_obat', false)}
                className="border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-700">Tidak</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  const successIsArray = Array.isArray(successResult)

  return (
    <>
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Data Berhasil Disimpan</h3>
              <p className="text-emerald-100 text-sm">Monitoring self-care telah dicatat</p>
            </div>
            <div className="p-6 space-y-4">
              {successIsArray ? (
                <div className="space-y-3">
                  {successResult.map((r) => (
                    <div key={r.domain}>
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                        <span className="text-slate-600 font-medium">{domainLabels[r.domain]}</span>
                        <span className="text-slate-800 font-semibold">{r.skor_akhir}%</span>
                        <span
                          className={`text-sm font-medium ${r.kategori === 'adekuat' ? 'text-emerald-600' : 'text-amber-600'}`}
                        >
                          {r.kategori === 'adekuat' ? 'Adekuat' : 'Tidak Adekuat'}
                        </span>
                      </div>
                      {r.domain === 'pola_makan' && r.estimasi_gizi && (
                        <div className="mt-2 rounded-xl bg-slate-50 p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm">
                          <div><p className="text-slate-500">Karbo</p><p className="font-semibold">{r.estimasi_gizi.karbohidrat_persen}%</p></div>
                          <div><p className="text-slate-500">Protein</p><p className="font-semibold">{r.estimasi_gizi.protein_gram}g</p></div>
                          <div><p className="text-slate-500">Lemak</p><p className="font-semibold">{r.estimasi_gizi.lemak_persen}%</p></div>
                          <div><p className="text-slate-500">Sayur</p><p className="font-semibold">{r.estimasi_gizi.sayur_porsi ?? '-'} porsi</p></div>
                          <div><p className="text-slate-500">Buah</p><p className="font-semibold">{r.estimasi_gizi.buah_porsi ?? '-'} porsi</p></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                    <span className="text-slate-600 font-medium">Skor</span>
                    <span className="text-2xl font-bold text-slate-800">{successResult.skor_akhir}%</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                    <span className="text-slate-600 font-medium">Kategori</span>
                    <span
                      className={`font-semibold capitalize ${
                        successResult.kategori === 'adekuat' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {successResult.kategori === 'adekuat' ? 'Adekuat' : 'Tidak Adekuat'}
                    </span>
                  </div>
                  {successResult.estimasi_gizi && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Estimasi Gizi (AI – informasi)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                        <div className="p-2 rounded-lg bg-white"><p className="text-xs text-slate-500">Karbo</p><p className="font-bold">{successResult.estimasi_gizi.karbohidrat_persen}%</p></div>
                        <div className="p-2 rounded-lg bg-white"><p className="text-xs text-slate-500">Protein</p><p className="font-bold">{successResult.estimasi_gizi.protein_gram}g</p></div>
                        <div className="p-2 rounded-lg bg-white"><p className="text-xs text-slate-500">Lemak</p><p className="font-bold">{successResult.estimasi_gizi.lemak_persen}%</p></div>
                        <div className="p-2 rounded-lg bg-white"><p className="text-xs text-slate-500">Sayur</p><p className="font-bold">{successResult.estimasi_gizi.sayur_porsi ?? '-'} porsi</p></div>
                        <div className="p-2 rounded-lg bg-white"><p className="text-xs text-slate-500">Buah</p><p className="font-bold">{successResult.estimasi_gizi.buah_porsi ?? '-'} porsi</p></div>
                      </div>
                    </div>
                  )}
                </>
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {!isAllMode && (
          <h3 className="font-medium text-slate-800">Input Data: {domainLabels[domain]}</h3>
        )}
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

        {isAllMode && (
          <>
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Pola Makan</h4>
              {renderPolaMakan(true)}
            </div>
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Istirahat</h4>
              {renderIstirahat(true)}
            </div>
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Aktivitas Fisik</h4>
              {renderAktivitasFisik(true)}
            </div>
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Konsumsi Obat</h4>
              {renderKonsumsiObat(true)}
            </div>
          </>
        )}

        {!isAllMode && (
          <>
            {renderPolaMakan(domain === 'pola_makan')}
            {renderIstirahat(domain === 'istirahat')}
            {renderAktivitasFisik(domain === 'aktivitas_fisik')}
            {renderKonsumsiObat(domain === 'konsumsi_obat')}
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
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Batal
          </button>
        </div>
      </form>
    </>
  )
}
