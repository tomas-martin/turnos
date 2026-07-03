import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    // Si ya está logueado, redirigir a su correspondiente home
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/cliente/historial" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#09090b] text-foreground p-6 transition-colors duration-200">
      <div className="w-full max-w-md animate-fade-in">
        {/* Encabezado Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-2xl shadow-premium mb-4">
            t
          </div>
          <h2 className="text-2xl font-bold tracking-tight">turnos SaaS</h2>
          <p className="text-sm text-muted-foreground mt-2">La forma más rápida de reservar tus turnos.</p>
        </div>

        {/* Carta Contenedora */}
        <div className="bg-white dark:bg-[#0e0e11] border border-border dark:border-[#222226] rounded-xl shadow-premium p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
