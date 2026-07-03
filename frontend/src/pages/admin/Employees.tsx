import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Mail, Home, Scissors, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastname: '',
    branchId: '',
    serviceIds: [] as string[],
    isActive: true
  });

  const loadData = async () => {
    try {
      const [empsRes, brsRes, srvsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/company/branches'),
        api.get('/services')
      ]);
      setEmployees(empsRes.data.data);
      setBranches(brsRes.data.data);
      setServices(srvsRes.data.data.filter((s: any) => s.isActive));

      if (brsRes.data.data.length > 0) {
        setFormData(prev => ({ ...prev, branchId: brsRes.data.data[0].id }));
      }
    } catch (e: any) {
      toast.error('Error al cargar datos de empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedEmployee(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      lastname: '',
      branchId: branches.length > 0 ? branches[0].id : '',
      serviceIds: [],
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setSelectedEmployee(emp);
    const srvIds = emp.services.map((relation: any) => relation.serviceId);
    
    setFormData({
      email: emp.user.email,
      password: '', // vacía por seguridad en edición
      name: emp.user.name,
      lastname: emp.user.lastname,
      branchId: emp.branchId,
      serviceIds: srvIds,
      isActive: emp.isActive
    });
    setModalOpen(true);
  };

  const handleServiceCheckbox = (srvId: string) => {
    setFormData(prev => {
      const exists = prev.serviceIds.includes(srvId);
      if (exists) {
        return { ...prev, serviceIds: prev.serviceIds.filter(id => id !== srvId) };
      } else {
        return { ...prev, serviceIds: [...prev.serviceIds, srvId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEmployee) {
        // Modificar
        const { email, password, ...updateData } = formData;
        // No permitimos cambiar email y pass en este form por seguridad
        await api.put(`/employees/${selectedEmployee.id}`, updateData);
        toast.success('Perfil de profesional actualizado');
      } else {
        // Crear
        await api.post('/employees', formData);
        toast.success('Profesional registrado correctamente');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el empleado');
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este profesional? Si tiene turnos agendados, se desactivará lógicamente.')) return;
    try {
      await api.delete(`/employees/${employeeId}`);
      toast.success('Profesional desvinculado con éxito');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar profesional');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground animate-pulse">Cargando personal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Personal */}
      <div className="flex items-center justify-between bg-card border border-border dark:border-[#222226] p-4 rounded-xl shadow-premium">
        <div>
          <h3 className="font-semibold text-sm">Equipo de Profesionales</h3>
          <p className="text-xs text-muted-foreground">Administra el personal del negocio, asignaciones y sucursales.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary-hover transition-all"
        >
          <Plus size={14} />
          Nuevo Empleado
        </button>
      </div>

      {/* Grid de empleados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className={`bg-card border rounded-xl p-6 shadow-premium flex flex-col justify-between ${
              emp.isActive ? 'border-border dark:border-[#222226]' : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <div className="space-y-4">
              {/* Encabezado: Nombre e Icono */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {emp.user.name.charAt(0)}{emp.user.lastname.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">{emp.user.name} {emp.user.lastname}</h4>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Home size={10} />
                    {emp.branch.name}
                  </span>
                </div>
              </div>

              {/* Contacto: Email */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={12} />
                <span>{emp.user.email}</span>
              </div>

              {/* Listado de Servicios asignados */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Scissors size={10} />
                  Servicios Autorizados
                </span>
                <div className="flex flex-wrap gap-1">
                  {emp.services.map((relation: any) => (
                    <span
                      key={relation.service.id}
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-border bg-muted-background/40"
                    >
                      {relation.service.name}
                    </span>
                  ))}
                  {emp.services.length === 0 && (
                    <span className="text-[10px] text-muted-foreground italic">Sin servicios asignados.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones del profesional */}
            <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
              {/* Estado */}
              <div className="flex items-center gap-1.5">
                {emp.isActive ? (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Activo</span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Inactivo</span>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 rounded-md hover:bg-muted-background text-muted-foreground hover:text-foreground"
                  title="Editar Profesional"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-1.5 rounded-md hover:bg-red-50 text-red-500 dark:hover:bg-red-950/20"
                  title="Dar de baja / Eliminar"
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
                {selectedEmployee ? 'Modificar Empleado' : 'Registrar Nuevo Empleado'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Marcos"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Pérez"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  disabled={!!selectedEmployee} // bloquear cambios de email en edit
                  placeholder="empleado@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none disabled:opacity-50"
                />
              </div>

              {/* Contraseña (Solo Creación) */}
              {!selectedEmployee && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contraseña Temporal</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                  />
                </div>
              )}

              {/* Sucursal (Branch) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sucursal de Trabajo</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  required
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                >
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                </select>
              </div>

              {/* Activo / Inactivo en edición */}
              {selectedEmployee && (
                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado de Actividad</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className="text-primary transition-all"
                  >
                    {formData.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-muted-foreground" />}
                  </button>
                </div>
              )}

              {/* Listado de checkboxes de servicios */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Servicios Habilitados</label>
                <div className="max-h-28 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-muted-background/20">
                  {services.map(srv => (
                    <label key={srv.id} className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.serviceIds.includes(srv.id)}
                        onChange={() => handleServiceCheckbox(srv.id)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>{srv.name}</span>
                    </label>
                  ))}
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
