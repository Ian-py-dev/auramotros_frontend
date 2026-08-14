'use client';

import React, { useState, useEffect } from 'react';
import { safeFetch } from '../../../lib/api-config';
import { LiquidButton } from '../../../components/ui/LiquidGooeyMenu';
import {
  Search,
  Clock,
  Shield,
  UserPlus,
  Mail,
  Key,
  Building2,
  Laptop,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Filter,
  Sparkles,
  UserCheck,
  UserX
} from 'lucide-react';

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  status: 'Activo' | 'Inactivo';
  avatar: string;
  department?: string;
  location?: string;
  createdAt?: string;
};

type UserApiItem = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status?: string;
  roles?: { role: { name: string } }[];
  department?: { name: string };
  location?: string;
  createdAt?: string;
};

type DepartmentApiItem = {
  id: string;
  name: string;
};

type AccessRequestItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [departments, setDepartments] = useState<DepartmentApiItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  const [departmentFilter, setDepartmentFilter] = useState('Todos');
  const [locationFilter, setLocationFilter] = useState('Todas');
  const [roleFilter, setRoleFilter] = useState('Todos');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  // Quick Password Reset Modal
  const [resetPassUser, setResetPassUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Administrador',
    department: 'No asignado',
    location: 'Corporativo'
  });

  const availableRoles = ['Super Admin', 'Administrador', 'Asesor', 'Mecánico', 'Cliente'];
  const availableLocations = ['Corporativo Central', 'Sucursal Norte', 'Sucursal Sur', 'Sucursal Matriz', 'Sucursal Poniente'];

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('siga-token') || localStorage.getItem('aura_token') : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const [usersResult, deptsResult, requestsResult] = await Promise.all([
      safeFetch<UserApiItem[]>('/users', { headers }),
      safeFetch<DepartmentApiItem[]>('/departments', { headers }),
      safeFetch<AccessRequestItem[]>('/users/access-requests', { headers })
    ]);

    if (deptsResult.ok && Array.isArray(deptsResult.data)) {
      setDepartments(deptsResult.data);
    }
    if (requestsResult.ok && Array.isArray(requestsResult.data)) {
      setAccessRequests(requestsResult.data);
    }
    if (usersResult.ok && Array.isArray(usersResult.data)) {
      setUsers(usersResult.data.map((u) => ({
        id: u.id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: u.roles?.[0]?.role?.name || 'Asesor',
        status: u.status === 'Inactivo' ? 'Inactivo' : 'Activo',
        avatar: u.firstName && u.lastName ? `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() : u.email.substring(0, 2).toUpperCase(),
        department: u.department?.name || 'No asignado',
        location: u.location || 'Corporativo Central',
        createdAt: u.createdAt
      })));
    } else {
      setUsers([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingRequestsCount = accessRequests.filter(r => r.status === 'PENDING').length;

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: 'Admin123!',
      role: 'Administrador',
      department: 'No asignado',
      location: 'Corporativo Central'
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (u: UserData) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: '',
      role: u.role,
      department: u.department || 'No asignado',
      location: u.location || 'Corporativo Central'
    });
    setIsCreateModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    const nextStatus = target.status === 'Activo' ? 'Inactivo' : 'Activo';
    
    // Update local state instantly
    setUsers(users.map(u => u.id === id ? { ...u, status: nextStatus } : u));

    const { ok } = await safeFetch(`/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });

    if (ok) {
      showToast(`Estado de ${target.name} actualizado a ${nextStatus}`, 'info');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${name}?`)) return;
    const { ok, error } = await safeFetch(`/users/${id}`, { method: 'DELETE' });
    if (ok) {
      showToast(`Usuario ${name} eliminado del sistema`, 'info');
      fetchData();
    } else {
      showToast(`Error al eliminar: ${error || ''}`, 'error');
    }
  };

  const handleResendCredentials = async (id: string, email: string) => {
    showToast(`Enviando credenciales con clave temporal a ${email}...`, 'info');
    const { ok, data, error } = await safeFetch<{ message: string }>(`/users/${id}/resend-credentials`, { method: 'POST' });
    if (ok && data) {
      showToast(data.message, 'success');
    } else {
      showToast(error || 'Error al enviar credenciales', 'error');
    }
  };

  const handleResendCredentialsAll = async () => {
    showToast('Generando claves temporales y enviando notificaciones SMTP a todos los usuarios...', 'info');
    const { ok, data } = await safeFetch<{ message: string }>('/users/resend-credentials-all', { method: 'POST' });
    if (ok && data) {
      showToast(data.message, 'success');
    } else {
      showToast('Error al enviar notificaciones masivas', 'error');
    }
  };

  const handleApproveRequest = async (reqId: string, name: string) => {
    showToast(`Aprobando solicitud de ${name} y enviando accesos por correo...`, 'info');
    const { ok, data, error } = await safeFetch<{ message: string }>(`/users/access-requests/${reqId}/approve`, { method: 'POST' });
    if (ok && data) {
      showToast(data.message, 'success');
      fetchData();
    } else {
      showToast(error || 'No se pudo aprobar la solicitud', 'error');
    }
  };

  const handleRejectRequest = async (reqId: string, name: string) => {
    const { ok, data, error } = await safeFetch<{ message: string }>(`/users/access-requests/${reqId}/reject`, { method: 'POST' });
    if (ok && data) {
      showToast(data.message || `Solicitud de ${name} rechazada`, 'info');
      fetchData();
    } else {
      showToast(error || 'No se pudo rechazar la solicitud', 'error');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    const { ok, data, error } = await safeFetch<{ message: string }>(`/users/${resetPassUser.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    if (ok && data) {
      showToast(data.message, 'success');
      setResetPassUser(null);
      setNewPassword('');
    } else {
      showToast(error || 'No se pudo restablecer la contraseña', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('siga-token') || localStorage.getItem('aura_token') : null;
    const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };

    if (editingUser) {
      const { ok, error } = await safeFetch(`/users/${editingUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      if (ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  name: `${formData.firstName} ${formData.lastName}`.trim(),
                  email: formData.email,
                  role: formData.role,
                  department: formData.department,
                  location: formData.location,
                }
              : u
          )
        );
        showToast('¡Usuario y datos actualizados exitosamente! ✨', 'success');
        setIsCreateModalOpen(false);
        fetchData();
      } else {
        showToast(`Error al actualizar usuario: ${error || ''}`, 'error');
      }
    } else {
      const { ok, data, error } = await safeFetch<{ message?: string }>('/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      if (ok) {
        showToast('¡Nuevo usuario creado exitosamente! 🎉', 'success');
        setIsCreateModalOpen(false);
        fetchData();
      } else {
        const errorText = data?.message || error || 'El usuario ya existe.';
        if (errorText.toLowerCase().includes('ya existe') || errorText.toLowerCase().includes('already exists')) {
          showToast(`⚠️ El usuario con el correo "${formData.email}" ya se encuentra registrado en el sistema.`, 'error');
        } else {
          showToast(`Error: ${errorText}`, 'error');
        }
      }
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'Todos' ||
      (statusFilter === 'Activos' && u.status === 'Activo') ||
      (statusFilter === 'Inactivos' && u.status === 'Inactivo');

    const matchesDept = departmentFilter === 'Todos' || u.department === departmentFilter;
    const matchesLoc = locationFilter === 'Todas' || u.location === locationFilter;
    const matchesRole = roleFilter === 'Todos' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesDept && matchesLoc && matchesRole;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('Todos');
    setDepartmentFilter('Todos');
    setLocationFilter('Todas');
    setRoleFilter('Todos');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            backgroundColor: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'info' ? '#8b5cf6' : '#0284c7',
            color: '#ffffff',
            padding: '14px 24px',
            borderRadius: '16px',
            boxShadow: '0 14px 35px rgba(0, 0, 0, 0.45)',
            zIndex: 99999,
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Sparkles size={18} />
          {toastMessage.text}
        </div>
      )}

      {/* Top Header Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Search Bar */}
        <div style={{ flex: '1 1 340px', minWidth: '280px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Buscar usuarios por nombre, apellido, email o sucursal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '44px',
              paddingRight: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              borderRadius: '9999px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Quick Action Pills & Primary Create Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Solicitudes Pending Pill */}
          <button
            onClick={() => setIsRequestsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Clock size={16} style={{ color: '#38bdf8' }} />
            <span>Solicitudes</span>
            {pendingRequestsCount > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <a
            href="/dashboard/roles"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <Shield size={16} style={{ color: '#a78bfa' }} />
            <span>Administrar Roles</span>
          </a>

          <LiquidButton variant="primary" onClick={handleOpenCreate} size="md">
            <UserPlus size={16} />
            Nuevo Usuario
          </LiquidButton>
        </div>
      </div>

      {/* Global Notification Button Bar */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleResendCredentialsAll}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '12px 24px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Mail size={16} />
          <Key size={16} />
          <span>Notificar Credenciales Masivas con Clave Temporal</span>
        </button>
      </div>

      {/* Filter Bar Panel */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Filter size={15} />
            <span>Filtros de Catálogo</span>
          </div>
          <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            Limpiar filtros
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Estado</label>
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {['Todos', 'Activos', 'Inactivos'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st as 'Todos' | 'Activos' | 'Inactivos')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: statusFilter === st ? '#0284c7' : 'transparent',
                    color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Departamento</label>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="Todos">Todos los departamentos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Location / Branch Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Sucursal / Ubicación</label>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="Todas">Todas las sucursales</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Rol</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="Todos">Todos los roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* User Cards Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #38bdf8', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          Cargando catálogo de usuarios...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-card" style={{ padding: '64px 24px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <UserX size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Sin resultados</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            No se encontraron usuarios coincidentes con los criterios de búsqueda o filtros seleccionados.
          </p>
          <LiquidButton variant="secondary" onClick={clearFilters}>Limpiar Filtros</LiquidButton>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {filteredUsers.map((u) => (
            <div key={u.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: u.status === 'Inactivo' ? 0.6 : 1, border: u.status === 'Inactivo' ? '1px dashed rgba(239, 68, 68, 0.4)' : undefined }}>
              
              <div>
                {/* User Header: Initials Badge + Name & Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: u.status === 'Activo' ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '16px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                    flexShrink: 0
                  }}>
                    {u.avatar}
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.email}
                    </p>
                  </div>
                </div>

                {/* Micro Action Vector Icon Toolbar (Replacing Emojis with Lucide Icons) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => handleToggleStatus(u.id)}
                    title={u.status === 'Activo' ? 'Desactivar usuario (bloquea inicio de sesión)' : 'Activar usuario'}
                    style={{ padding: '8px 4px', borderRadius: '10px', background: u.status === 'Activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${u.status === 'Activo' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`, color: u.status === 'Activo' ? '#10b981' : '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    {u.status === 'Activo' ? <Eye size={15} /> : <EyeOff size={15} />}
                    <span>{u.status}</span>
                  </button>

                  <button
                    onClick={() => { setResetPassUser(u); setNewPassword(''); }}
                    title="Restablecer contraseña manualmente"
                    style={{ padding: '8px 4px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <Key size={15} />
                    <span>Clave</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(u)}
                    title="Editar sucursal y departamento"
                    style={{ padding: '8px 4px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#a78bfa', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <Building2 size={15} />
                    <span>Deptos</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(u)}
                    title="Editar rol de sistema"
                    style={{ padding: '8px 4px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.25)', color: '#f472b6', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <Laptop size={15} />
                    <span>Sistemas</span>
                  </button>

                  <button
                    onClick={() => handleResendCredentials(u.id, u.email)}
                    title="Reenviar clave temporal por correo SMTP"
                    style={{ padding: '8px 4px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.25)', color: '#0ea5e9', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <Mail size={15} />
                    <span>Enviar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    title="Eliminar usuario permanentemente"
                    style={{ padding: '8px 4px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={15} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              {/* Card Footer Badges */}
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '14px', marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, backgroundColor: u.status === 'Activo' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: u.status === 'Activo' ? '#10b981' : '#ef4444', border: `1px solid ${u.status === 'Activo' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                  {u.status}
                </span>

                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                  {u.department}
                </span>

                {/* Sucursal Badge with Edit Action */}
                <button
                  onClick={() => handleOpenEdit(u)}
                  title="Clic para editar sucursal"
                  style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <MapPin size={12} />
                  <span>{u.location}</span>
                  <Edit3 size={10} />
                </button>

                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: u.role === 'Super Admin' || u.role === 'Administrador' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: u.role === 'Super Admin' || u.role === 'Administrador' ? '#a78bfa' : '#34d399', border: `1px solid ${u.role === 'Super Admin' || u.role === 'Administrador' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>
                  {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACCESS REQUESTS MODAL (SOLICITUDES) */}
      {isRequestsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)', padding: '20px' }}>
          <div className="glass-card modal-container-responsive" style={{ background: 'rgba(15, 23, 42, 0.96)', borderRadius: '24px', width: '100%', maxWidth: '680px', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '36px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={22} style={{ color: '#38bdf8' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>Solicitudes de Acceso al Sistema</h2>
              </div>
              <button onClick={() => setIsRequestsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            {accessRequests.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px' }}>No hay solicitudes de acceso registradas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
                {accessRequests.map((req) => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '14px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{req.firstName} {req.lastName}</h4>
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>{req.email} • Rol: <span style={{ color: '#38bdf8' }}>{req.role}</span></p>
                    </div>

                    <div>
                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleApproveRequest(req.id, `${req.firstName} ${req.lastName}`)}
                            style={{ padding: '8px 14px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <UserCheck size={14} />
                            Aceptar Acceso
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id, `${req.firstName} ${req.lastName}`)}
                            style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <UserX size={14} />
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: req.status === 'APPROVED' ? '#10b981' : '#ef4444', padding: '4px 12px', borderRadius: '9999px', background: req.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                          {req.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL (WITH SUCURSAL EDITING) */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)', padding: '20px' }}>
          <div className="glass-card modal-container-responsive" style={{ background: 'rgba(15, 23, 42, 0.96)', borderRadius: '24px', width: '100%', maxWidth: '600px', border: '1px solid rgba(255, 255, 255, 0.16)', padding: '36px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {editingUser ? 'Editar Usuario y Sucursal' : 'Crear Nuevo Usuario'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Nombre</label>
                  <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Apellido</label>
                  <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none', fontSize: '14px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Correo Electrónico</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none', fontSize: '14px' }} />
              </div>

              {!editingUser && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Contraseña Inicial</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none', fontSize: '14px' }} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Departamento</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none', fontSize: '14px' }}>
                    <option value="No asignado">No asignado</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sucursal / Location Editable Select or Custom Text */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Sucursal / Ubicación</label>
                  <input
                    type="text"
                    placeholder="ej: Sucursal Norte"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Rol de Acceso</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none', fontSize: '14px' }}>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <LiquidButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </LiquidButton>
                <LiquidButton type="submit" variant="primary">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </LiquidButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESET PASSWORD MODAL */}
      {resetPassUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)', padding: '20px' }}>
          <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.96)', borderRadius: '24px', width: '100%', maxWidth: '440px', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} style={{ color: '#38bdf8' }} />
                Restablecer Contraseña
              </h3>
              <button onClick={() => setResetPassUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Ingresa la nueva contraseña para <strong>{resetPassUser.name}</strong> ({resetPassUser.email}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Ej. Admin123!"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <LiquidButton type="button" variant="secondary" onClick={() => setResetPassUser(null)}>
                  Cancelar
                </LiquidButton>
                <LiquidButton type="submit" variant="primary">
                  Guardar Clave
                </LiquidButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
