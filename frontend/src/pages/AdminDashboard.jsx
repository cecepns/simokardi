import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import UserManagement from '../components/UserManagement'
import { Link } from 'react-router-dom'
import { API } from '../utils/api'

export default function AdminDashboard() {
  const { fetchWithAuth } = useAuth()
  const [data, setData] = useState({ total_pasien: 0, total_users: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      fetchWithAuth(`${API}/dashboard`).then((r) => r.json()),
      fetchWithAuth(`${API}/admin/users`).then((r) => r.json()),
    ])
      .then(([dashboard, users]) => {
        setData({ total_pasien: dashboard.total_pasien, total_users: users.length })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [fetchWithAuth])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Admin</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'overview' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'users' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Manajemen User
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500">Total Pasien</p>
            <p className="text-3xl font-bold text-rose-600 mt-1">{data.total_pasien}</p>
            <Link to="/pasien" className="inline-block mt-3 text-sm font-medium text-rose-600 hover:text-rose-700">
              Lihat daftar pasien →
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500">Total User</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{data.total_users}</p>
            <button
              onClick={() => setActiveTab('users')}
              className="inline-block mt-3 text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              Kelola user →
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500">Role</p>
            <p className="text-lg text-slate-700 mt-1">Admin & User</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && <UserManagement />}
    </div>
  )
}
