export default function MonitoringList({ monitoring, domainLabels }) {
  if (!monitoring?.length) {
    return (
      <div className="p-8 text-center text-slate-500">
        Belum ada data monitoring. Klik tombol di atas untuk menambah data.
      </div>
    )
  }

  const formatData = (m) => {
    try {
      const d = typeof m.data_json === 'string' ? JSON.parse(m.data_json) : m.data_json
      if (m.domain === 'pola_makan') {
        if (d.makanan?.length || d.minuman?.length) {
          const parts = []
          if (d.karbohidrat_persen != null) parts.push(`Karbo ${d.karbohidrat_persen}%`)
          if (d.protein_gram != null) parts.push(`Protein ${d.protein_gram}g`)
          if (d.lemak_persen != null) parts.push(`Lemak ${d.lemak_persen}%`)
          if (parts.length) return parts.join(' | ') + ' (AI)'
          const items = [...(d.makanan || []).map((x) => x.jenis), ...(d.minuman || []).map((x) => x.jenis)]
          return items.filter(Boolean).join(', ') || '-'
        }
        return `Karbo ${d.karbohidrat_persen}% | Protein ${d.protein_gram}g | Lemak ${d.lemak_persen}%`
      }
      if (m.domain === 'istirahat') return `${d.jam_tidur} jam tidur`
      if (m.domain === 'aktivitas_fisik') return `${d.menit_per_minggu} menit/minggu (${d.intensitas})`
      if (m.domain === 'konsumsi_obat') return `Kepatuhan: ${d.skor_kepatuhan}/5`
    } catch (_) {}
    return '-'
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Domain</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Skor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {monitoring.map((m) => (
            <tr key={m.id}>
              <td className="px-6 py-4 text-slate-600">
                {m.tanggal ? new Date(m.tanggal).toLocaleDateString('id-ID') : '-'}
              </td>
              <td className="px-6 py-4 font-medium text-slate-800">
                {domainLabels?.[m.domain] || m.domain}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{formatData(m)}</td>
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
    </div>
  )
}
