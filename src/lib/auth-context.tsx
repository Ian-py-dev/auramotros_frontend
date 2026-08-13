'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Permission = {
  id: string;
  action: string;
};

type Role = {
  id: string;
  name: string;
  permissions: { permission: Permission }[];
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: { role: Role }[];
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (access_token: string, user_data: User) => void;
  logout: () => void;
  hasPermission: (permissionAction: string) => boolean;
  refreshUser: () => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  getRolesConfig: () => { [roleName: string]: string[] };
  updateRolePermissions: (roleName: string, permissions: string[]) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rolesConfig, setRolesConfig] = useState<{ [roleName: string]: string[] }>({});

  useEffect(() => {
    // Load or initialize roles permissions config
    const defaultRolesConfig = {
      'Super Admin': ['VIEW_OVERVIEW', 'VIEW_WORKSHOPS', 'VIEW_ROLES', 'VIEW_VEHICLES', 'VIEW_USERS', 'VIEW_SETTINGS', 'VIEW_SURVEYS'],
      'Administrador': ['VIEW_OVERVIEW', 'VIEW_WORKSHOPS', 'VIEW_VEHICLES', 'VIEW_USERS', 'VIEW_SETTINGS', 'VIEW_SURVEYS'],
      'Mecánico': ['VIEW_OVERVIEW', 'VIEW_VEHICLES'],
      'Cliente': ['VIEW_OVERVIEW']
    };
    
    const stored = localStorage.getItem('aura-roles-config');
    if (stored) {
      setRolesConfig(JSON.parse(stored));
    } else {
      localStorage.setItem('aura-roles-config', JSON.stringify(defaultRolesConfig));
      setRolesConfig(defaultRolesConfig);
    }
  }, []);

  useEffect(() => {
    // Initial load: Verify session
    const checkSession = async () => {
      try {
        // In a real app we'd call /auth/profile
        // Here we simulate checking if we have a valid session
        const storedToken = localStorage.getItem('siga-token');
        const storedUser = localStorage.getItem('siga-user');
        
        if (storedToken && storedUser) {
           setUser(JSON.parse(storedUser));
           setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem('siga-token');
        localStorage.removeItem('siga-user');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (access_token: string, user_data: User) => {
    const isSecureEnv = typeof window !== 'undefined' && 
                        (window.location.protocol === 'https:' || process.env.NODE_ENV === 'production');
    
    // In production, token is handled via HttpOnly Cookies by backend.
    // We just save a placeholder to know we have an active session.
    const tokenToStore = isSecureEnv ? 'session_active' : access_token;
    localStorage.setItem('siga-token', tokenToStore);
    localStorage.setItem('siga-user', JSON.stringify(user_data));
    
    setUser(user_data);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('siga-token');
    localStorage.removeItem('siga-user');
    setUser(null);
    setIsAuthenticated(false);
    // Real implementation would also call /auth/logout API to clear cookie
  };

  const hasPermission = (permissionAction: string): boolean => {
    if (!user) return false;
    
    // Find the user's role names
    const userRoleNames = user.roles.map(ur => ur.role.name);
    
    // Check if any of user's roles has this permissionAction in the config
    return userRoleNames.some(roleName => {
      if (roleName === 'Super Admin') return true;
      const perms = rolesConfig[roleName] || [];
      return perms.includes(permissionAction);
    });
  };

  const getRolesConfig = () => {
    return rolesConfig;
  };

  const updateRolePermissions = (roleName: string, permissions: string[]) => {
    const updated = { ...rolesConfig, [roleName]: permissions };
    setRolesConfig(updated);
    localStorage.setItem('aura-roles-config', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    // Call /auth/profile to get latest user data and permissions
    console.log('Refreshing user data...');
  };

  const loginWithBiometrics = async () => {
    // Implement WebAuthn logic here
    console.log('Logging in with biometrics...');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasPermission,
        refreshUser,
        loginWithBiometrics,
        getRolesConfig,
        updateRolePermissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
