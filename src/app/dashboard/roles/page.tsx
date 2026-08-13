'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { safeFetch } from '../../../lib/api-config';
import { LiquidButton } from '../../../components/ui/LiquidGooeyMenu';
import { ShieldCheck, Plus, Lock, Trash2, CheckCircle2 } from 'lucide-react';

type RoleApiItem = {
  id: string;
  name: string;
  description: string;
  permissions?: { permission: { action: string } }[];
  _count?: { users: number };
};

const ALL_PERMISSIONS = [
  { id: 'VIEW_OVERVIEW', label: 'Visión General', desc: 'Permite ver el panel de control inicial y las métricas de órdenes.' },
  { id: 'VIEW_WORKSHOPS', label: 'Talleres', desc: 'Permite buscar, editar y registrar talleres en el mapa interactivo.' },
  { id: 'VIEW_ROLES', label: 'Roles y Permisos', desc: 'Permite alterar los permisos y privilegios del sistema (Acceso crítico).' },
  { id: 'VIEW_VEHICLES', label: 'Vehículos', desc: 'Permite ver el listado de autos registrados y cambiar sus fotografías.' },
  { id: 'VIEW_USERS', label: 'Usuarios', desc: 'Permite gestionar las cuentas de clientes, mecánicos y administradores.' },
  { id: 'VIEW_SURVEYS', label: 'Encuestas CSAT', desc: 'Permite diseñar encuestas de satisfacción, enviar emails y ver métricas.' },
  { id: 'VIEW_SETTINGS', label: 'Configuración', desc: 'Acceso a ajustes generales de la plataforma.' },
  { id: 'MANAGE_USERS', label: 'Administrar Usuarios', desc: 'Crear, editar y eliminar usuarios del sistema.' },
  { id: 'MANAGE_WORKSHOPS', label: 'Administrar Talleres', desc: 'Alta y edición de información de talleres.' },
];

export default function RolesPage() {
  const { getRolesConfig, updateRolePermissions } = useAuth();
  const config = getRolesConfig();

  const [rolesList, setRolesList] = useState<RoleApiItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Role Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['VIEW_OVERVIEW']);
  const [isCreating, setIsCreating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRoles = async () => {
    const { ok, data } = await safeFetch<RoleApiItem[]>('/roles');
    if (ok && Array.isArray(data)) {
      setRolesList(data);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = async (roleName: string, roleId: string | undefined, permissionId: string) => {
    const currentPerms = config[roleName] || [];
    let newPerms: string[];
    
    if (currentPerms.includes(permissionId)) {
      newPerms = currentPerms.filter(p => p !== permissionId);
    } else {
      newPerms = [...currentPerms, permissionId];
    }
    
    updateRolePermissions(roleName, newPerms);

    if (roleId) {
      await safeFetch(`/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPerms })
      });
    }

    showToast(`Permisos de ${roleName} actualizados ✨`);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsCreating(true);
    const { ok, error } = await safeFetch('/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoleName.trim(),
        description: newRoleDesc,
        permissions: selectedPerms
      })
    });

    if (ok) {
      updateRolePermissions(newRoleName.trim(), selectedPerms);
      showToast(`¡Rol "${newRoleName}" creado exitosamente! 🎉`);
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedPerms(['VIEW_OVERVIEW']);
      setShowCreateModal(false);
      fetchRoles();
    } else {
      showToast(error || 'Error al crear el rol');
    }
    setIsCreating(false);
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el rol "${name}"?`)) return;
    const { ok, error } = await safeFetch(`/roles/${id}`, { method: 'DELETE' });
    if (ok) {
      showToast(`Rol "${name}" eliminado correctamente`);
      fetchRoles();
    } else {
      showToast(error || 'No se pudo eliminar el rol', );
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '16px',
            boxShadow: '0 14px 35px rgba(2, 132, 199, 0.45)',
            zIndex: 9999,
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
            <ShieldCheck size={16} />
            Matriz de Seguridad y Privilegios
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Gestión de Roles y Permisos
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '15px', maxWidth: '600px' }}>
            Crea roles personalizados y administra qué secciones son visibles para cada nivel de usuario.
          </p>
        </div>

        <LiquidButton variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Crear Nuevo Rol
        </LiquidButton>
      </div>

      {/* Roles & Permissions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {Object.keys(config).map((roleName) => {
          const rolePerms = config[roleName] || [];
          const roleDbItem = rolesList.find((r) => r.name === roleName);

          return (
            <div key={roleName} className="glass-card" style={{ padding: '32px' }}>
              
              {/* Role Title Block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                    <span style={{ 
                      width: '14px', height: '14px', borderRadius: '50%', 
                      backgroundColor: roleName === 'Super Admin' ? '#8b5cf6' : roleName === 'Administrador' ? '#38bdf8' : roleName === 'Mecánico' ? '#10b981' : '#f43f5e',
                      boxShadow: '0 0 10px rgba(56,189,248,0.5)'
                    }} />
                    {roleName}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {roleName === 'Super Admin' ? 'Acceso maestro irrestricto a todos los recursos del sistema.' : 'Privilegios operativos configurables.'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontSize: '13px', fontWeight: 700,
                    backgroundColor: 'rgba(255,255,255,0.04)', padding: '6px 16px', borderRadius: '9999px', border: '1px solid var(--glass-border)',
                    color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Lock size={14} />
                    {rolePerms.length} Permisos Activos
                  </span>

                  {roleDbItem && roleName !== 'Super Admin' && roleName !== 'Administrador' && (
                    <button
                      onClick={() => handleDeleteRole(roleDbItem.id, roleName)}
                      style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions Switch Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {ALL_PERMISSIONS.map((perm) => {
                  const hasPerm = rolePerms.includes(perm.id);
                  const isSuperAdminCritical = roleName === 'Super Admin' && perm.id === 'VIEW_ROLES';
                  
                  return (
                    <div 
                      key={perm.id} 
                      style={{ 
                        padding: '16px', borderRadius: '14px', border: '1px solid var(--glass-border)', 
                        backgroundColor: hasPerm ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', margin: 0, color: hasPerm ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {perm.label}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                          {perm.desc}
                        </p>
                      </div>
                      
                      {/* Interactive Switch */}
                      <button 
                        disabled={isSuperAdminCritical}
                        onClick={() => handleTogglePermission(roleName, roleDbItem?.id, perm.id)}
                        style={{
                          width: '46px', height: '26px', borderRadius: '9999px', 
                          backgroundColor: hasPerm ? '#0284c7' : 'rgba(255,255,255,0.1)',
                          border: 'none', cursor: isSuperAdminCritical ? 'not-allowed' : 'pointer', position: 'relative',
                          transition: 'background-color 0.25s', flexShrink: 0, outline: 'none'
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px', left: hasPerm ? '23px' : '3px',
                          width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)', transition: 'left 0.25s'
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      {/* CREATE ROLE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card modal-container-responsive" style={{ background: 'rgba(15, 23, 42, 0.96)', borderRadius: '24px', width: '100%', maxWidth: '600px', border: '1px solid rgba(255, 255, 255, 0.16)', padding: '36px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>Crear Nuevo Rol Custom</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Nombre del Rol</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Supervisor de Taller"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Descripción</label>
                <input
                  type="text"
                  placeholder="Descripción de responsabilidades"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255, 255, 255, 0.16)', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>Permisos Inciales</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}>
                  {ALL_PERMISSIONS.map((p) => {
                    const isChecked = selectedPerms.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedPerms(selectedPerms.filter((sp) => sp !== p.id));
                          } else {
                            setSelectedPerms([...selectedPerms, p.id]);
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: isChecked ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isChecked ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                          color: isChecked ? '#ffffff' : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <CheckCircle2 size={16} style={{ color: isChecked ? '#38bdf8' : '#64748b' }} />
                        {p.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <LiquidButton type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </LiquidButton>
                <LiquidButton type="submit" variant="primary" disabled={isCreating}>
                  {isCreating ? 'Creando...' : 'Crear Rol'}
                </LiquidButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
