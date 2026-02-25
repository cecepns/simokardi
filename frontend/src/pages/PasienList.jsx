import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { API } from '../utils/api'

export default function PasienList() {
  const { fetchWithAuth } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchWithAuth(`${API}/patients`)
      .then((res) => res.json())
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [fetchWithAuth])

  const filtered = patients.filter(
    (p) =>
      p.nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.no_rm?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Daftar Pasien</h1>
        <Link
          to="/pasien/tambah"
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Pasien
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama atau No. RM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {patients.length === 0 ? (
              <>
                <p className="mb-4">Belum ada pasien terdaftar</p>
                <Link to="/pasien/tambah" className="text-rose-600 hover:underline font-medium">
                  Tambah pasien pertama →
                </Link>
              </>
            ) : (
              'Tidak ada hasil pencarian'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">No. RM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">BB/TB</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-600">{p.no_rm}</td>
                    <td className="px-6 py-4">
                      <Link to={`/pasien/${p.id}`} className="font-medium text-rose-600 hover:underline">
                        {p.nama}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.usia} th</td>
                    <td className="px-6 py-4 text-slate-600">{p.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.berat_badan} kg / {p.tinggi_badan} cm
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/pasien/${p.id}`}
                        className="text-rose-600 hover:text-rose-700 font-medium text-sm"
                      >
                        Lihat →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
