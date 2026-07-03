import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Clock, ShieldAlert, Palette, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { company, updateUserSessionData } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form states
  const [companyData, setCompanyData] = useState({
    name: '',
    logoUrl: '',
    address: '',
    phone: '',
    email: '',
    primaryColor: '#0f172a'
  });

  const [configData, setConfigData] = useState({
    minDurationMinutes: 30,
    cancelPolicyDays: 1,
    cancelPolicyText: '',
    workingHours: [] as any[]
  });

  useEffect(() => {
    if (company) {
      setCompanyData({
        name: company.name,
        logoUrl: company.logoUrl || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        primaryColor: company.primaryColor
      });

      const cfg = (company as any).config;
      if (cfg) {
        setConfigData({
          minDurationMinutes: cfg.minDurationMinutes,
          cancelPolicyDays: cfg.cancelPolicyDays,
          cancelPolicyText: cfg.cancelPolicyText || '',
          workingHours: cfg.workingHours
        });
      }
    }
  }, [company]);

  const handleWorkingHourChange = (idx: number, key: string, value: any) => {
    setConfigData(prev => {
      const updated = [...prev.workingHours];
      updated[idx] = { ...updated[idx], [key]: value };
      return { ...prev, workingHours: updated };
    });
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/company', companyData);
      updateUserSessionData({ company: response.data.data });
      toast.success('Perfil de empresa actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los datos de empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/company/config', configData);
      
      // Actualizar el estado de sesión incluyendo la nueva configuración
      const updatedCompany = { ...company!, config: response.data.data };
      updateUserSessionData({ company: updatedCompany as any });
      
      toast.success('Reglas de la agenda actualizadas');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar configuración de agenda');
    } finally {
      setLoading(false);
    }
  };

  const daysLabel = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Renglón Título */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Configuración del Negocio</h2>
        <p className="text-xs text-muted-foreground">Administra el perfil corporativo, colores institucionales y reglas de reserva.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Formulario 1: Datos de Empresa */}
        <div className="bg-card border border-border dark:border-[#222226] rounded-xl shadow-premium overflow-hidden">
          <div className="p-6 border-b border-border dark:border-[#222226] flex items-center gap-2.5 bg-muted-background/25">
            <Building size={18} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Perfil de la Empresa</h3>
          </div>

          <form onSubmit={handleSaveCompany} className="p-6 space-y-4">
            
            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Nombre Comercial</label>
              <input
                type="text"
                required
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Logo URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">URL del Logo (Imágenes)</label>
              <input
                type="text"
                value={companyData.logoUrl}
                onChange={(e) => setCompanyData({ ...companyData, logoUrl: e.target.value })}
                placeholder="https://res.cloudinary.com/..."
                className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email de Contacto</label>
                <input
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Teléfono Comercial</label>
                <input
                  type="text"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Dirección Física</label>
              <input
                type="text"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
              />
            </div>

            {/* Color Principal */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Palette size={12} />
                Color de Marca (Botones y Selección)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={companyData.primaryColor}
                  onChange={(e) => setCompanyData({ ...companyData, primaryColor: e.target.value })}
                  className="h-10 w-20 bg-background border border-border rounded-md cursor-pointer"
                />
                <span className="text-xs font-semibold uppercase font-mono">{companyData.primaryColor}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary-hover transition-all"
              >
                <Save size={14} />
                Guardar Empresa
              </button>
            </div>
          </form>
        </div>

        {/* Formulario 2: Configuración de Agenda */}
        <div className="bg-card border border-border dark:border-[#222226] rounded-xl shadow-premium overflow-hidden">
          <div className="p-6 border-b border-border dark:border-[#222226] flex items-center gap-2.5 bg-muted-background/25">
            <Clock size={18} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Reglas de la Agenda y Reservas</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="p-6 space-y-6">
            
            {/* Renglón: Duración y Políticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Intervalo mínimo de turnos</label>
                <select
                  value={configData.minDurationMinutes}
                  onChange={(e) => setConfigData({ ...configData, minDurationMinutes: parseInt(e.target.value) })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <ShieldAlert size={12} className="text-red-500" />
                  Anticipación Cancelación (Días)
                </label>
                <input
                  type="number"
                  required
                  value={configData.cancelPolicyDays}
                  onChange={(e) => setConfigData({ ...configData, cancelPolicyDays: parseInt(e.target.value) })}
                  className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none"
                />
              </div>
            </div>

            {/* Texto de políticas */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Política de Cancelación (Texto descriptivo)</label>
              <textarea
                value={configData.cancelPolicyText}
                onChange={(e) => setConfigData({ ...configData, cancelPolicyText: e.target.value })}
                rows={2}
                placeholder="Las cancelaciones deben realizarse al menos 24 horas antes..."
                className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none resize-none"
              />
            </div>

            {/* Horarios Laborales por día */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase block border-b border-border/40 pb-2">Días y Horarios Laborales</span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {configData.workingHours.map((wh, idx) => (
                  <div key={wh.day} className="flex items-center justify-between gap-3 text-xs border-b border-border/40 pb-2 last:border-0">
                    <label className="flex items-center gap-2 font-medium cursor-pointer w-24">
                      <input
                        type="checkbox"
                        checked={wh.active}
                        onChange={(e) => handleWorkingHourChange(idx, 'active', e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>{daysLabel[wh.day]}</span>
                    </label>

                    {wh.active ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={wh.start}
                          onChange={(e) => handleWorkingHourChange(idx, 'start', e.target.value)}
                          className="px-2 py-0.5 bg-background border border-border rounded-md outline-none text-xs"
                        />
                        <span className="text-muted-foreground">a</span>
                        <input
                          type="time"
                          value={wh.end}
                          onChange={(e) => handleWorkingHourChange(idx, 'end', e.target.value)}
                          className="px-2 py-0.5 bg-background border border-border rounded-md outline-none text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px] pr-8">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary-hover transition-all"
              >
                <Save size={14} />
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
