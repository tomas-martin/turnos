import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastname: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  dni: z.string().min(6, 'DNI inválido').optional().or(z.literal('')),
  phone: z.string().min(6, 'Teléfono inválido').optional().or(z.literal('')),
  address: z.string().optional()
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerCustomer(data);
      toast.success('¡Registro completado con éxito!');
      navigate('/cliente/historial');
    } catch (error: any) {
      toast.error(error.message || 'Error al completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">Registro de Cliente</h3>
        <p className="text-xs text-muted-foreground">Completa tus datos para reservar turnos.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</label>
            <input
              type="text"
              placeholder="Juan"
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
              placeholder="Pérez"
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
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
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

        {/* DNI y Teléfono */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">DNI</label>
            <input
              type="text"
              placeholder="38123456"
              {...register('dni')}
              className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
                errors.dni ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.dni && <span className="text-[10px] text-red-500">{errors.dni.message}</span>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Teléfono</label>
            <input
              type="text"
              placeholder="+54 11 5555"
              {...register('phone')}
              className={`w-full text-sm px-3 py-1.5 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
                errors.phone ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.phone && <span className="text-[10px] text-red-500">{errors.phone.message}</span>}
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dirección (Opcional)</label>
          <input
            type="text"
            placeholder="Palermo, Buenos Aires"
            {...register('address')}
            className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
          />
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
            'Registrarse'
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
