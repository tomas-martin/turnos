import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, User2, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const CustomerHistory: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (e: any) {
      toast.error('Error al cargar el historial de turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Confirmas la cancelación de este turno?')) return;
    try {
      await api.post(`/appointments/${id}/cancel`);
      toast.success('Turno cancelado con éxito');
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || 'No se puede cancelar este turno');
    }
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      PENDING:   { label: 'Pendiente',  className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: <Clock size={12} /> },
      CONFIRMED: { label: 'Confirmado', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',   icon: <CheckCircle size={12} /> },
      COMPLETED: { label: 'Completado', className: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: <CheckCircle size={12} /> },
      CANCELLED: { label: 'Cancelado',  className: 'bg-red-500/10 text-red-500',                         icon: <XCircle size={12} /> },
      NO_SHOW:   { label: 'Ausente',    className: 'bg-orange-500/10 text-orange-500',                    icon: <AlertCircle size={12} /> }
    };
    return map[status] || { label: status, className: 'bg-muted-background text-muted-foreground', icon: null };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground animate-pulse">Cargando tus turnos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      <div className="bg-card border border-border dark:border-[#222226] p-5 rounded-xl shadow-premium">
        <h2 className="font-bold text-base">Mis Turnos</h2>
        <p className="text-xs text-muted-foreground mt-1">Historial completo de tus reservas pasadas y futuras.</p>
      </div>

      <div className="space-y-4">
        {appointments.map(appt => {
          const statusCfg = getStatusConfig(appt.status);
          const isFuture = new Date(`${appt.date.split('T')[0]}T${appt.startTime}`) > new Date();
          const canCancel = isFuture && (appt.status === 'PENDING' || appt.status === 'CONFIRMED');

          return (
            <div key={appt.id} className="bg-card border border-border dark:border-[#222226] p-5 rounded-xl shadow-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div className="flex gap-4 items-start">
                {/* Indicador de color de servicio */}
                <div
                  className="h-10 w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: appt.service?.color || 'var(--primary)' }}
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{appt.service?.name}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {appt.date?.split('T')[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {appt.startTime} hs
                    </span>
                    <span className="flex items-center gap-1">
                      <User2 size={12} />
                      {appt.employee?.user?.name} {appt.employee?.user?.lastname}
                    </span>
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-muted-foreground italic">"{appt.notes}"</p>
                  )}
                </div>
              </div>

              {canCancel && (
                <button
                  onClick={() => handleCancel(appt.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-md transition-all"
                >
                  <XCircle size={14} />
                  Cancelar
                </button>
              )}
            </div>
          );
        })}

        {appointments.length === 0 && (
          <div className="bg-card border border-border dark:border-[#222226] p-16 rounded-xl text-center text-sm text-muted-foreground italic">
            Aún no tienes turnos reservados. ¡Reserva tu primer turno!
          </div>
        )}
      </div>
    </div>
  );
};
