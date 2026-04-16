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

const AKTIVITAS_HARIAN_OPTIONS = [
  {
    key: 'ringan',
    label: 'Ringan',
    detail: 'Aktivitas rumah tangga ringan, jalan santai, peregangan (<3 METs)',
  },
  {
    key: 'sedang',
    label: 'Sedang',
    detail: 'Jalan cepat/bersepeda santai 30 menit (3-6 METs, rekomendasi utama WHO)',
  },
  {
    key: 'berat',
    label: 'Berat',
    detail: 'Lari, naik tangga intens, bersepeda cepat (>6 METs)',
  },
]

const MENIT_OPTIONS = [0, 15, 30, 45]

function getUsia(patient) {
  const age = Number(patient?.usia)
  if (Number.isFinite(age)) return age
  return 0
}

function getRekomendasiTidurByUsia(usia) {
  if (usia >= 65) return { malam: '7-8 jam', siang: '0.5-1.5 jam' }
  if (usia >= 18) return { malam: '7-9 jam', siang: '0-1 jam' }
  return { malam: '8-10 jam', siang: '1-2 jam' }
}

function normalizeMakananKategori(input) {
  if (input && typeof input === 'object') {
    return {
      makanan: input.makanan || '',
      porsi: input.porsi ?? '',
    }
  }
  return {
    makanan: input || '',
    porsi: '',
  }
}

export default function MonitoringForm({ patientId, patient, domain, onSaved, onCancel, useMeApi }) {
  const { fetchWithAuth } = useAuth()
  const usia = getUsia(patient)
  const rekomendasiTidur = getRekomendasiTidurByUsia(usia)
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({
    karbohidrat: { makanan: '', porsi: '' },
    protein: { makanan: '', porsi: '' },
    sayur: { makanan: '', porsi: '' },
    buah: { makanan: '', porsi: '' },
    jam_tidur_siang_jam: '',
    jam_tidur_siang_menit: '0',
    jam_tidur_malam_jam: '',
    jam_tidur_malam_menit: '0',
    kategori_aktivitas_harian: '',
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

  const toJamDesimal = (jamStr, menitStr) => {
    if (jamStr === '') return 0
    const jam = parseInt(jamStr, 10)
    const menit = parseInt(menitStr || '0', 10)
    if (!Number.isFinite(jam) || !Number.isFinite(menit)) return 0
    return jam + (menit / 60)
  }

  const buildPayloads = () => {
    const payloads = []
    const trim = (s) => (s && String(s).trim()) || ''
    const kategoriMakanan = {
      karbohidrat: normalizeMakananKategori(form.karbohidrat),
      protein: normalizeMakananKategori(form.protein),
      sayur: normalizeMakananKategori(form.sayur),
      buah: normalizeMakananKategori(form.buah),
    }
    const buildKategoriPayload = (key) => {
      const current = kategoriMakanan[key]
      return {
        makanan: trim(current.makanan),
        porsi: parseFloat(current.porsi) || 0,
      }
    }
    if (isAllMode) {
      payloads.push({
        domain: 'pola_makan',
        data: {
          karbohidrat: buildKategoriPayload('karbohidrat'),
          protein: buildKategoriPayload('protein'),
          sayur: buildKategoriPayload('sayur'),
          buah: buildKategoriPayload('buah'),
        },
      })
      payloads.push({
        domain: 'istirahat',
        data: {
          jam_tidur_siang: toJamDesimal(form.jam_tidur_siang_jam, form.jam_tidur_siang_menit),
          jam_tidur_malam: toJamDesimal(form.jam_tidur_malam_jam, form.jam_tidur_malam_menit),
        },
      })
      payloads.push({
        domain: 'aktivitas_fisik',
        data: { kategori_aktivitas_harian: form.kategori_aktivitas_harian },
      })
      payloads.push({
        domain: 'konsumsi_obat',
        data: { minum_obat: form.minum_obat === true },
      })
    } else {
      if (domain === 'pola_makan') {
        payloads.push({
          domain: 'pola_makan',
          data: {
            karbohidrat: buildKategoriPayload('karbohidrat'),
            protein: buildKategoriPayload('protein'),
            sayur: buildKategoriPayload('sayur'),
            buah: buildKategoriPayload('buah'),
          },
        })
      } else if (domain === 'istirahat') {
        payloads.push({
          domain: 'istirahat',
          data: {
            jam_tidur_siang: toJamDesimal(form.jam_tidur_siang_jam, form.jam_tidur_siang_menit),
            jam_tidur_malam: toJamDesimal(form.jam_tidur_malam_jam, form.jam_tidur_malam_menit),
          },
        })
      } else if (domain === 'aktivitas_fisik') {
        payloads.push({
          domain: 'aktivitas_fisik',
          data: { kategori_aktivitas_harian: form.kategori_aktivitas_harian },
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
    const needsAktivitasValidation = isAllMode || domain === 'aktivitas_fisik'
    const needsObatValidation = isAllMode || domain === 'konsumsi_obat'

    if (needsAktivitasValidation && !form.kategori_aktivitas_harian) {
      setError('Pilih kategori aktivitas fisik harian (ringan/sedang/berat)')
      return false
    }

    if (needsObatValidation && form.minum_obat === null) {
      setError('Pilih apakah hari ini minum obat atau tidak')
      return false
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
      karbohidrat: 'Contoh: nasi merah, kentang rebus, mie jagung',
      protein: 'Contoh: ayam kukus, telur rebus, tempe',
      sayur: 'Contoh: bayam, brokoli, wortel',
      buah: 'Contoh: pepaya, apel, pir',
    }
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Isi makanan yang dikonsumsi beserta porsinya. Setiap kategori terisi (karbo, protein, sayur, buah) bernilai 25%.
          Ambang adekuat SC-CHDI minimal 70%. AI akan memberikan estimasi nilai gizi sebagai informasi.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {POLA_MAKAN_OPTIONS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">{label}</label>
              <input
                type="text"
                value={normalizeMakananKategori(form[key]).makanan}
                onChange={(e) =>
                  handleChange(key, {
                    ...normalizeMakananKategori(form[key]),
                    makanan: e.target.value,
                  })
                }
                placeholder={placeholders[key]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <div>
                <label className="block text-xs text-slate-500 mb-1">Porsi</label>
                <input
                  type="number"
                  value={normalizeMakananKategori(form[key]).porsi}
                  onChange={(e) =>
                    handleChange(key, {
                      ...normalizeMakananKategori(form[key]),
                      porsi: e.target.value,
                    })
                  }
                  min="0"
                  step="0.5"
                  placeholder="Contoh: 1.5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderIstirahat = (showSection) => {
    if (!showSection) return null
    const jamOptionsSiang = Array.from({ length: 7 }, (_, i) => i)
    const jamOptionsMalam = Array.from({ length: 15 }, (_, i) => i)
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Rekomendasi usia {usia} tahun: tidur malam {rekomendasiTidur.malam} dan tidur siang {rekomendasiTidur.siang}.
          Keduanya dihitung dalam skor SC-CHDI.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jam tidur siang</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.jam_tidur_siang_jam}
                onChange={(e) => handleChange('jam_tidur_siang_jam', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Jam</option>
                {jamOptionsSiang.map((j) => (
                  <option key={`siang-jam-${j}`} value={String(j)}>
                    {j} jam
                  </option>
                ))}
              </select>
              <select
                value={form.jam_tidur_siang_menit}
                onChange={(e) => handleChange('jam_tidur_siang_menit', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {MENIT_OPTIONS.map((m) => (
                  <option key={`siang-menit-${m}`} value={String(m)}>
                    {m} menit
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jam tidur malam</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.jam_tidur_malam_jam}
                onChange={(e) => handleChange('jam_tidur_malam_jam', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Jam</option>
                {jamOptionsMalam.map((j) => (
                  <option key={`malam-jam-${j}`} value={String(j)}>
                    {j} jam
                  </option>
                ))}
              </select>
              <select
                value={form.jam_tidur_malam_menit}
                onChange={(e) => handleChange('jam_tidur_malam_menit', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {MENIT_OPTIONS.map((m) => (
                  <option key={`malam-menit-${m}`} value={String(m)}>
                    {m} menit
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderAktivitasFisik = (showSection) => {
    if (!showSection) return null
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Pilih kategori aktivitas fisik per hari sesuai teori intensitas. Skor SC-CHDI: ringan 40%, sedang 80%, berat 100%.
        </p>
        <div className="space-y-2">
          {AKTIVITAS_HARIAN_OPTIONS.map((item) => (
            <label
              key={item.key}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                form.kategori_aktivitas_harian === item.key
                  ? 'border-rose-300 bg-rose-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="kategori_aktivitas_harian"
                checked={form.kategori_aktivitas_harian === item.key}
                onChange={() => handleChange('kategori_aktivitas_harian', item.key)}
                className="mt-1 border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800 capitalize">{item.label}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    )
  }

  const renderKonsumsiObat = (showSection) => {
    if (!showSection) return null
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Minum obat sesuai resep = 100% (adekuat). Tidak minum = 0% (tidak adekuat) pada domain SC-CHDI konsumsi obat.
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
                    <span className="text-slate-600 font-medium">Status SC-CHDI</span>
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
