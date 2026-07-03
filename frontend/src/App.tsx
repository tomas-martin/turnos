import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { RegisterBusiness } from './pages/auth/RegisterBusiness';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { Agenda } from './pages/admin/Agenda';
import { Customers } from './pages/admin/Customers';
import { Services } from './pages/admin/Services';
import { Employees } from './pages/admin/Employees';
import { AIChat } from './pages/admin/AIChat';
import { Settings } from './pages/admin/Settings';
import { Notifications } from './pages/admin/Notifications';

// Employee Pages
import { EmployeeAgenda } from './pages/employee/Agenda';

// Customer Pages
import { BookingWizard } from './pages/customer/BookingWizard';
import { CustomerHistory } from './pages/customer/CustomerHistory';
import { CustomerProfile } from './pages/customer/CustomerProfile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* Ruta raíz → redirige según contexto */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ── Auth Routes ─────────────────────────── */}
            <Route element={<AuthLayout />}>
              <Route path="/login"             element={<Login />} />
              <Route path="/register"          element={<Register />} />
              <Route path="/register-business" element={<RegisterBusiness />} />
            </Route>

            {/* ── Admin / Employee Dashboard ───────────── */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Admin Pages */}
              <Route path="/admin/dashboard"     element={<ProtectedRoute allowedRoles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/agenda"        element={<ProtectedRoute allowedRoles={['ADMIN']}><Agenda /></ProtectedRoute>} />
              <Route path="/admin/clientes"      element={<ProtectedRoute allowedRoles={['ADMIN']}><Customers /></ProtectedRoute>} />
              <Route path="/admin/servicios"     element={<ProtectedRoute allowedRoles={['ADMIN']}><Services /></ProtectedRoute>} />
              <Route path="/admin/empleados"     element={<ProtectedRoute allowedRoles={['ADMIN']}><Employees /></ProtectedRoute>} />
              <Route path="/admin/chat-ia"       element={<ProtectedRoute allowedRoles={['ADMIN']}><AIChat /></ProtectedRoute>} />
              <Route path="/admin/configuracion" element={<ProtectedRoute allowedRoles={['ADMIN']}><Settings /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['ADMIN']}><Notifications /></ProtectedRoute>} />

              {/* Employee Pages */}
              <Route path="/empleado/agenda" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeAgenda /></ProtectedRoute>} />
            </Route>

            {/* ── Customer Layout ───────────────────────── */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/cliente/reservar"  element={<BookingWizard />} />
              <Route path="/cliente/historial" element={<CustomerHistory />} />
              <Route path="/cliente/perfil"    element={<CustomerProfile />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>

        {/* Toast Notifications Globales */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '10px',
              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)'
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'white' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'white' }
            }
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
