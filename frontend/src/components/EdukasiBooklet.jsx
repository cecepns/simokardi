import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

export default function EdukasiBooklet() {
  const [openSection, setOpenSection] = useState(null)

  const toggle = (key) => setOpenSection((prev) => (prev === key ? null : key))

  const sections = [
    {
      key: 'tujuan',
      title: 'Tujuan Pemantauan',
      icon: '📋',
      content: (
        <div className="space-y-3 text-slate-600 text-sm">
          <p>Booklet ini sebagai media edukasi dan alat kontrol mandiri untuk membantu mengelola kesehatan secara berkelanjutan.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Meningkatkan kesadaran untuk hidup sehat</li>
            <li>Membantu pencatatan harian</li>
            <li>Mendorong perubahan perilaku sehat</li>
            <li>Media komunikasi dengan tenaga kesehatan</li>
          </ul>
        </div>
      ),
    },
    {
      key: 'pola_makan',
      title: 'Pola Makan & Porsi Normal',
      icon: '🍽️',
      content: (
        <div className="space-y-6 text-slate-600 text-sm">
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Penggolongan Makanan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <strong>Karbohidrat:</strong> Nasi, ubi, tepung (mie, pasta)
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <strong>Protein:</strong> Telur, ayam, daging, ikan
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <strong>Lemak sehat:</strong> Alpukat, kacang, minyak olive
              </div>
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
                <strong>Vitamin:</strong> Buah dan sayur
              </div>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-slate-800 mb-2">Bolehkah Makan Mie?</h4>
            <p className="mb-2">Boleh, tetapi dibatasi porsinya dan pilih jenis yang lebih baik untuk jantung.</p>
            <ul className="space-y-1">
              <li>• Pilih: mie gandum utuh, mie jagung, bihun/kwetiau secukupnya</li>
              <li>• Batasi: mie instan (tinggi natrium, lemak, dan bumbu)</li>
              <li>• Jika makan mie: tambahkan sayur + protein rendah lemak, kurangi kuah/bumbu</li>
              <li>• Porsi anjuran: sekitar 1 porsi kecil per makan, tidak setiap hari</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Normal Porsi Karbohidrat (≤60% kalori/hari)</h4>
            <ul className="space-y-1 text-sm">
              <li>• 1 centong nasi (100g matang) ≈ 40g karbohidrat</li>
              <li>• 1 lembar roti tawar ≈ 15–20g</li>
              <li>• 1 kentang sedang ≈ 30g</li>
              <li>• <strong>Contoh 1x makan normal:</strong> 2 centong nasi (80g karbo)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Normal Porsi Protein (0,8–1,2 g/kg BB/hari)</h4>
            <p className="mb-2">Contoh 1 porsi: 1 telur, 1 potong ikan/ayam tanpa kulit, 2 potong tempe/tahu, 1 gelas susu rendah lemak.</p>
            <p className="text-amber-800 bg-amber-50 p-2 rounded text-xs">Utamakan rebus, kukus, pepes, tumis. Batasi gorengan & santan kental.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Normal Porsi Lemak (≤30% kalori/hari)</h4>
            <ul className="space-y-1 text-sm mb-2">
              <li>• 1 sdm minyak ≈ 14g lemak</li>
              <li>• 1 butir telur ≈ 5g, 1 genggam kacang ≈ 10–15g</li>
              <li>• Gunakan minyak 2–3 sdm total per hari (bukan per makan)</li>
            </ul>
            <p className="text-emerald-800 bg-emerald-50 p-2 rounded text-xs">Pilih lemak sehat: ikan, alpukat, kacang. Hindari gorengan berlebihan.</p>
          </div>
        </div>
      ),
    },
    {
      key: 'istirahat',
      title: 'Istirahat yang Cukup',
      icon: '😴',
      content: (
        <div className="space-y-4 text-slate-600 text-sm">
          <p>Istirahat yang cukup penting untuk memulihkan energi dan menjaga kesehatan.</p>
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
            <h4 className="font-semibold text-slate-800 mb-2">Normal Waktu Tidur (NSF)</h4>
            <ul>
              <li><strong>Usia 18–64 tahun:</strong> malam 7–9 jam + siang 0–1 jam</li>
              <li><strong>Usia ≥65 tahun:</strong> malam 7–8 jam + siang 0,5–1,5 jam</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">Rentang optimal untuk hormon, metabolik, kesehatan kardiovaskular, dan kemampuan kognitif.</p>
          </div>
        </div>
      ),
    },
    {
      key: 'aktivitas',
      title: 'Olahraga & Aktivitas Fisik',
      icon: '🏃',
      content: (
        <div className="space-y-4 text-slate-600 text-sm">
          <p>Olahraga penting untuk kebugaran, mengontrol berat badan, dan menurunkan risiko penyakit.</p>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 className="font-semibold text-slate-800 mb-2">Kategori Aktivitas Per Hari (Teori Intensitas)</h4>
            <ul className="space-y-1">
              <li>• <strong>Ringan (&lt;3 METs):</strong> jalan santai, aktivitas rumah tangga ringan</li>
              <li>• <strong>Sedang (3–6 METs):</strong> jalan cepat, bersepeda santai, senam ringan</li>
              <li>• <strong>Berat (&gt;6 METs):</strong> lari, naik tangga intens, bersepeda cepat</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">WHO: target mingguan setara 150–300 menit aktivitas sedang atau 75–150 menit aktivitas berat.</p>
          </div>
        </div>
      ),
    },
    {
      key: 'obat',
      title: 'Konsumsi Obat',
      icon: '💊',
      content: (
        <div className="space-y-3 text-slate-600 text-sm">
          <p>Kepatuhan minum obat sesuai resep dokter sangat memengaruhi pengendalian penyakit kronis.</p>
          <p>Skala kepatuhan 1–5: 1 = tidak patuh, 5 = sangat patuh.</p>
        </div>
      ),
    },
    {
      key: 'motivasi',
      title: 'Motivasi Hidup Sehat',
      icon: '💪',
      content: (
        <div className="p-4 bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl border border-rose-200 text-slate-700 text-sm italic">
          <p>Hidup sehat adalah bentuk cinta pada diri sendiri. Setiap pilihan kecil—makan lebih baik, rutin bergerak, dan cukup istirahat—adalah investasi untuk masa depan. Tidak perlu sempurna, cukup konsisten dan lebih baik dari kemarin.</p>
          <p className="mt-3 font-semibold text-rose-700">Kesehatanmu berada di tanganmu. Ayo sehatkan diri dimulai dari kesadaran diri sendiri.</p>
        </div>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Edukasi Gaya Hidup Sehat
        </h2>
        <p className="text-emerald-100 text-sm mt-1">Sumber: Booklet Menerapkan Hidup Sehat dengan Pantau Pola Makan</p>
      </div>
      <div className="divide-y divide-slate-200">
        {sections.map((s) => (
          <div key={s.key}>
            <button
              onClick={() => toggle(s.key)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-3 font-medium text-slate-800">
                <span className="text-xl">{s.icon}</span>
                {s.title}
              </span>
              {openSection === s.key ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {openSection === s.key && (
              <div className="px-6 pb-4 pt-0">
                {s.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
