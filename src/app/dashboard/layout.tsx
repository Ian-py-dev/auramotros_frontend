'use client';

import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal,
  Sun,
  Moon,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isNotifPopoverOpen, setIsNotifPopoverOpen] = useState(false);

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
      label: 'Vehículos',
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
      label: 'Configuración',
      path: '/dashboard/settings',
      permission: 'VIEW_SETTINGS',
      icon: SlidersHorizontal,
      color: '#64748b',
      badgeBg: 'rgba(100, 116, 139, 0.14)',
      glow: 'rgba(100, 116, 139, 0.35)'
    },
  ];

  const allowedNavItems = navItems.filter(item => hasPermission(item.permission));
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
                <span style={{
                  position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px',
                  backgroundColor: '#ef4444', borderRadius: '50%'
                }}></span>
              </button>

              {/* Notification Popover */}
              {isNotifPopoverOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '320px', maxWidth: '90vw',
                  backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 60,
                  overflow: 'hidden', padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Notificaciones</h3>
                    <button style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Leído</button>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sistema operando normalmente. Sin notificaciones críticas pendientes.</p>
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
    </div>
  );
}
