import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import MonitoringForm from '../components/MonitoringForm'
import MonitoringList from '../components/MonitoringList'
import EdukasiBooklet from '../components/EdukasiBooklet'

const API = '/api'

const domainLabels = {
  pola_makan: 'Pola Makan',
  istirahat: 'Istirahat',
  aktivitas_fisik: 'Aktivitas Fisik',
  konsumsi_obat: 'Konsumsi Obat',
}

export default function PasienDashboard() {
  const { fetchWithAuth, user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [monitoring, setMonitoring] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [showEdukasi, setShowEdukasi] = useState(true)

  const loadData = () => {
    Promise.all([
      fetchWithAuth(`${API}/me/patient`).then((r) => r.json()),
      fetchWithAuth(`${API}/me/monitoring`).then((r) => r.json()),
    ])
      .then(([p, m]) => {
        setPatient(p)
        setMonitoring(m)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [fetchWithAuth])

  const handleMonitoringSaved = () => {
    setShowForm(false)
    setSelectedDomain(null)
    loadData()
  }

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Data Monitoring Saya</h1>
          <p className="text-slate-600">No. RM: {patient.no_rm} | Usia: {patient.usia} tahun</p>
        </div>
        <button
          onClick={() => setShowEdukasi(!showEdukasi)}
          className={`self-start px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showEdukasi ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {showEdukasi ? 'Sembunyikan Edukasi' : 'Edukasi Gaya Hidup Sehat'}
        </button>
      </div>

      {showEdukasi && (
        <div className="mb-8">
          <EdukasiBooklet />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Gender</h3>
          <p className="text-lg">{patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Berat Badan</h3>
          <p className="text-lg">{patient.berat_badan} kg</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Tinggi Badan</h3>
          <p className="text-lg">{patient.tinggi_badan} cm</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-800">Input Data Self-Care</h2>
          {!showForm && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(domainLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedDomain(key)
                    setShowForm(true)
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 text-sm font-medium"
                >
                  + {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <MonitoringForm
              patientId={patient.id}
              patient={patient}
              domain={selectedDomain}
              onSaved={handleMonitoringSaved}
              onCancel={() => {
                setShowForm(false)
                setSelectedDomain(null)
              }}
              useMeApi
            />
          </div>
        )}

        <MonitoringList monitoring={monitoring} domainLabels={domainLabels} />
      </div>
    </div>
  )
}
