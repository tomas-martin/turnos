import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const EmployeeAgenda: React.FC = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  const calendarRef = useRef<any>(null);

  const loadAgenda = async () => {
    if (!profile) return;
    try {
      // Filtrar citas por este empleado
      const response = await api.get(`/appointments?employeeId=${profile.id}`);
      setAppointments(response.data.data);
    } catch (e: any) {
      toast.error('Error al cargar tu agenda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgenda();
  }, [profile]);

  const getCalendarEvents = () => {
    return appointments
      .filter(appt => appt.status !== 'CANCELLED')
      .map(appt => {
        const dateStr = appt.date.split('T')[0];
        return {
          id: appt.id,
          title: `${appt.customer.user.name} - ${appt.service.name}`,
          start: `${dateStr}T${appt.startTime}:00`,
          end: `${dateStr}T${appt.endTime}:00`,
          backgroundColor: appt.service.color || '#8b5cf6',
          borderColor: appt.service.color || '#8b5cf6',
          extendedProps: { ...appt }
        };
      });
  };

  const handleEventClick = (info: any) => {
    setSelectedAppt(info.event.extendedProps);
    setModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedAppt) return;
    try {
      await api.put(`/appointments/${selectedAppt.id}`, { status: newStatus });
      toast.success(`Turno marcado como ${newStatus.toLowerCase()}`);
      setModalOpen(false);
      loadAgenda();
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar estado del turno');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground animate-pulse">Cargando tu agenda de citas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-card border border-border dark:border-[#222226] p-4 rounded-xl shadow-premium">
        <h3 className="font-semibold text-sm">Tu Agenda de Trabajo</h3>
        <p className="text-xs text-muted-foreground">Aquí puedes revisar las reservas asignadas y gestionar la atención en tiempo real.</p>
      </div>

      <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale="es"
          editable={false} // El profesional no arrastra, solo el administrador o reprograma
          selectable={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          events={getCalendarEvents()}
          eventClick={handleEventClick}
        />
      </div>

      {/* Modal Detalle / Cierre de Turno */}
      {modalOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border dark:border-[#222226] w-full max-w-sm rounded-xl shadow-premium-lg overflow-hidden animate-fade-in">
            
            <div className="p-4 border-b border-border dark:border-[#222226] flex items-center justify-between bg-muted-background/30">
              <h3 className="font-semibold text-sm">Gestionar Atención</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Cliente</span>
                  <p className="font-bold">{selectedAppt.customer.user.name} {selectedAppt.customer.user.lastname}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Servicio solicitado</span>
                  <p className="font-semibold">{selectedAppt.service.name} ({selectedAppt.service.duration} minutos)</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Horario</span>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Clock size={14} className="text-muted-foreground" />
                    {selectedAppt.date.split('T')[0]} - {selectedAppt.startTime} hs a {selectedAppt.endTime} hs
                  </p>
                </div>
                {selectedAppt.notes && (
                  <div className="bg-muted-background/40 p-2.5 rounded-lg text-xs">
                    <span className="font-semibold block mb-1">Notas del turno:</span>
                    {selectedAppt.notes}
                  </div>
                )}
              </div>

              {/* Botones de acción del profesional */}
              {(selectedAppt.status === 'PENDING' || selectedAppt.status === 'CONFIRMED') && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border/60">
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-md transition-all"
                  >
                    <CheckCircle size={14} />
                    Finalizar Atención (Marcar completado)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('NO_SHOW')}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 text-xs font-bold py-2 rounded-md transition-all"
                  >
                    <XCircle size={14} />
                    Registrar Ausente (No Show)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold py-2 rounded-md transition-all"
                  >
                    <XCircle size={14} />
                    Cancelar Turno
                  </button>
                </div>
              )}

              {selectedAppt.status === 'COMPLETED' && (
                <div className="p-3 bg-green-500/10 text-green-500 text-center rounded-lg text-xs font-bold">
                  Atención finalizada con éxito.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
