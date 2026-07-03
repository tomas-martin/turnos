import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const registerBusinessSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastname: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  companyName: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
  phone: z.string().min(6, 'Teléfono de contacto inválido').optional().or(z.literal('')),
  address: z.string().optional()
});

type RegisterBusinessForm = z.infer<typeof registerBusinessSchema>;

export const RegisterBusiness: React.FC = () => {
  const { registerBusiness } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterBusinessForm>({
    resolver: zodResolver(registerBusinessSchema)
  });

  const onSubmit = async (data: RegisterBusinessForm) => {
    setLoading(true);
    try {
      await registerBusiness(data);
      toast.success('¡Empresa y cuenta de administrador creadas con éxito!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta corporativa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">Registrar Empresa SaaS</h3>
        <p className="text-xs text-muted-foreground">Inicia tu período gratuito y configura tu agenda.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre de la Empresa */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre del Negocio / Empresa</label>
          <input
            type="text"
            placeholder="Mi Barbería o Centro Estético"
            {...register('companyName')}
            className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
              errors.companyName ? 'border-red-500 font-medium' : 'border-border'
            }`}
          />
          {errors.companyName && <span className="text-[10px] text-red-500">{errors.companyName.message}</span>}
        </div>

        <div className="border-t border-border/60 my-2 pt-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Datos del Administrador</span>
        </div>

        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</label>
            <input
              type="text"
              placeholder="Tomás"
              {...register('name')}
              className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
                errors.name ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.name && <span className="text-[10px] text-red-500">{errors.name.message}</span>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Apellido</label>
            <input
              type="text"
              placeholder="Gómez"
              {...register('lastname')}
              className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
                errors.lastname ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.lastname && <span className="text-[10px] text-red-500">{errors.lastname.message}</span>}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email corporativo</label>
          <input
            type="email"
            placeholder="admin@minegocio.com"
            {...register('email')}
            className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
              errors.email ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.email && <span className="text-[10px] text-red-500">{errors.email.message}</span>}
        </div>

        {/* Contraseña */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
              errors.password ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.password && <span className="text-[10px] text-red-500">{errors.password.message}</span>}
        </div>

        {/* Teléfono y Dirección */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Teléfono</label>
            <input
              type="text"
              placeholder="+54 11..."
              {...register('phone')}
              className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dirección</label>
            <input
              type="text"
              placeholder="Palermo, CABA"
              {...register('address')}
              className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold py-2 rounded-md hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            'Comenzar Ahora'
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          ¿Ya tienes cuenta corporativa?{' '}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
