import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Auth pages
import { LoginPage }  from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'

// App pages
import { DashboardPage }  from '@/pages/dashboard/DashboardPage'
import { QuotesPage }     from '@/pages/quotes/QuotesPage'
import { NewQuotePage }   from '@/pages/quotes/NewQuotePage'
import { QuoteDetailPage }from '@/pages/quotes/QuoteDetailPage'
import { ClientsPage }    from '@/pages/clients/ClientsPage'
import { SettingsPage }   from '@/pages/settings/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index                element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="quotes"        element={<QuotesPage />} />
        <Route path="quotes/new"    element={<NewQuotePage />} />
        <Route path="quotes/:id"    element={<QuoteDetailPage />} />
        <Route path="clients"       element={<ClientsPage />} />
        <Route path="settings"      element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
