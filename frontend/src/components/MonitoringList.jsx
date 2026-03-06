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
        const filled = (s) => s != null && String(s).trim() !== ''
        const parts = []
        if (filled(d.karbohidrat)) parts.push('Karbo')
        if (filled(d.protein)) parts.push('Protein')
        if (filled(d.sayur)) parts.push('Sayur')
        if (filled(d.buah)) parts.push('Buah')
        return parts.length ? parts.join(', ') : '-'
      }
      if (m.domain === 'istirahat') return `${d.jam_tidur} jam tidur`
      if (m.domain === 'aktivitas_fisik') {
        const a = d.menit_aktivitas_fisik ?? '-'
        const o = d.menit_olahraga ?? '-'
        return `Aktivitas ${a} menit | Olahraga ${o} menit`
      }
      if (m.domain === 'konsumsi_obat') return d.minum_obat ? 'Minum obat' : 'Tidak minum'
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
