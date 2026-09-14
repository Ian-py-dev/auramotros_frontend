'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, safeFetch } from '../../../lib/api-config';
import { 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Building2 as BuildingIcon,
  Plus as PlusIcon,
  Edit3 as EditIcon,
  Trash2 as TrashIcon,
  Wrench as WrenchIcon,
  CheckCircle as CheckCircleIcon,
  Mail as MailIcon
} from 'lucide-react';

interface SmtpConfigResponse {
  configured?: boolean;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  fromName?: string;
  fromEmail?: string;
  secure?: boolean;
  message?: string;
}

// --- Components ---

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem',
      borderRadius: '30px', border: active ? 'none' : '1px solid var(--glass-border)',
      background: active ? 'var(--primary-color, #0ea5e9)' : 'var(--bg-secondary)',
      color: active ? '#fff' : 'var(--text-primary)',
      cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s',
      boxShadow: active ? '0 4px 15px rgba(14, 165, 233, 0.4)' : 'none'
    }}>
      <span style={{ color: active ? '#fff' : 'var(--text-secondary)' }}>{icon}</span>
      {label}
    </button>
  );
}

interface DepartmentItem {
  id?: number;
  name: string;
  location: string;
  status: string;
  users?: number;
  _count?: { users?: number };
}

interface ServiceTypeItem {
  id?: string;
  name: string;
  description?: string;
  price: number | string;
  status: string;
}

// 1. Departamentos Tab
function DepartamentosTab() {
  const [depts, setDepts] = useState<DepartmentItem[]>([]);

  const fetchDepts = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/departments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('aura_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepts(data.map((d: DepartmentItem) => ({ ...d, users: d._count?.users || 0 })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  
  const [formData, setFormData] = useState({ name: '', location: '', status: 'Activo' });

  const openModal = (dept?: DepartmentItem) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, location: dept.location, status: dept.status });
    } else {
      setEditingDept(null);
      setFormData({ name: '', location: '', status: 'Activo' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('aura_token');
    if (editingDept) {
      await fetch(`${getApiBaseUrl()}/api/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
    } else {
      await fetch(`${getApiBaseUrl()}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
    }
    setIsModalOpen(false);
    fetchDepts();
  };

  const handleDelete = async (id?: number | string) => {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar este departamento?')) {
      await fetch(`${getApiBaseUrl()}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('aura_token')}` }
      });
      fetchDepts();
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BuildingIcon /> Gestión de Departamentos
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Administra las áreas de trabajo, ubicaciones y responsables.</p>
        </div>
        <button 
          onClick={() => openModal()}
          style={{ 
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
            color: '#fff', border: 'none', padding: '0.85rem 1.5rem', 
            borderRadius: '12px', fontWeight: 600, cursor: 'pointer', 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'none'}
        >
          <PlusIcon /> Nuevo Departamento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {depts.map(d => (
          <div key={d.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openModal(d)} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-secondary)', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}><EditIcon /></button>
                <button onClick={() => d.id && handleDelete(d.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}><TrashIcon /></button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ background: d.status === 'Activo' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: d.status === 'Activo' ? '#16a34a' : '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{d.status}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                {d.users} usuarios
              </span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Ubicación
              </p>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.location}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', width: '90%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nombre del Departamento <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Taller Hojalatería" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ubicación / Sucursal <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej. Sucursal Central" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Estado</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
                  Guardar Departamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Tipos de Servicios Tab
function ServiciosTab() {
  const [servicios, setServicios] = useState<ServiceTypeItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceTypeItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', status: 'Activo' });

  const fetchServices = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/service-types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('aura_token')}` }
      });
      if (res.ok) {
        setServicios(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openModal = (svc?: ServiceTypeItem) => {
    if (svc) {
      setEditingService(svc);
      setFormData({ name: svc.name, description: svc.description || '', price: svc.price.toString(), status: svc.status });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: '', status: 'Activo' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('aura_token');
    const payload = { ...formData, price: parseFloat(formData.price) };
    if (editingService) {
      await fetch(`${getApiBaseUrl()}/api/service-types/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(`${getApiBaseUrl()}/api/service-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    }
    setIsModalOpen(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      await fetch(`${getApiBaseUrl()}/api/service-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('aura_token')}` }
      });
      fetchServices();
    }
  };

  const toggleStatus = async (svc: ServiceTypeItem) => {
    const token = localStorage.getItem('aura_token');
    await fetch(`${getApiBaseUrl()}/api/service-types/${svc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: svc.status === 'Activo' ? 'Inactivo' : 'Activo' })
    });
    fetchServices();
  };

  const activeServices = servicios.filter(s => s.status === 'Activo').length;
  const avgPrice = servicios.length > 0 ? (servicios.reduce((acc, s) => acc + Number(s.price), 0) / servicios.length).toFixed(2) : '0.00';

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <WrenchIcon /> Tipos de Servicios
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configura el catálogo de servicios ofrecidos por los talleres.</p>
        </div>
        <button 
          onClick={() => openModal()}
          style={{ 
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
            color: '#fff', border: 'none', padding: '0.85rem 1.5rem', 
            borderRadius: '12px', fontWeight: 600, cursor: 'pointer', 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <PlusIcon /> Agregar Servicio
        </button>
      </div>

      {/* Metrics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-accent)', borderRadius: '16px' }}><WrenchIcon /></div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Registrados</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{servicios.length}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '16px' }}><CheckCircleIcon /></div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Servicios Activos</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeServices}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '16px' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tarifa Promedio</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${avgPrice} MXN</h3>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Nombre del Servicio</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Descripción Corta</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Tarifa</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>Estado</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s, idx) => (
              <tr key={s.id} style={{ borderBottom: idx !== servicios.length -1 ? '1px solid var(--glass-border)' : 'none', opacity: s.status === 'Inactivo' ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--primary-color, #0284c7)', fontWeight: 600, fontSize: '0.9rem' }}>${s.price.toLocaleString()} MXN</td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  <button onClick={() => toggleStatus(s)} style={{
                    width: '44px', height: '24px', borderRadius: '12px', padding: '2px', cursor: 'pointer', border: 'none',
                    background: s.status === 'Activo' ? '#10b981' : '#64748b', transition: 'background 0.3s',
                    display: 'flex', alignItems: 'center', justifyContent: s.status === 'Activo' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}></div>
                  </button>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <button onClick={() => openModal(s)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}><EditIcon /></button>
                  <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}><TrashIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD Service Types */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', width: '90%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nombre del Servicio <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Cambio de Aceite" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Descripción</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ej. Reemplazo de filtro y aceite sintético..." style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'none' }} />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Tarifa Estimada ($ MXN) <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ej. 1500.00" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Estados Tab
function EstadosTab() {
  const estados = [
    { id: 1, name: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', order: 1 },
    { id: 2, name: 'Aceptado', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', order: 2 },
    { id: 3, name: 'En Taller / Reparación', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', order: 3 },
    { id: 4, name: 'Finalizado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', order: 4 },
    { id: 5, name: 'Cancelado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', order: 5 },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircleIcon /> Estados de Órdenes
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Define los flujos y colores de los estados para las órdenes y reservaciones.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusIcon /> Nuevo Estado
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {estados.map(e => (
          <div key={e.id} className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', cursor: 'grab' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16"></path></svg>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', width: '200px' }}>{e.name}</span>
              <span style={{ background: e.bg, color: e.color, padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${e.color}30` }}>Vista Previa</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: e.color, border: '2px solid var(--bg-primary)', boxShadow: '0 0 0 1px var(--glass-border)' }}></div>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}><EditIcon /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Email Tab (Gestión Dinámica de SMTP)
function EmailTab() {
  const [smtpConfig, setSmtpConfig] = useState({
    configured: false,
    host: 'smtp.gmail.com',
    port: 465,
    user: '',
    pass: '',
    fromName: 'Aura Servicios Automotrices',
    fromEmail: '',
    secure: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    const { ok, data } = await safeFetch<SmtpConfigResponse>('/surveys/smtp-config');
    if (ok && data) {
      setSmtpConfig({
        configured: Boolean(data.configured),
        host: data.host || 'smtp.gmail.com',
        port: data.port || 465,
        user: data.user || '',
        pass: data.pass || '',
        fromName: data.fromName || 'Aura Servicios Automotrices',
        fromEmail: data.fromEmail || data.user || '',
        secure: data.secure ?? true,
      });
      if (data.user) {
        setTestEmail(prev => prev || data.user || '');
      }
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const { ok, data, error } = await safeFetch<SmtpConfigResponse>('/surveys/smtp-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig),
    });

    if (ok) {
      setFeedback({ type: 'success', message: '¡Configuración de correo SMTP guardada exitosamente en la base de datos!' });
      fetchConfig();
    } else {
      setFeedback({ type: 'error', message: data?.message || error || 'Error al guardar la configuración SMTP.' });
    }
    setIsLoading(false);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);

    const { ok, data, error } = await safeFetch<{ message?: string }>('/surveys/smtp-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig),
    });

    if (ok) {
      setFeedback({ type: 'success', message: data?.message || '¡Conexión SMTP verificada con éxito! El servidor está listo para enviar correos.' });
    } else {
      setFeedback({ type: 'error', message: data?.message || error || 'No se pudo conectar al servidor SMTP. Revisa el host, puerto y credenciales.' });
    }
    setIsTesting(false);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      setFeedback({ type: 'error', message: 'Ingresa un correo electrónico de destino para la prueba.' });
      return;
    }

    setIsSendingTest(true);
    setFeedback(null);

    const { ok, data, error } = await safeFetch<{ message?: string }>('/surveys/smtp-config/send-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail: testEmail.trim() }),
    });

    if (ok) {
      setFeedback({ type: 'success', message: data?.message || `¡Correo de prueba enviado exitosamente a ${testEmail}!` });
    } else {
      setFeedback({ type: 'error', message: data?.message || error || 'Error al enviar el correo de prueba. Verifica la contraseña de aplicación.' });
    }
    setIsSendingTest(false);
  };

  const setGmailPreset = () => {
    setSmtpConfig(prev => ({
      ...prev,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      fromName: prev.fromName || 'Aura Servicios Automotrices',
    }));
  };

  const setOutlookPreset = () => {
    setSmtpConfig(prev => ({
      ...prev,
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      fromName: prev.fromName || 'Aura Servicios Automotrices',
    }));
  };

  const setResendPreset = () => {
    setSmtpConfig(prev => ({
      ...prev,
      host: 'api.resend.com',
      port: 443,
      user: 'resend',
      secure: true,
      fromEmail: prev.fromEmail && prev.fromEmail.includes('@') && !prev.fromEmail.includes('gmail') && !prev.fromEmail.includes('outlook') ? prev.fromEmail : 'onboarding@resend.dev',
      fromName: prev.fromName || 'Aura Servicios Automotrices',
    }));
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      {/* Header & Status Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={22} color="#0284c7" /> Servidor de Correo Electrónico (SMTP / API)
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Gestiona las credenciales del servidor emisor para notificaciones, accesos de clientes y citas.
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '30px',
          background: smtpConfig.configured ? 'rgba(16,185,129,0.12)' : 'rgba(234,179,8,0.12)',
          color: smtpConfig.configured ? '#10b981' : '#eab308',
          border: `1px solid ${smtpConfig.configured ? 'rgba(16,185,129,0.3)' : 'rgba(234,179,8,0.3)'}`,
          fontWeight: 700, fontSize: '0.9rem'
        }}>
          {smtpConfig.configured ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {smtpConfig.configured ? '✓ Servidor Configurado y Activo' : '⚠ Configuración Pendiente'}
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedback && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem',
          background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: feedback.type === 'success' ? '#10b981' : '#ef4444',
          fontWeight: 600,
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Quick Presets */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={setGmailPreset}
          style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            background: smtpConfig.host === 'smtp.gmail.com' ? 'rgba(2,132,199,0.2)' : 'var(--bg-secondary)',
            border: `1px solid ${smtpConfig.host === 'smtp.gmail.com' ? '#0284c7' : 'var(--glass-border)'}`,
            color: 'var(--text-primary)', cursor: 'pointer'
          }}
        >
          ⚡ Preset: Gmail (Puerto 465 SSL)
        </button>
        <button
          type="button"
          onClick={setResendPreset}
          style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            background: smtpConfig.host === 'api.resend.com' ? 'rgba(16,185,129,0.2)' : 'var(--bg-secondary)',
            border: `1px solid ${smtpConfig.host === 'api.resend.com' ? '#10b981' : 'var(--glass-border)'}`,
            color: 'var(--text-primary)', cursor: 'pointer'
          }}
        >
          🚀 Preset: Resend (HTTPS Puerto 443 - Cloud)
        </button>
        <button
          type="button"
          onClick={setOutlookPreset}
          style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
            background: smtpConfig.host === 'smtp.office365.com' ? 'rgba(2,132,199,0.2)' : 'var(--bg-secondary)',
            border: `1px solid ${smtpConfig.host === 'smtp.office365.com' ? '#0284c7' : 'var(--glass-border)'}`,
            color: 'var(--text-primary)', cursor: 'pointer'
          }}
        >
          ⚡ Preset: Outlook / Office 365 (Puerto 587)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* Main SMTP Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Servidor SMTP (Host) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="smtp.gmail.com"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                />
              </div>
              <div style={{ minWidth: '100px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Puerto <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="465"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {smtpConfig.host === 'api.resend.com' ? 'Identificador de Usuario' : 'Usuario / Correo Emisor'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type={smtpConfig.host === 'api.resend.com' ? 'text' : 'email'}
                  required
                  placeholder={smtpConfig.host === 'api.resend.com' ? 'resend' : 'notificaciones@aura.com'}
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value, fromEmail: smtpConfig.host === 'api.resend.com' ? smtpConfig.fromEmail : e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                />
              </div>

              {/* Password with Eye Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {smtpConfig.host === 'api.resend.com' ? 'API Key de Resend (re_...)' : 'Contraseña / App Password'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={smtpConfig.host === 'api.resend.com' ? 're_123456789abcdef...' : 'Contraseña de aplicación (16 caracteres)'}
                    value={smtpConfig.pass}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    style={{
                      position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sender Name & From Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Nombre del Remitente
                </label>
                <input
                  type="text"
                  placeholder="Aura Servicios Automotrices"
                  value={smtpConfig.fromName}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Correo de Envío (From)
                </label>
                <input
                  type="email"
                  placeholder={smtpConfig.host === 'api.resend.com' ? 'onboarding@resend.dev' : 'notificaciones@aura.com'}
                  value={smtpConfig.fromEmail}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                />
              </div>
            </div>

            {/* Secure SSL Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input
                type="checkbox"
                id="secureSslCheck"
                checked={smtpConfig.secure}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
              />
              <label htmlFor="secureSslCheck" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                Usar conexión segura SSL/TLS (Recomendado para puerto 465 y Resend HTTPS)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1, minWidth: '160px', padding: '0.85rem 1.5rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', color: '#fff',
                  border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 15px rgba(2,132,199,0.3)', opacity: isLoading ? 0.7 : 1
                }}
              >
                <ShieldCheck size={16} /> {isLoading ? 'Guardando...' : 'Guardar Configuración'}
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  flex: 1, minWidth: '160px', padding: '0.85rem 1.5rem', borderRadius: '10px',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  border: '1px solid var(--glass-border)', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: isTesting ? 0.7 : 1
                }}
              >
                <Zap size={16} color="#eab308" /> {isTesting ? 'Verificando...' : 'Probar Conexión'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Test Email Sender & Guides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Send Test Email Card */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} color="#0284c7" /> Enviar Correo de Prueba
            </h3>
            <p style={{ margin: 0, marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Verifica que el servidor pueda entregar correos en tu bandeja de entrada en tiempo real.
            </p>

            <form onSubmit={handleSendTestEmail} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="email"
                required
                placeholder="tu_correo_personal@ejemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
              />
              <button
                type="submit"
                disabled={isSendingTest}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '8px',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)', opacity: isSendingTest ? 0.7 : 1
                }}
              >
                <Mail size={16} /> {isSendingTest ? 'Enviando...' : 'Enviar Prueba Ahora'}
              </button>
            </form>
          </div>

          {/* Guide Card: Resend API */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚀 Recomendado para Railway: Resend API
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Los servidores cloud como Railway nunca bloquean el tráfico HTTPS (Puerto 443). Crea una cuenta gratuita en <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 600 }}>resend.com</a>, copia tu <strong>API Key (re_...)</strong> y envía hasta 3,000 correos al mes gratis sin bloqueos de puertos.
            </p>
          </div>

          {/* Guide Card: Gmail */}
          <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💡 ¿Usas Gmail o Google Workspace?
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Usa el preset de <strong>Gmail (Puerto 465 SSL)</strong>. Requiere generar una <strong>Contraseña de Aplicación</strong> de 16 letras desde <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 600 }}>myaccount.google.com/apppasswords</a> (requiere tener activa la verificación en 2 pasos).
            </p>
          </div>

          {/* Warning Card: Outlook */}
          <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Nota sobre Outlook / Office 365
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Microsoft bloquea por seguridad las conexiones SMTP básicas (puerto 587) originadas desde servidores cloud. Si experimentas &quot;Connection timeout&quot; con Outlook, utiliza Gmail o Resend.
            </p>
          </div>

          {/* Encryption Note */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#10b981' }}>
            <ShieldCheck size={20} />
            <span>Tus credenciales se almacenan con cifrado industrial <strong>AES-256-CBC</strong> en base de datos.</span>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Main Export ---
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'departamentos' | 'servicios' | 'estados' | 'email'>('departamentos');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>
          <span style={{ background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Configuración</span> del Sistema
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Gestiona las categorías, estados, notificaciones por correo y departamentos del ecosistema Aura.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <TabButton active={activeTab === 'departamentos'} onClick={() => setActiveTab('departamentos')} icon={<BuildingIcon />} label="Departamentos" />
        <TabButton active={activeTab === 'servicios'} onClick={() => setActiveTab('servicios')} icon={<WrenchIcon />} label="Tipos de Servicios" />
        <TabButton active={activeTab === 'estados'} onClick={() => setActiveTab('estados')} icon={<CheckCircleIcon />} label="Estados" />
        <TabButton active={activeTab === 'email'} onClick={() => setActiveTab('email')} icon={<MailIcon />} label="Email" />
      </div>

      {/* Tab Content Background Container */}
      <div>
        {activeTab === 'departamentos' && <DepartamentosTab />}
        {activeTab === 'servicios' && <ServiciosTab />}
        {activeTab === 'estados' && <EstadosTab />}
        {activeTab === 'email' && <EmailTab />}
      </div>
    </div>
  );
}
