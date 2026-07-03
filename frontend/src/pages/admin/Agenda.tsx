import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import { Plus, Filter, User, Scissors, Calendar as CalendarIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Agenda: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    employeeId: '',
    serviceId: '',
    branchId: '',
    date: '',
    startTime: '',
    notes: '',
    paymentMethod: 'CASH'
  });

  const calendarRef = useRef<any>(null);

  const loadData = async () => {
    try {
      const [apptsRes, empsRes, srvsRes, custsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/employees'),
        api.get('/services'),
        api.get('/customers')
      ]);
      setAppointments(apptsRes.data.data);
      setEmployees(empsRes.data.data.filter((e: any) => e.isActive));
      setServices(srvsRes.data.data.filter((s: any) => s.isActive));
      setCustomers(custsRes.data.data);
      if (empsRes.data.data.length > 0) {
        setFormData(prev => ({ ...prev, branchId: empsRes.data.data[0].branchId }));
      }
    } catch (e: any) {
      toast.error('Error al cargar datos de la agenda');
    }
  };

  useEffect(() => { loadData(); }, []);

  const getCalendarEvents = () => {
    return appointments
      .filter(appt => {
        if (selectedEmployee && appt.employeeId !== selectedEmployee) return false;
        if (selectedService && appt.serviceId !== selectedService) return false;
        return appt.status !== 'CANCELLED';
      })
      .map(appt => {
        const dateStr = appt.date.split('T')[0];
        return {
          id: appt.id,
          title: `${appt.customer.user.name} - ${appt.service.name}`,
          start: `${dateStr}T${appt.startTime}:00`,
          end: `${dateStr}T${appt.endTime}:00`,
          backgroundColor: appt.service.color || '#3b82f6',
          borderColor: appt.service.color || '#3b82f6',
          extendedProps: { ...appt }
        };
      });
  };

  const handleEventDrop = async (info: any) => {
    const apptId = info.event.id;
    const newStart = info.event.start;
    if (!newStart) return;
    const dateStr = newStart.toISOString().split('T')[0];
    const timeStr = `${String(newStart.getHours()).padStart(2,'0')}:${String(newStart.getMinutes()).padStart(2,'0')}`;
    try {
      await api.put(`/appointments/${apptId}`, { date: dateStr, startTime: timeStr });
      toast.success('Turno reprogramado con éxito');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al reprogramar turno');
      info.revert();
    }
  };

  const handleEventResize = async (info: any) => {
    const apptId = info.event.id;
    const newStart = info.event.start;
    if (!newStart) return;
    const dateStr = newStart.toISOString().split('T')[0];
    const startTimeStr = `${String(newStart.getHours()).padStart(2,'0')}:${String(newStart.getMinutes()).padStart(2,'0')}`;
    try {
      await api.put(`/appointments/${apptId}`, { date: dateStr, startTime: startTimeStr });
      toast.success('Duración actualizada');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar duración');
      info.revert();
    }
  };

  const handleDateSelect = (info: any) => {
    const dateStr = info.startStr.split('T')[0];
    const timeStr = info.startStr.includes('T') ? info.startStr.split('T')[1].substring(0,5) : '09:00';
    setFormData({ customerId:'', employeeId: selectedEmployee||'', serviceId: selectedService||'', branchId: formData.branchId, date: dateStr, startTime: timeStr, notes:'', paymentMethod:'CASH' });
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    const appt = info.event.extendedProps;
    setSelectedEvent(appt);
    setFormData({ customerId: appt.customerId, employeeId: appt.employeeId, serviceId: appt.serviceId, branchId: appt.branchId, date: appt.date.split('T')[0], startTime: appt.startTime, notes: appt.notes||'', paymentMethod: appt.payment?.method||'CASH' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEvent) {
        await api.put(`/appointments/${selectedEvent.id}`, { employeeId: formData.employeeId, date: formData.date, startTime: formData.startTime, notes: formData.notes });
        toast.success('Turno modificado');
      } else {
        await api.post('/appointments', formData);
        toast.success('Turno agendado');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar turno');
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent || !window.confirm('¿Cancelar este turno?')) return;
    try {
      await api.post(`/appointments/${selectedEvent.id}/cancel`);
      toast.success('Turno cancelado');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border dark:border-[#222226] p-4 rounded-xl shadow-premium">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Filter size={14} className="text-muted-foreground" />
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="px-2 py-1 bg-background border border-border rounded-md outline-none text-xs">
              <option value="">Todos los Profesionales</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name} {emp.user.lastname}</option>)}
            </select>
          </div>
          <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="px-2 py-1 bg-background border border-border rounded-md outline-none text-xs font-semibold">
            <option value="">Todos los Servicios</option>
            {services.map(srv => <option key={srv.id} value={srv.id}>{srv.name}</option>)}
          </select>
        </div>
        <button onClick={() => { setSelectedEvent(null); setFormData(prev => ({...prev, customerId:'', notes:'', date: new Date().toISOString().split('T')[0], startTime:'09:00'})); setModalOpen(true); }} className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-3 py-2 rounded-md hover:opacity-90 transition-all shadow-premium w-full sm:w-auto justify-center">
          <Plus size={14} />Nuevo Turno
        </button>
      </div>

      <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          locale="es"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          events={getCalendarEvents()}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border dark:border-[#222226] w-full max-w-md rounded-xl shadow-premium-lg overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border dark:border-[#222226] flex items-center justify-between bg-muted-background/30">
              <h3 className="font-semibold text-sm">{selectedEvent ? 'Editar Turno' : 'Nuevo Turno'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><User size={12} />Cliente</label>
                {selectedEvent ? (
                  <div className="px-3 py-1.5 bg-muted-background border border-border rounded-md text-sm font-semibold">{selectedEvent.customer.user.name} {selectedEvent.customer.user.lastname}</div>
                ) : (
                  <select value={formData.customerId} onChange={e => setFormData({...formData, customerId:e.target.value})} required className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none">
                    <option value="">Selecciona un cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastname}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><User size={12} />Profesional</label>
                <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId:e.target.value})} required className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none">
                  <option value="">Selecciona un profesional</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name} {emp.user.lastname}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Scissors size={12} />Servicio</label>
                <select value={formData.serviceId} onChange={e => setFormData({...formData, serviceId:e.target.value})} required disabled={!!selectedEvent} className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none disabled:opacity-50">
                  <option value="">Selecciona un servicio</option>
                  {services.map(srv => <option key={srv.id} value={srv.id}>{srv.name} (${Number(srv.price).toFixed(2)})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><CalendarIcon size={12} />Fecha</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date:e.target.value})} required className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hora</label>
                  <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime:e.target.value})} required className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes:e.target.value})} rows={2} className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none resize-none" />
              </div>
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
                {selectedEvent ? (
                  <button type="button" onClick={handleCancelAppointment} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md text-xs font-bold transition-all">Cancelar Turno</button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 bg-card hover:bg-muted-background border border-border rounded-md text-xs font-bold transition-all">Cerrar</button>
                  <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:opacity-90 transition-all">{selectedEvent ? 'Guardar' : 'Agendar'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
