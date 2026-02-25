import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Pencil, Trash2, Key, Check, X } from 'lucide-react'
import { API } from '../utils/api'

export default function UserManagement() {
  const { fetchWithAuth } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [resetPass, setResetPass] = useState(null)
  const [form, setForm] = useState({})
  const [newPass, setNewPass] = useState('')
  const [error, setError] = useState('')

  const loadUsers = () => {
    fetchWithAuth(`${API}/admin/users`)
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [fetchWithAuth])

  const handleUpdate = async (id) => {
    setError('')
    try {
      const res = await fetchWithAuth(`${API}/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Gagal update')
      }
      setEditing(null)
      setForm({})
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleResetPassword = async (id) => {
    if (!newPass || newPass.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    setError('')
    try {
      const res = await fetchWithAuth(`${API}/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Gagal reset password')
      }
      setResetPass(null)
      setNewPass('')
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (u) => {
    setEditing(u.id)
    setForm({ nama: u.nama, role: u.role, is_active: !!u.is_active })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Daftar User</h2>
      </div>
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pasien</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4">
                  {editing === u.id ? (
                    <input
                      value={form.nama}
                      onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                      className="px-2 py-1 border rounded text-sm w-40"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{u.nama}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">{u.email}</td>
                <td className="px-6 py-4">
                  {editing === u.id ? (
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="pasien">Pasien</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm">{u.role === 'pasien' ? (u.patient_nama || `#${u.patient_id}`) : '-'}</td>
                <td className="px-6 py-4">
                  {editing === u.id ? (
                    <select
                      value={form.is_active ? '1' : '0'}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === '1' }))}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="1">Aktif</option>
                      <option value="0">Nonaktif</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editing === u.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdate(u.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Simpan"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditing(null); setForm({}); setError(''); }}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : resetPass === u.id ? (
                    <div className="flex items-center gap-2 justify-end">
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Password baru"
                        className="px-2 py-1 border rounded text-sm w-32"
                      />
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        className="px-2 py-1 bg-rose-600 text-white text-xs rounded hover:bg-rose-700"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => { setResetPass(null); setNewPass(''); setError(''); }}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setResetPass(u.id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
