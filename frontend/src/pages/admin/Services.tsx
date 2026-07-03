import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Scissors, Clock, DollarSign, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Services: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    color: '#3b82f6',
    category: '',
    employeeIds: [] as string[]
  });

  const loadData = async () => {
    try {
      const [srvsRes, empsRes] = await Promise.all([
        api.get('/services?includeInactive=true'),
        api.get('/employees')
      ]);
      setServices(srvsRes.data.data);
      setEmployees(empsRes.data.data.filter((e: any) => e.isActive));
    } catch (e: any) {
      toast.error('Error al cargar datos del catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedService(null);
    setFormData({
      name: '',
      description: '',
      duration: 30,
      price: 1500,
      color: '#3b82f6',
      category: '',
      employeeIds: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: any) => {
    setSelectedService(srv);
    // Extraer relaciones de empleados
    const empIds = srv.employees.map((relation: any) => relation.employeeId);
    
    setFormData({
      name: srv.name,
      description: srv.description || '',
      duration: srv.duration,
      price: Number(srv.price),
      color: srv.color,
      category: srv.category || '',
      employeeIds: empIds
    });
    setModalOpen(true);
  };

  const handleCheckboxChange = (empId: string) => {
    setFormData(prev => {
      const exists = prev.employeeIds.includes(empId);
      if (exists) {
        return { ...prev, employeeIds: prev.employeeIds.filter(id => id !== empId) };
      } else {
        return { ...prev, employeeIds: [...prev.employeeIds, empId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedService) {
        // Modificar
        await api.put(`/services/${selectedService.id}`, formData);
        toast.success('Servicio actualizado');
      } else {
        // Crear
        await api.post('/services', formData);
        toast.success('Servicio creado e incorporado');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el servicio');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio? Si tiene turnos previos, se realizará una baja lógica (desactivación).')) return;
    try {
      await api.delete(`/services/${serviceId}`);
      toast.success('Servicio removido correctamente');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el servicio');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground animate-pulse">Cargando catálogo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Catalogo */}
      <div className="flex items-center justify-between bg-card border border-border dark:border-[#222226] p-4 rounded-xl shadow-premium">
        <div>
          <h3 className="font-semibold text-sm">Catálogo de Servicios</h3>
          <p className="text-xs text-muted-foreground">Listado de prestaciones que los clientes pueden reservar.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary-hover transition-all"
        >
          <Plus size={14} />
          Nuevo Servicio
        </button>
      </div>

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div
            key={srv.id}
            className={`bg-card border rounded-xl p-6 shadow-premium relative flex flex-col justify-between ${
              srv.isActive ? 'border-border dark:border-[#222226]' : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            {/* Color del Calendario Indicator */}
            <div
              className="absolute top-4 right-4 h-3 w-3 rounded-full shadow-premium"
              style={{ backgroundColor: srv.color }}
              title="Color de agenda"
            />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Scissors size={18} />
                <h4 className="font-bold text-base tracking-tight">{srv.name}</h4>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                {srv.description || 'Sin descripción provista.'}
              </p>

              {/* Atributos: Duración y Precio */}
              <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {srv.duration} min
                </span>
                <span className="flex items-center gap-1 text-foreground">
                  <DollarSign size={12} />
                  ${Number(srv.price).toFixed(2)}
                </span>
              </div>

              {/* Categoría */}
              {srv.category && (
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {srv.category}
                </span>
              )}
            </div>

            {/* Acciones */}
            <div className="pt-6 mt-4 border-t border-border/60 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">
                {srv.employees.length} profesionales asignados
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 rounded-md hover:bg-muted-background text-muted-foreground hover:text-foreground"
                  title="Editar Servicio"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(srv.id)}
                  className="p-1.5 rounded-md hover:bg-red-50 text-red-500 dark:hover:bg-red-950/20"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Formulario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border dark:border-[#222226] w-full max-w-md rounded-xl shadow-premium-lg overflow-hidden animate-fade-in">
            
            {/* Header Modal */}
            <div className="p-4 border-b border-border dark:border-[#222226] flex items-center justify-between bg-muted-background/30">
              <h3 className="font-semibold text-sm">
                {selectedService ? 'Modificar Servicio' : 'Crear Nuevo Servicio'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  placeholder="Corte de Pelo Degradé"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descripción (Opcional)</label>
                <textarea
                  placeholder="Detalles sobre el servicio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none resize-none"
                />
              </div>

              {/* Renglón: Duración y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duración (Minutos)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Precio ($ ARS)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
              </div>

              {/* Categoría y Color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoría</label>
                  <input
                    type="text"
                    placeholder="Cabello, Barba, Combos"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Color Calendario</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-9 bg-background border border-border rounded-md cursor-pointer"
                  />
                </div>
              </div>

              {/* Asignación de Empleados */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Asignar Profesionales</label>
                <div className="max-h-28 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-muted-background/20">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.employeeIds.includes(emp.id)}
                        onChange={() => handleCheckboxChange(emp.id)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>{emp.user.name} {emp.user.lastname}</span>
                    </label>
                  ))}
                  {employees.length === 0 && (
                    <span className="text-[10px] text-muted-foreground">No hay profesionales registrados todavía.</span>
                  )}
                </div>
              </div>

              {/* Botones Accion */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 bg-card hover:bg-muted-background border border-border rounded-md text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary-hover transition-all"
                >
                  Guardar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
