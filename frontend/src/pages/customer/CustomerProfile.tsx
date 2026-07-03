import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { User, Mail, Phone, MapPin, Lock, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Nombre demasiado corto'),
  lastname: z.string().min(2, 'Apellido demasiado corto'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export const CustomerProfile: React.FC = () => {
  const { user, profile, updateUserSessionData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: errProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      lastname: user?.lastname || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    }
  });

  const { register: regPw, handleSubmit: submitPw, reset: resetPw, formState: { errors: errPw } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  });

  const onSaveProfile = async (data: ProfileForm) => {
    setLoading(true);
    try {
      await api.put('/customers/me', data);
      updateUserSessionData({
        user: { ...user!, name: data.name, lastname: data.lastname }
      });
      toast.success('Perfil actualizado con éxito');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Contraseña actualizada con éxito');
      resetPw();
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar la contraseña');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">

      <div className="bg-card border border-border dark:border-[#222226] p-5 rounded-xl shadow-premium flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl flex-shrink-0">
          {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
        </div>
        <div>
          <h2 className="font-bold text-base">{user?.name} {user?.lastname}</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Formulario de Perfil */}
      <div className="bg-card border border-border dark:border-[#222226] rounded-xl shadow-premium overflow-hidden">
        <div className="p-5 border-b border-border dark:border-[#222226] flex items-center gap-2 bg-muted-background/25">
          <User size={16} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm">Datos Personales</h3>
        </div>

        <form onSubmit={submitProfile(onSaveProfile)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                {...regProfile('name')}
                className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${errProfile.name ? 'border-red-500' : 'border-border'}`}
              />
              {errProfile.name && <span className="text-[10px] text-red-500">{errProfile.name.message}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Apellido</label>
              <input
                type="text"
                {...regProfile('lastname')}
                className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${errProfile.lastname ? 'border-red-500' : 'border-border'}`}
              />
              {errProfile.lastname && <span className="text-[10px] text-red-500">{errProfile.lastname.message}</span>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Mail size={11} />Email (no editable)</label>
            <input
              type="email"
              defaultValue={user?.email}
              disabled
              className="w-full text-sm px-3 py-1.5 bg-muted-background border border-border rounded-md outline-none opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Phone size={11} />Teléfono</label>
              <input
                type="text"
                {...regProfile('phone')}
                placeholder="+54 11..."
                className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><MapPin size={11} />Dirección</label>
              <input
                type="text"
                {...regProfile('address')}
                placeholder="Av. Corrientes..."
                className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              <Save size={14} />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Formulario de Contraseña */}
      <div className="bg-card border border-border dark:border-[#222226] rounded-xl shadow-premium overflow-hidden">
        <div className="p-5 border-b border-border dark:border-[#222226] flex items-center gap-2 bg-muted-background/25">
          <Lock size={16} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm">Cambiar Contraseña</h3>
        </div>

        <form onSubmit={submitPw(onChangePassword)} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contraseña Actual</label>
            <input
              type="password"
              {...regPw('currentPassword')}
              placeholder="••••••••"
              className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${errPw.currentPassword ? 'border-red-500' : 'border-border'}`}
            />
            {errPw.currentPassword && <span className="text-[10px] text-red-500">{errPw.currentPassword.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nueva Contraseña</label>
              <input
                type="password"
                {...regPw('newPassword')}
                placeholder="••••••••"
                className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${errPw.newPassword ? 'border-red-500' : 'border-border'}`}
              />
              {errPw.newPassword && <span className="text-[10px] text-red-500">{errPw.newPassword.message}</span>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confirmar Nueva</label>
              <input
                type="password"
                {...regPw('confirmPassword')}
                placeholder="••••••••"
                className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${errPw.confirmPassword ? 'border-red-500' : 'border-border'}`}
              />
              {errPw.confirmPassword && <span className="text-[10px] text-red-500">{errPw.confirmPassword.message}</span>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwLoading}
              className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              <Lock size={14} />
              {pwLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
