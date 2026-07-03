import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Mail, Phone, Calendar, DollarSign, Eye, X, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any | null>(null);

  // Form de creación manual
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    lastname: '',
    dni: '',
    phone: '',
    address: '',
    observations: ''
  });

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.data);
    } catch (e: any) {
      toast.error('Error al cargar la base de datos de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      email: '',
      name: '',
      lastname: '',
      dni: '',
      phone: '',
      address: '',
      observations: ''
    });
    setCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      toast.success('Cliente registrado con éxito en el CRM');
      setCreateModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el cliente');
    }
  };

  const handleViewDetail = async (customerId: string) => {
    try {
      const response = await api.get(`/customers/${customerId}`);
      setSelectedCustomerDetail(response.data.data);
      setDetailModalOpen(true);
    } catch (e: any) {
      toast.error('Error al recuperar detalles e historial del cliente');
    }
  };

  // Filtrado de clientes reactivo por nombre, apellido, email o DNI
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.lastname.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.dni && c.dni.includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground animate-pulse">Cargando CRM de clientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header con Buscador y Registro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border dark:border-[#222226] p-4 rounded-xl shadow-premium">
        
        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary-hover transition-all w-full sm:w-auto justify-center"
        >
          <Plus size={14} />
          Registrar Cliente
        </button>
      </div>

      {/* 2. Grid de tarjetas de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((cust) => (
          <div key={cust.id} className="bg-card border border-border dark:border-[#222226] p-6 rounded-xl shadow-premium flex flex-col justify-between">
            <div className="space-y-3">
              
              {/* Avatar e Info Principal */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {cust.name.charAt(0)}{cust.lastname.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">{cust.name} {cust.lastname}</h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">DNI: {cust.dni || 'Sin registrar'}</span>
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail size={12} />
                  <span className="truncate">{cust.email}</span>
                </div>
                {cust.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} />
                    <span>{cust.phone}</span>
                  </div>
                )}
              </div>

              {/* Indicadores: turnos e ingresos */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                <div className="bg-muted-background/30 p-2 rounded-lg text-center">
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block">Turnos Reservados</span>
                  <span className="text-sm font-bold block">{cust.totalAppointments}</span>
                </div>
                <div className="bg-muted-background/30 p-2 rounded-lg text-center">
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block">Monto Gastado</span>
                  <span className="text-sm font-bold block">${Number(cust.amountSpent).toFixed(2)}</span>
                </div>
              </div>

              {/* Próximo turno */}
              {cust.nextAppointment ? (
                <div className="bg-green-500/5 border border-green-500/10 p-2.5 rounded-lg text-xs flex items-start gap-2">
                  <Calendar size={14} className="text-green-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-green-700 dark:text-green-400 block">Próxima Cita</span>
                    <span className="text-muted-foreground">{cust.nextAppointment.date.split('T')[0]} a las {cust.nextAppointment.startTime} hs</span>
                  </div>
                </div>
              ) : (
                <div className="bg-muted-background/20 p-2.5 rounded-lg text-xs text-muted-foreground italic text-center">
                  Sin citas futuras programadas
                </div>
              )}
            </div>

            {/* Botón Ver Historial */}
            <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-end">
              <button
                onClick={() => handleViewDetail(cust.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Eye size={14} />
                Ver Historial e Info
              </button>
            </div>

          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">
            No se encontraron clientes registrados que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {/* Modal 1: Registrar Cliente Manual */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border dark:border-[#222226] w-full max-w-md rounded-xl shadow-premium-lg overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border dark:border-[#222226] flex items-center justify-between bg-muted-background/30">
              <h3 className="font-semibold text-sm">Registrar Cliente Manual</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Apellido</label>
                  <input
                    type="text"
                    required
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">DNI</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Observaciones / Alergias</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={2}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-card hover:bg-muted-background border border-border rounded-md text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary-hover transition-all"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Detalle e Historial de Citas del Cliente */}
      {detailModalOpen && selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border dark:border-[#222226] w-full max-w-2xl rounded-xl shadow-premium-lg overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border dark:border-[#222226] flex items-center justify-between bg-muted-background/30">
              <h3 className="font-semibold text-sm">Historial e Información de Cliente</h3>
              <button onClick={() => setDetailModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Datos de Perfil detallados */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Información Personal</h4>
                  <p className="font-semibold text-base mt-1">{selectedCustomerDetail.name} {selectedCustomerDetail.lastname}</p>
                  <p className="text-xs text-muted-foreground">DNI: {selectedCustomerDetail.dni || 'No registrado'}</p>
                  <p className="text-xs text-muted-foreground">Dirección: {selectedCustomerDetail.address || 'No registrado'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Resumen Comercial</h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <BookOpen size={12} />
                    Cantidad de Turnos: <strong>{selectedCustomerDetail.totalAppointments}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <DollarSign size={12} />
                    Monto Total Facturado: <strong>${Number(selectedCustomerDetail.amountSpent).toFixed(2)}</strong>
                  </p>
                </div>
                {selectedCustomerDetail.observations && (
                  <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-800 dark:text-yellow-400">
                    <span className="font-bold uppercase tracking-wide block mb-1">Notas y Preferencias:</span>
                    {selectedCustomerDetail.observations}
                  </div>
                )}
              </div>

              {/* Tabla de Historial de Citas */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Historial de Turnos</h4>
                <div className="border border-border dark:border-[#222226] rounded-lg overflow-hidden">
                  {selectedCustomerDetail.appointments.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted-background/40 border-b border-border text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2">Fecha</th>
                          <th className="px-4 py-2">Horario</th>
                          <th className="px-4 py-2">Servicio</th>
                          <th className="px-4 py-2">Profesional</th>
                          <th className="px-4 py-2">Estado</th>
                          <th className="px-4 py-2">Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedCustomerDetail.appointments.map((appt: any) => (
                          <tr key={appt.id} className="hover:bg-muted-background/10">
                            <td className="px-4 py-2.5">{appt.date.split('T')[0]}</td>
                            <td className="px-4 py-2.5">{appt.startTime} hs</td>
                            <td className="px-4 py-2.5 font-semibold">{appt.service}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{appt.employee}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                appt.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : appt.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[9px] font-semibold ${
                                appt.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {appt.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs italic">
                      Este cliente no posee turnos agendados en esta empresa.
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-border dark:border-[#222226] flex justify-end bg-muted-background/10">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-3 py-1.5 bg-card hover:bg-muted-background border border-border rounded-md text-xs font-bold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
