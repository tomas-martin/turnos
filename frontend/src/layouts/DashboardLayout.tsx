import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCog,
  MessageSquareCode,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Bell
} from 'lucide-react';
import api from '../services/api';

export const DashboardLayout: React.FC = () => {
  const { user, company, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Aplicar dinámicamente el color corporativo de la empresa
  useEffect(() => {
    if (company?.primaryColor) {
      document.documentElement.style.setProperty('--primary', company.primaryColor);
      document.documentElement.style.setProperty('--primary-hover', company.primaryColor + 'E6'); // 90% opacidad
    } else {
      document.documentElement.style.setProperty('--primary', theme === 'dark' ? '#ffffff' : '#0f172a');
      document.documentElement.style.setProperty('--primary-hover', theme === 'dark' ? '#f4f4f5' : '#1e293b');
    }
  }, [company, theme]);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (user && user.role !== 'CUSTOMER') {
        try {
          const response = await api.get('/notifications');
          const unread = response.data.data.filter((n: any) => !n.read).length;
          setUnreadNotifications(unread);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchNotificationCount();
    // Poll cada 60 segundos
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Definir links de navegación por rol
  const getNavigationLinks = () => {
    if (!user) return [];

    if (user.role === 'ADMIN') {
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/agenda', label: 'Agenda (Calendario)', icon: Calendar },
        { path: '/admin/clientes', label: 'Clientes (CRM)', icon: Users },
        { path: '/admin/servicios', label: 'Servicios', icon: Scissors },
        { path: '/admin/empleados', label: 'Empleados', icon: UserCog },
        { path: '/admin/chat-ia', label: 'Asistente IA', icon: MessageSquareCode },
        { path: '/admin/configuracion', label: 'Configuración', icon: Settings },
      ];
    }

    if (user.role === 'EMPLOYEE') {
      return [
        { path: '/empleado/agenda', label: 'Mi Agenda', icon: Calendar },
      ];
    }

    // Cliente
    return [
      { path: '/cliente/reservar', label: 'Reservar Turno', icon: Calendar },
      { path: '/cliente/historial', label: 'Mis Turnos', icon: LayoutDashboard },
      { path: '/cliente/perfil', label: 'Mi Perfil', icon: Users },
    ];
  };

  const navLinks = getNavigationLinks();

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-250">
      
      {/* 1. Sidebar para Pantallas Grandes */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar-background border-r border-sidebar-border transform md:translate-x-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:flex md:flex-col md:h-screen`}>
        
        {/* Encabezado Sidebar (Marca/Logo) */}
        <div className="h-16 px-6 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="w-8 h-8 rounded-md object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                T
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-sm truncate max-w-[140px]">
                {company?.name || 'turnos'}
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wide font-medium uppercase">
                {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'EMPLOYEE' ? 'Profesional' : 'Cliente'}
              </span>
            </div>
          </div>
          
          {/* Botón cerrar para móvil */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-md hover:bg-muted-background">
            <X size={18} />
          </button>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-premium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted-background'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar (Usuario actual y acciones) */}
        <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar-background/50">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
              {user?.name.charAt(0)}{user?.lastname.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold truncate">{user?.name} {user?.lastname}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-sidebar-border">
            {/* Toggle Tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted-background transition-all"
              title="Cambiar Modo"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-sm font-medium"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
              <span className="hidden">Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0">
        
        {/* Barra superior (Navbar móvil y notificaciones) */}
        <header className="h-16 px-6 bg-background border-b border-border flex items-center justify-between sticky top-0 z-30">
          
          <div className="flex items-center gap-4">
            {/* Botón hamburguesa móvil */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted-background text-muted-foreground hover:text-foreground"
            >
              <Menu size={20} />
            </button>
            
            <h1 className="text-sm font-medium text-muted-foreground hidden md:block">
              {location.pathname.split('/').slice(2).join(' / ').replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notificaciones (solo para administración) */}
            {user?.role !== 'CUSTOMER' && (
              <Link to="/admin/notifications" className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted-background transition-all">
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            )}

            {/* Avatar simple clickeable */}
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Panel de Trabajo */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}
    </div>
  );
};
