import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data);
    } catch (e: any) {
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      toast.success('Notificación marcada como leída');
      loadNotifications();
    } catch (e: any) {
      toast.error('Error al actualizar notificación');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('Todas las notificaciones leídas');
      loadNotifications();
    } catch (e: any) {
      toast.error('Error al actualizar notificaciones');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground animate-pulse">Cargando alertas...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header Alertas */}
      <div className="flex items-center justify-between bg-card border border-border dark:border-[#222226] p-4 rounded-xl shadow-premium">
        <div>
          <h3 className="font-semibold text-sm">Centro de Notificaciones</h3>
          <p className="text-xs text-muted-foreground">Alertas en tiempo real sobre nuevas reservas y cancelaciones.</p>
        </div>
        
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <CheckCheck size={14} />
            Marcar todo leído
          </button>
        )}
      </div>

      {/* Listado */}
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 shadow-premium ${
              notif.read
                ? 'bg-card border-border dark:border-[#222226] opacity-75'
                : 'bg-primary/5 border-primary/20 dark:border-primary/30 relative'
            }`}
          >
            {/* Punto indicador no leído */}
            {!notif.read && (
              <span className="absolute top-4 left-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}

            <div className="flex gap-3 pl-2">
              <div className={`p-2 rounded-lg ${
                notif.read ? 'bg-muted-background text-muted-foreground' : 'bg-primary/10 text-primary'
              }`}>
                <Bell size={16} />
              </div>
              
              <div className="space-y-1">
                <h4 className="font-bold text-xs leading-none">{notif.title}</h4>
                <p className="text-xs text-muted-foreground leading-normal">{notif.message}</p>
                <span className="text-[9px] text-muted-foreground font-semibold block pt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(notif.createdAt).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Acciones */}
            {!notif.read && (
              <button
                onClick={() => handleMarkAsRead(notif.id)}
                className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all flex-shrink-0"
                title="Marcar como leída"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="bg-card border border-border dark:border-[#222226] p-12 rounded-xl text-center text-sm text-muted-foreground italic">
            No tienes alertas en tu bandeja de entrada.
          </div>
        )}
      </div>

    </div>
  );
};
