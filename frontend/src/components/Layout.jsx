import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navItems = [
    { path: '/', label: user?.role === 'pasien' ? 'Data Saya' : 'Dashboard' },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Manajemen User' }] : []),
    ...(user?.role === 'admin' ? [{ path: '/pasien', label: 'Daftar Pasien' }] : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8 flex-1">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-slate-800">SIMOKARDI</span>
              </Link>
              <nav className="hidden md:flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-rose-50 text-rose-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.nama}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{user?.role}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
