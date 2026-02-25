import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { API } from '../utils/api'

export default function Dashboard() {
  const { fetchWithAuth } = useAuth()
  const [data, setData] = useState({ total_pasien: 0, monitoring_terbaru: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWithAuth(`${API}/dashboard`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    )
  }

  const domainLabels = {
    pola_makan: 'Pola Makan',
    istirahat: 'Istirahat',
    aktivitas_fisik: 'Aktivitas Fisik',
    konsumsi_obat: 'Konsumsi Obat',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Total Pasien</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{data.total_pasien}</p>
          <Link
            to="/pasien"
            className="inline-block mt-3 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Lihat daftar pasien →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">4 Domain Monitoring</p>
          <p className="text-lg text-slate-700 mt-1">Pola makan, Istirahat, Aktivitas fisik, Konsumsi obat</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Skor Adekuat</p>
          <p className="text-lg text-slate-700 mt-1">≥ 70 = Adekuat, &lt; 70 = Tidak adekuat</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Monitoring Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          {data.monitoring_terbaru?.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Belum ada data monitoring</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pasien</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Skor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.monitoring_terbaru?.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-4">
                      <Link to={`/pasien/${m.patient_id}`} className="text-rose-600 hover:underline font-medium">
                        {m.patient_nama}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{domainLabels[m.domain] || m.domain}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {m.tanggal ? new Date(m.tanggal).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 font-medium">{m.skor_akhir}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          m.kategori === 'adekuat' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.kategori}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
