'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  CarFront,
  Users2,
  ClipboardCheck,
  CalendarRange,
  SlidersHorizontal,
  Sun,
  Moon,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronLeft,
  UserCheck,
  Clock,
  Car,
  ExternalLink,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Lock
} from 'lucide-react';
import { safeFetch } from '../../lib/api-config';

interface AccessRequestNotificationItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePlates?: string;
  status: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout, hasPermission, updateUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isNotifPopoverOpen, setIsNotifPopoverOpen] = useState(false);
  const [accessRequests, setAccessRequests] = useState<AccessRequestNotificationItem[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalMsg, setApprovalMsg] = useState<string | null>(null);

  // Mandatory Password Change states (for first-time/temporary login)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  const handleMandatoryPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);

    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 6) {
      setPasswordChangeError('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (trimmed !== confirmPassword.trim()) {
      setPasswordChangeError('Las contraseñas no coinciden. Por favor revisa que ambas sean idénticas.');
      return;
    }

    setPasswordChangeLoading(true);
    const { ok, error } = await safeFetch('/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: trimmed }),
    });
    setPasswordChangeLoading(false);

    if (ok) {
      setPasswordChangeSuccess('¡Contraseña actualizada correctamente! Ingresando a tu panel...');
      setTimeout(() => {
        updateUser({ mustChangePassword: false });
        setPasswordChangeSuccess(null);
        setNewPassword('');
        setConfirmPassword('');
      }, 1000);
    } else {
      setPasswordChangeError(error || 'Ocurrió un error al actualizar la contraseña. Por favor intenta de nuevo.');
    }
  };

  const isClient = user?.roles?.some(r => r.role?.name === 'Cliente') ?? false;

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('aura-theme') as 'light' | 'dark';
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('aura-theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Strict route protection for Cliente role: can ONLY access their vehicles and bookings
  useEffect(() => {
    if (mounted && !isLoading && isAuthenticated && isClient) {
      const allowedPaths = ['/dashboard/vehicles', '/dashboard/bookings'];
      const isAllowed = allowedPaths.some(p => pathname.startsWith(p));
      if (!isAllowed) {
        router.replace('/dashboard/vehicles');
      }
    }
  }, [mounted, isLoading, isAuthenticated, isClient, pathname, router]);

  // Polling access requests for administrators
  const fetchAccessRequests = useCallback(async () => {
    if (isClient) return;
    const { ok, data } = await safeFetch<AccessRequestNotificationItem[]>('/users/access-requests');
    if (ok && Array.isArray(data)) {
      setAccessRequests(data);
    }
  }, [isClient]);

  useEffect(() => {
    if (mounted && isAuthenticated && !isClient) {
      fetchAccessRequests();
      const interval = setInterval(fetchAccessRequests, 12000);
      return () => clearInterval(interval);
    }
  }, [mounted, isAuthenticated, isClient, fetchAccessRequests]);

  const handleQuickApprove = async (reqId: string, name: string) => {
    setApprovingId(reqId);
    try {
      const { ok, data, error } = await safeFetch<{ message: string }>(`/users/access-requests/${reqId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginUrl: `${window.location.origin}/login` })
      });
      if (ok && data) {
        setApprovalMsg(`¡Accesos enviados a ${name}!`);
        setTimeout(() => setApprovalMsg(null), 4000);
        fetchAccessRequests();
      } else {
        alert(error || 'Error al aprobar solicitud');
      }
    } finally {
      setApprovingId(null);
    }
  };

  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2.5px solid #0ea5e9', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navItems = [
    {
      label: 'Visión General',
      path: '/dashboard',
      permission: 'VIEW_OVERVIEW',
      icon: LayoutDashboard,
      color: '#0284c7',
      badgeBg: 'rgba(2, 132, 199, 0.14)',
      glow: 'rgba(2, 132, 199, 0.35)'
    },
    {
      label: 'Talleres',
      path: '/dashboard/workshops',
      permission: 'VIEW_WORKSHOPS',
      icon: Wrench,
      color: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.14)',
      glow: 'rgba(16, 185, 129, 0.35)'
    },
    {
      label: 'Roles y Permisos',
      path: '/dashboard/roles',
      permission: 'VIEW_ROLES',
      icon: ShieldCheck,
      color: '#8b5cf6',
      badgeBg: 'rgba(139, 92, 246, 0.14)',
      glow: 'rgba(139, 92, 246, 0.35)'
    },
    {
      label: isClient ? 'Mis Vehículos' : 'Vehículos',
      path: '/dashboard/vehicles',
      permission: 'VIEW_VEHICLES',
      icon: CarFront,
      color: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.14)',
      glow: 'rgba(245, 158, 11, 0.35)'
    },
    {
      label: 'Usuarios',
      path: '/dashboard/users',
      permission: 'VIEW_USERS',
      icon: Users2,
      color: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.14)',
      glow: 'rgba(56, 189, 248, 0.35)'
    },
    {
      label: 'Encuestas CSAT',
      path: '/dashboard/surveys',
      permission: 'VIEW_SURVEYS',
      icon: ClipboardCheck,
      color: '#ec4899',
      badgeBg: 'rgba(236, 72, 153, 0.14)',
      glow: 'rgba(236, 72, 153, 0.35)'
    },
    {
      label: isClient ? 'Mis Citas / Servicios' : 'Solicitudes A Domicilio',
      path: '/dashboard/bookings',
      permission: 'VIEW_TICKETS',
      icon: CalendarRange,
      color: '#0284c7',
      badgeBg: 'rgba(2, 132, 199, 0.14)',
      glow: 'rgba(2, 132, 199, 0.35)'
    },
    {
      label: 'Configuración',
      path: '/dashboard/settings',
      permission: 'VIEW_SETTINGS',
      icon: SlidersHorizontal,
      color: '#64748b',
      badgeBg: 'rgba(100, 116, 139, 0.14)',
      glow: 'rgba(100, 116, 139, 0.35)'
    },
  ];

  // Strictly filter items for Cliente to only their 2 permitted modules
  const allowedNavItems = navItems.filter(item => {
    if (isClient) {
      return item.path === '/dashboard/vehicles' || item.path === '/dashboard/bookings';
    }
    return hasPermission(item.permission);
  });

  const pendingRequests = accessRequests.filter(r => r.status === 'PENDING');
  const currentNavItem = navItems.find(item => item.path === pathname);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      overflow: 'hidden',
      color: 'var(--text-primary)',
      transition: 'background-color 0.3s'
    }}>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 90, backdropFilter: 'blur(6px)'
          }}
        />
      )}

      {/* Floating Responsive Sidebar Drawer ("Isla Nav") */}
      <aside 
        className={`sidebar-drawer ${isDesktopCollapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: '16px',
          bottom: '16px',
          left: isSidebarOpen ? '12px' : '-320px',
          width: isDesktopCollapsed ? '88px' : '280px',
          maxWidth: 'calc(100vw - 24px)',
          borderRadius: '28px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: theme === 'dark' ? '0 20px 50px rgba(0, 0, 0, 0.5)' : '0 10px 30px rgba(15, 23, 42, 0.08)',
          border: '1px solid var(--glass-border)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo & Mobile Close Button Area */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', display: 'flex', alignItems: 'center', justifyContent: isDesktopCollapsed ? 'center' : 'space-between', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.75rem' }}>
          
          {/* ORIGINAL CODE-RENDERED AURA LOGO (DOUBLE CIRCLE + CLEAN AURA TEXT) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '50%',
              border: '2.5px solid #0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(14, 165, 233, 0.35)'
            }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2.5px solid #0ea5e9' }} />
            </div>
            <span className="sidebar-brand-text" style={{ fontSize: '1.35rem', fontWeight: 300, letterSpacing: '4px', color: 'var(--text-primary)', whiteSpace: 'nowrap', display: isDesktopCollapsed ? 'none' : 'inline-block' }}>
              AURA
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="desktop-collapse-btn"
              style={{ 
                background: 'rgba(0,0,0,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
                cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <ChevronLeft size={16} style={{ transform: isDesktopCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="mobile-close-btn"
              style={{
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Items with Glowing Duotone Icon Badges + Always Visible Labels on Mobile */}
        <nav style={{ flex: 1, padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.path;
            const IconComponent = item.icon;
            return (
              <Link key={item.path} href={item.path} onClick={() => setIsSidebarOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.85rem',
                justifyContent: isDesktopCollapsed ? 'center' : 'flex-start',
                borderRadius: '16px', textDecoration: 'none', position: 'relative', zIndex: 1,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? (theme === 'dark' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)') : 'transparent',
                border: isActive ? `1px solid ${item.color}` : '1px solid transparent',
                boxShadow: isActive ? `0 4px 18px ${item.glow}` : 'none',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
              }}>
                {/* Glowing Duotone Icon Badge */}
                <div style={{
                  width: '34px',
                  height: '34px',
                  minWidth: '34px',
                  borderRadius: '10px',
                  background: isActive ? item.color : item.badgeBg,
                  color: isActive ? '#ffffff' : item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive ? `0 0 14px ${item.glow}` : 'none',
                  transition: 'all 0.25s ease'
                }}>
                  <IconComponent size={18} />
                </div>
                
                {/* Label text span - Always shown on mobile drawer */}
                <span className="sidebar-nav-label" style={{ whiteSpace: 'nowrap', display: isDesktopCollapsed ? 'none' : 'inline-block' }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Actions */}
        <div style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
          
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem',
              justifyContent: isDesktopCollapsed ? 'center' : 'flex-start',
              borderRadius: '14px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.03)',
              color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
              overflow: 'hidden'
            }}
          >
            <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.14)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <span className="sidebar-action-text" style={{ whiteSpace: 'nowrap', display: isDesktopCollapsed ? 'none' : 'inline-block' }}>
              Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </span>
          </button>

          {/* User Avatar Badge */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', 
            justifyContent: isDesktopCollapsed ? 'center' : 'space-between',
            borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)',
            overflow: 'hidden'
          }}>
            <div className="sidebar-user-info" style={{ display: isDesktopCollapsed ? 'none' : 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</span>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase' }}>
                {user?.roles?.[0]?.role?.name || 'Usuario'}
              </span>
            </div>
            
            <div style={{
              width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontWeight: 800, fontSize: '13px',
              boxShadow: '0 2px 10px rgba(56, 189, 248, 0.3)'
            }}>
              {user?.firstName?.charAt(0) || 'U'}
            </div>
          </div>

          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem',
            justifyContent: isDesktopCollapsed ? 'center' : 'flex-start',
            borderRadius: '14px', border: 'none', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
            cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', overflow: 'hidden'
          }}>
            <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={18} />
            </div>
            <span className="sidebar-action-text" style={{ whiteSpace: 'nowrap', display: isDesktopCollapsed ? 'none' : 'inline-block' }}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '0',
        minHeight: '100vh',
        width: '100%',
        transition: 'margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }} className="main-content-desktop">
        
        {/* CSS for Mobile & Desktop Responsive Layout */}
        <style>{`
          @media (min-width: 1024px) {
            .sidebar-drawer { left: 20px !important; }
            .main-content-desktop { margin-left: ${isDesktopCollapsed ? '108px' : '300px'} !important; padding-right: 20px; }
            .mobile-menu-btn { display: none !important; }
            .mobile-close-btn { display: none !important; }
            .desktop-collapse-btn { display: flex !important; }
          }
          @media (max-width: 1023px) {
            .desktop-collapse-btn { display: none !important; }
            .mobile-close-btn { display: flex !important; }
            .sidebar-drawer { width: 280px !important; }
            .sidebar-nav-label { display: inline-block !important; }
            .sidebar-brand-text { display: inline-block !important; }
            .sidebar-action-text { display: inline-block !important; }
            .sidebar-user-info { display: flex !important; }
          }
        `}</style>

        {/* Topbar Header */}
        <header style={{
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {currentNavItem?.label || 'Aura'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsNotifPopoverOpen(!isNotifPopoverOpen)}
                style={{ 
                  background: 'rgba(0,0,0,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer',
                  borderRadius: '12px', padding: '0.6rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Bell size={20} />
                {!isClient && pendingRequests.length > 0 ? (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px',
                    padding: '0 4px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '9999px',
                    fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                  }}>
                    {pendingRequests.length}
                  </span>
                ) : null}
              </button>

              {/* Notification Popover */}
              {isNotifPopoverOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '380px', maxWidth: '92vw',
                  backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
                  borderRadius: '20px', boxShadow: '0 15px 50px rgba(0,0,0,0.25)', zIndex: 120,
                  overflow: 'hidden', padding: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bell size={16} style={{ color: '#0284c7' }} />
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {isClient ? 'Mis Notificaciones' : 'Solicitudes de Acceso'}
                      </h3>
                    </div>
                    {!isClient && pendingRequests.length > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '9999px' }}>
                        {pendingRequests.length} nuevas
                      </span>
                    )}
                  </div>

                  {approvalMsg && (
                    <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} />
                      <span>{approvalMsg}</span>
                    </div>
                  )}

                  {!isClient ? (
                    pendingRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <Clock size={28} style={{ margin: '0 auto 8px', color: '#94a3b8', opacity: 0.6 }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>No hay solicitudes de acceso pendientes.</p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.8 }}>Todas las solicitudes han sido procesadas.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                        {pendingRequests.map(req => (
                          <div key={req.id} style={{
                            padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{req.firstName} {req.lastName}</span>
                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>{req.email}</p>
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', padding: '2px 6px', borderRadius: '6px' }}>
                                {req.role || 'Cliente'}
                              </span>
                            </div>

                            {req.vehicleBrand && (
                              <div style={{ fontSize: '11px', color: 'var(--text-primary)', background: 'rgba(2, 132, 199, 0.08)', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Car size={13} style={{ color: '#0284c7' }} />
                                <span><b>{req.vehicleBrand} {req.vehicleModel} {req.vehicleYear || ''}</b> {req.vehiclePlates ? `• Placas: ${req.vehiclePlates}` : ''}</span>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                              <button
                                onClick={() => handleQuickApprove(req.id, `${req.firstName} ${req.lastName}`)}
                                disabled={approvingId === req.id}
                                style={{
                                  padding: '6px 12px', borderRadius: '8px', border: 'none',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: approvingId === req.id ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                              >
                                <UserCheck size={13} />
                                {approvingId === req.id ? 'Enviando...' : 'Aprobar y Enviar Accesos'}
                              </button>
                            </div>
                          </div>
                        ))}

                        <Link 
                          href="/dashboard/users" 
                          onClick={() => setIsNotifPopoverOpen(false)}
                          style={{
                            textAlign: 'center', padding: '8px', fontSize: '12px', color: '#0284c7',
                            fontWeight: 700, textDecoration: 'none', borderTop: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px'
                          }}
                        >
                          <span>Administrar todas las solicitudes</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    )
                  ) : (
                    <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>¡Bienvenido a AURA Portal Cliente!</p>
                      <p style={{ margin: '6px 0 0', fontSize: '12px' }}>
                        Aquí puedes dar de alta tus automóviles con fotos, consultar tus mantenimientos y agendar nuevos servicios.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '14px'
              }}>
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '24px 16px 60px', flex: 1, width: '100%' }}>
          {children}
        </div>
      </main>

      {/* Mandatory Password Change Modal for Users with Temporary Credentials */}
      {user?.mustChangePassword && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(5, 10, 20, 0.88)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-card, #0f172a)',
              borderRadius: '24px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.18)',
              padding: '32px 28px',
              color: 'var(--text-primary, #f8fafc)',
              position: 'relative',
            }}
          >
            {/* Header Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
              <div 
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  marginBottom: '16px',
                  boxShadow: '0 8px 16px rgba(56, 189, 248, 0.2)'
                }}
              >
                <KeyRound size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: 'var(--text-primary, #ffffff)' }}>
                Actualización Obligatoria de Contraseña
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                Has ingresado con una contraseña temporal. Por tu seguridad, debes definir tu nueva contraseña personal para continuar navegando en Aura.
              </p>
            </div>

            {/* Error Message */}
            {passwordChangeError && (
              <div 
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{passwordChangeError}</span>
              </div>
            )}

            {/* Success Message */}
            {passwordChangeSuccess && (
              <div 
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{passwordChangeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleMandatoryPasswordChange}>
              {/* New Password Field */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                  Nueva Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                      backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary, #94a3b8)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 0
                    }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                  Confirmar Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                      backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary, #94a3b8)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={passwordChangeLoading || !!passwordChangeSuccess}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: passwordChangeLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s'
                }}
              >
                <Lock size={16} />
                {passwordChangeLoading ? 'Guardando contraseña...' : 'Guardar Contraseña y Continuar'}
              </button>
            </form>

            {/* Logout alternative */}
            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.08))', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'underline'
                }}
              >
                <LogOut size={13} />
                Cerrar sesión e ingresar en otro momento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
