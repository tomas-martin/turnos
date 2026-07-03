import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  TrendingUp,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  todayAppointmentsCount: number;
  todayAppointments: any[];
  totalRevenue: number;
  newCustomersCount: number;
  cancellationsCount: number;
  noShowsCount: number;
  topServices: any[];
  peakHours: any[];
  last7DaysTrend: any[];
}

export const Dashboard: React.FC = () => {
  const { company } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data.data);
    } catch (e: any) {
      toast.error('Error al cargar métricas del panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}`, { status: newStatus });
      toast.success(`Turno marcado como ${newStatus.toLowerCase()}`);
      fetchStats();
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar estado del turno');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true);
    try {
      const response = await api.get(`/reports/${format}`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-turnos.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte descargado con éxito');
    } catch (e: any) {
      toast.error('Error al generar el reporte');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground animate-pulse">Cargando métricas...</span>
      </div>
    );
  }

  if (!stats) return null;

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '12px'
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de Control</h2>
          <p className="text-sm text-muted-foreground">Rendimiento de {company?.name || 'tu negocio'} hoy.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['pdf', 'excel', 'csv'] as const).map(fmt => (
            <button key={fmt} onClick={() => handleExport(fmt)} disabled={exporting}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-card hover:bg-muted-background border border-border rounded-md shadow-premium transition-all uppercase">
              <Download size={14} />{fmt}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingresos Cobrados</span>
              <span className="text-2xl font-bold block">${stats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><DollarSign size={20} /></div>
          </div>
          <span className="text-[10px] text-muted-foreground mt-4 block">Cobros confirmados totales</span>
        </div>

        <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turnos Hoy</span>
              <span className="text-2xl font-bold block">{stats.todayAppointmentsCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><CalendarIcon size={20} /></div>
          </div>
          <span className="text-[10px] text-muted-foreground mt-4 block">Reservas de hoy</span>
        </div>

        <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clientes Nuevos</span>
              <span className="text-2xl font-bold block">{stats.newCustomersCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Users size={20} /></div>
          </div>
          <span className="text-[10px] text-muted-foreground mt-4 block">Este mes</span>
        </div>

        <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cancelaciones / No Show</span>
              <span className="text-2xl font-bold block">{stats.cancellationsCount} / {stats.noShowsCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><XCircle size={20} /></div>
          </div>
          <span className="text-[10px] text-muted-foreground mt-4 block">Inasistencias totales</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-sm">Tendencia de Reservas</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 días</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} />Activo
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.last7DaysTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#222226' : '#f1f5f9'} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="turnos" stroke="var(--primary)" strokeWidth={2} activeDot={{ r: 6 }} dot={{ strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
          <div className="mb-6">
            <h3 className="font-semibold text-sm">Servicios Top</h3>
            <p className="text-xs text-muted-foreground">Más solicitados</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topServices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#222226' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" fill="var(--primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agenda del Día + Horas Pico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border dark:border-[#222226] rounded-xl shadow-premium overflow-hidden">
          <div className="p-6 border-b border-border dark:border-[#222226]">
            <h3 className="font-semibold text-sm">Agenda del Día</h3>
            <p className="text-xs text-muted-foreground">Turnos programados para hoy</p>
          </div>
          <div className="overflow-x-auto">
            {stats.todayAppointments.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted-background/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3">Horario</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Servicio</th>
                    <th className="px-6 py-3">Profesional</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.todayAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-muted-background/20 transition-all">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-2"><Clock size={14} className="text-muted-foreground" />{appt.time}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{appt.customer}</td>
                      <td className="px-6 py-4">{appt.service}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{appt.employee}</td>
                      <td className="px-6 py-4 text-right">
                        {appt.status === 'PENDING' || appt.status === 'CONFIRMED' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')} className="p-1.5 rounded-md hover:bg-green-50 text-green-500 dark:hover:bg-green-950/20" title="Completar"><CheckCircle size={16} /></button>
                            <button onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 dark:hover:bg-red-950/20" title="Cancelar"><XCircle size={16} /></button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${appt.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{appt.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-sm text-muted-foreground">No hay turnos programados para hoy.</div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
          <div className="mb-6">
            <h3 className="font-semibold text-sm">Horas Pico</h3>
            <p className="text-xs text-muted-foreground">Intervalos con mayor demanda</p>
          </div>
          <div className="space-y-4">
            {stats.peakHours.length > 0 ? stats.peakHours.map((ph, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground/60 w-5">#{idx+1}</span>
                  <span className="text-sm font-semibold">{ph.time} hs</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{ph.count} turnos</span>
              </div>
            )) : (
              <div className="p-8 text-center text-xs text-muted-foreground">Sin estadísticas de horarios pico todavía.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
