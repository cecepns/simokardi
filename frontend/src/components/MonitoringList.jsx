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
      const normalizeMakanan = (value) => {
        if (value && typeof value === 'object') {
          const makanan = String(value.makanan || '').trim()
          const porsi = parseFloat(value.porsi)
          if (!makanan) return ''
          if (Number.isFinite(porsi) && porsi > 0) return `${makanan} (${porsi} porsi)`
          return makanan
        }
        return String(value || '').trim()
      }
      if (m.domain === 'pola_makan') {
        const filled = (s) => s != null && String(s).trim() !== ''
        const karbo = normalizeMakanan(d.karbohidrat)
        const protein = normalizeMakanan(d.protein)
        const sayur = normalizeMakanan(d.sayur)
        const buah = normalizeMakanan(d.buah)
        const parts = []
        if (filled(karbo)) parts.push(`Karbo: ${karbo}`)
        if (filled(protein)) parts.push(`Protein: ${protein}`)
        if (filled(sayur)) parts.push(`Sayur: ${sayur}`)
        if (filled(buah)) parts.push(`Buah: ${buah}`)
        return parts.length ? parts.join(', ') : '-'
      }
      if (m.domain === 'istirahat') {
        const siang = d.jam_tidur_siang ?? 0
        const malam = d.jam_tidur_malam ?? d.jam_tidur ?? 0
        return `Tidur siang ${siang} jam | tidur malam ${malam} jam`
      }
      if (m.domain === 'aktivitas_fisik') {
        const kategori = String(d.kategori_aktivitas_harian || '').trim()
        return kategori ? `Aktivitas harian ${kategori}` : '-'
      }
      if (m.domain === 'konsumsi_obat') return d.minum_obat ? 'Minum obat' : 'Tidak minum'
    } catch {
      return '-'
    }
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
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status SC-CHDI</th>
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
                  {m.kategori === 'adekuat' ? 'Adekuat' : 'Tidak Adekuat'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
