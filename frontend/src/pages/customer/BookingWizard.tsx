import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, User2, Scissors, Calendar, Clock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type Step = 'empresa' | 'servicio' | 'profesional' | 'horario' | 'confirmar';

export const BookingWizard: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('empresa');
  const [loading, setLoading] = useState(false);

  // Datos del wizard
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Cargar empresas disponibles al inicio
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/company/public');
        setCompanies(res.data.data);
      } catch (e) {
        toast.error('Error al cargar negocios disponibles');
      }
    };
    fetchCompanies();
  }, []);

  // Cargar detalles públicos de la empresa seleccionada
  useEffect(() => {
    if (!selectedCompany) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/company/public/${selectedCompany.id}`);
        setServices(res.data.data.services || []);
        setEmployees([]); // Se actualizan al elegir servicio
      } catch (e) {
        toast.error('Error al cargar detalles del negocio');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [selectedCompany]);

  // Cargar empleados que ofrecen el servicio seleccionado
  useEffect(() => {
    if (!selectedService || !selectedCompany) return;
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/company/public/${selectedCompany.id}`);
        // Filtrar empleados que tienen habilitado el servicio seleccionado
        const allEmployees = res.data.data.employees || [];
        const filtered = allEmployees.filter((emp: any) =>
          emp.services?.some((s: any) => s.serviceId === selectedService.id)
        );
        setEmployees(filtered.length > 0 ? filtered : allEmployees);
      } catch (e) {
        toast.error('Error al cargar profesionales disponibles');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [selectedService]);

  // Cargar slots disponibles al elegir profesional y fecha
  useEffect(() => {
    if (!selectedEmployee || !selectedDate) return;
    const fetchSlots = async () => {
      setLoading(true);
      setAvailableSlots([]);
      setSelectedSlot('');
      try {
        const res = await api.get('/appointments/available-slots', {
          params: {
            employeeId: selectedEmployee.id,
            date: selectedDate,
            companyId: selectedCompany?.id
          }
        });
        setAvailableSlots(res.data.data || []);
      } catch (e) {
        toast.error('Error al cargar horarios disponibles');
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedEmployee, selectedDate]);

  const handleConfirm = async () => {
    if (!selectedCompany || !selectedService || !selectedEmployee || !selectedDate || !selectedSlot) {
      toast.error('Completa todos los campos antes de confirmar');
      return;
    }

    // Obtener el branchId del empleado seleccionado
    const branchId = selectedEmployee.branchId;

    setLoading(true);
    try {
      await api.post('/appointments', {
        serviceId: selectedService.id,
        employeeId: selectedEmployee.id,
        branchId,
        date: selectedDate,
        startTime: selectedSlot,
        notes,
        paymentMethod: 'CASH'
      });
      toast.success('¡Turno reservado con éxito! Recibirás una confirmación por email.');
      navigate('/cliente/historial');
    } catch (err: any) {
      toast.error(err.message || 'Error al confirmar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const stepOrder: Step[] = ['empresa', 'servicio', 'profesional', 'horario', 'confirmar'];
  const currentIndex = stepOrder.indexOf(step);

  const goNext = () => {
    if (currentIndex < stepOrder.length - 1) setStep(stepOrder[currentIndex + 1]);
  };
  const goBack = () => {
    if (currentIndex > 0) setStep(stepOrder[currentIndex - 1]);
  };

  const stepLabels: Record<Step, string> = {
    empresa: 'Negocio',
    servicio: 'Servicio',
    profesional: 'Profesional',
    horario: 'Horario',
    confirmar: 'Confirmar'
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Barra de Progreso */}
      <div className="bg-card border border-border dark:border-[#222226] p-5 rounded-xl shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base">Reservar un Turno</h2>
          <span className="text-xs text-muted-foreground font-medium">{currentIndex + 1} de {stepOrder.length}</span>
        </div>
        <div className="flex gap-1">
          {stepOrder.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-primary' : 'bg-border'
              }`} />
              <span className={`text-[9px] font-semibold uppercase tracking-wide hidden sm:block ${
                i === currentIndex ? 'text-primary' : 'text-muted-foreground'
              }`}>{stepLabels[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenido del Paso Actual */}
      <div className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium min-h-[320px]">

        {/* Paso 1: Seleccionar Empresa */}
        {step === 'empresa' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2"><Building2 size={16} className="text-primary" />Selecciona el Negocio</h3>
              <p className="text-xs text-muted-foreground mt-1">¿A qué local quieres ir?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-1">
              {companies.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompany(c)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedCompany?.id === c.id
                      ? 'border-primary bg-primary/5 shadow-premium'
                      : 'border-border dark:border-[#222226] hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.address || 'Sin dirección'}</p>
                    </div>
                  </div>
                </button>
              ))}
              {companies.length === 0 && (
                <div className="col-span-2 py-10 text-center text-sm text-muted-foreground">
                  No hay negocios registrados todavía.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paso 2: Servicio */}
        {step === 'servicio' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2"><Scissors size={16} className="text-primary" />Selecciona el Servicio</h3>
              <p className="text-xs text-muted-foreground mt-1">¿Qué servicio necesitas en {selectedCompany?.name}?</p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {services.map(srv => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => setSelectedService(srv)}
                  className={`w-full p-4 rounded-lg border text-left flex items-center justify-between transition-all ${
                    selectedService?.id === srv.id
                      ? 'border-primary bg-primary/5 shadow-premium'
                      : 'border-border dark:border-[#222226] hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: srv.color }} />
                    <div>
                      <p className="font-bold text-sm">{srv.name}</p>
                      <p className="text-xs text-muted-foreground">{srv.duration} minutos</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">${Number(srv.price).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 3: Profesional */}
        {step === 'profesional' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2"><User2 size={16} className="text-primary" />Elige tu Profesional</h3>
              <p className="text-xs text-muted-foreground mt-1">¿Con quién quieres atenderte?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-1">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    selectedEmployee?.id === emp.id
                      ? 'border-primary bg-primary/5 shadow-premium'
                      : 'border-border dark:border-[#222226] hover:border-primary/40'
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mx-auto mb-2">
                    {emp.user?.name?.charAt(0)}{emp.user?.lastname?.charAt(0)}
                  </div>
                  <p className="font-bold text-xs">{emp.user?.name} {emp.user?.lastname}</p>
                </button>
              ))}
              {employees.length === 0 && (
                <div className="col-span-2 py-10 text-center text-sm text-muted-foreground">
                  No hay profesionales disponibles para este servicio.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paso 4: Fecha y Horario */}
        {step === 'horario' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2"><Calendar size={16} className="text-primary" />Elige Fecha y Horario</h3>
              <p className="text-xs text-muted-foreground mt-1">Selecciona cuando quieres ir.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock size={12} />
                  Horarios Disponibles
                </label>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`text-xs font-semibold py-2 rounded-md border transition-all ${
                          selectedSlot === slot
                            ? 'bg-primary text-primary-foreground border-primary shadow-premium'
                            : 'border-border dark:border-[#222226] hover:border-primary/50 hover:text-primary'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground italic">
                    No hay horarios disponibles para esta fecha. Intenta con otro día.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Paso 5: Confirmar */}
        {step === 'confirmar' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2"><CheckCircle size={16} className="text-primary" />Confirmar Reserva</h3>
              <p className="text-xs text-muted-foreground mt-1">Revisa los detalles antes de agendar.</p>
            </div>

            <div className="bg-muted-background/40 border border-border dark:border-[#222226] p-5 rounded-xl space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Negocio:</span><span className="font-bold">{selectedCompany?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Servicio:</span><span className="font-bold">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Profesional:</span><span className="font-bold">{selectedEmployee?.user?.name} {selectedEmployee?.user?.lastname}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Fecha:</span><span className="font-bold">{selectedDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Hora:</span><span className="font-bold">{selectedSlot} hs</span></div>
              <div className="border-t border-border/60 pt-3 flex justify-between">
                <span className="text-muted-foreground font-medium">Total estimado:</span>
                <span className="font-extrabold text-base">${Number(selectedService?.price).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas adicionales (Opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alergias, preferencias, indicaciones especiales..."
                rows={2}
                className="w-full text-sm px-3 py-2 bg-background border border-border rounded-md outline-none resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navegación del Wizard */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-md border border-border hover:bg-muted-background transition-all disabled:opacity-40"
        >
          <ArrowLeft size={14} />
          Atrás
        </button>

        {step !== 'confirmar' ? (
          <button
            type="button"
            onClick={goNext}
            disabled={
              (step === 'empresa' && !selectedCompany) ||
              (step === 'servicio' && !selectedService) ||
              (step === 'profesional' && !selectedEmployee) ||
              (step === 'horario' && (!selectedDate || !selectedSlot))
            }
            className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-5 py-2 rounded-md hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Siguiente
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-5 py-2 rounded-md hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <CheckCircle size={14} />
                Confirmar Turno
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};
