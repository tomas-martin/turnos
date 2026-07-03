import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone: string;
  primaryColor: string;
  socialLinks?: any;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string;
  phone?: string | null;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  branch: Branch | null;
  profile: any | null; // Perfil de cliente o de empleado
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; passwordHash: string }) => Promise<void>;
  logout: () => Promise<void>;
  registerCustomer: (data: any) => Promise<void>;
  registerBusiness: (data: any) => Promise<void>;
  updateUserSessionData: (updates: { user?: User; company?: Company; branch?: Branch; profile?: any }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar estado desde LocalStorage al cargar la app
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedCompany = localStorage.getItem('company');
        const storedBranch = localStorage.getItem('branch');
        const storedProfile = localStorage.getItem('profile');
        const token = localStorage.getItem('accessToken');

        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          if (storedCompany) setCompany(JSON.parse(storedCompany));
          if (storedBranch) setBranch(JSON.parse(storedBranch));
          if (storedProfile) setProfile(JSON.parse(storedProfile));
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
        // Limpiar en caso de corrupción
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Escuchar el evento global de logout forzado por expiración de refresh token
    const handleForcedLogout = () => {
      setUser(null);
      setCompany(null);
      setBranch(null);
      setProfile(null);
    };

    window.addEventListener('auth-logout', handleForcedLogout);
    return () => {
      window.removeEventListener('auth-logout', handleForcedLogout);
    };
  }, []);

  const login = async (credentials: { email: string; passwordHash: string }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.passwordHash
      });

      const { user: userData, company: companyData, branch: branchData, profile: profileData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      if (companyData) localStorage.setItem('company', JSON.stringify(companyData));
      if (branchData) localStorage.setItem('branch', JSON.stringify(branchData));
      if (profileData) localStorage.setItem('profile', JSON.stringify(profileData));

      setUser(userData);
      setCompany(companyData || null);
      setBranch(branchData || null);
      setProfile(profileData || null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.clear();
      setUser(null);
      setCompany(null);
      setBranch(null);
      setProfile(null);
      setIsLoading(false);
    }
  };

  const registerCustomer = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const registerBusiness = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register-business', data);
      const { user: userData, company: companyData, branch: branchData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('company', JSON.stringify(companyData));
      localStorage.setItem('branch', JSON.stringify(branchData));

      setUser(userData);
      setCompany(companyData);
      setBranch(branchData);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserSessionData = (updates: { user?: User; company?: Company; branch?: Branch; profile?: any }) => {
    if (updates.user) {
      setUser(updates.user);
      localStorage.setItem('user', JSON.stringify(updates.user));
    }
    if (updates.company) {
      setCompany(updates.company);
      localStorage.setItem('company', JSON.stringify(updates.company));
    }
    if (updates.branch) {
      setBranch(updates.branch);
      localStorage.setItem('branch', JSON.stringify(updates.branch));
    }
    if (updates.profile) {
      setProfile(updates.profile);
      localStorage.setItem('profile', JSON.stringify(updates.profile));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        branch,
        profile,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        registerCustomer,
        registerBusiness,
        updateUserSessionData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
