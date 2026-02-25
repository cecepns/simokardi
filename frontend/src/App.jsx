import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PasienDashboard from './pages/PasienDashboard'
import AdminDashboard from './pages/AdminDashboard'
import PasienList from './pages/PasienList'
import PasienForm from './pages/PasienForm'
import PasienDetail from './pages/PasienDetail'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              {user?.role === 'pasien' ? <PasienDashboard /> : <Dashboard />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pasien"
        element={
          <ProtectedRoute>
            <Layout>
              <PasienList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pasien/tambah"
        element={
          <ProtectedRoute>
            <Layout>
              <PasienForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pasien/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <PasienForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pasien/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <PasienDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
