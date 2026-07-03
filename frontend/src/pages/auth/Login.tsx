import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login({
        email: data.email,
        passwordHash: data.password
      });
      toast.success('¡Sesión iniciada con éxito!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">Iniciar Sesión</h3>
        <p className="text-xs text-muted-foreground">Ingresa tus credenciales para acceder a tu panel.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Correo Electrónico</label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            {...register('email')}
            className={`w-full text-sm px-3 py-2 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
              errors.email ? 'border-red-500 focus:ring-red-500' : 'border-border'
            }`}
          />
          {errors.email && <span className="text-[10px] text-red-500">{errors.email.message}</span>}
        </div>

        {/* Contraseña */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contraseña</label>
            <Link to="#" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
              ¿La olvidaste?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className={`w-full text-sm px-3 py-2 bg-background border rounded-md outline-none focus:ring-1 focus:ring-primary ${
              errors.password ? 'border-red-500 focus:ring-red-500' : 'border-border'
            }`}
          />
          {errors.password && <span className="text-[10px] text-red-500">{errors.password.message}</span>}
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
            'Ingresar'
          )}
        </button>
      </form>

      <div className="text-center pt-2 space-y-1">
        <p className="text-xs text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-foreground hover:underline">
            Registrarme como Cliente
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">
          ¿Tienes un negocio?{' '}
          <Link to="/register-business" className="font-semibold text-foreground hover:underline">
            Registrar mi Empresa
          </Link>
        </p>
      </div>
    </div>
  );
};
