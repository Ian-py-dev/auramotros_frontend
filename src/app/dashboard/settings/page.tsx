'use client';

import React, { useState, useEffect } from 'react';

// --- Icons ---
const BuildingIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>;
const WrenchIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>;
const CheckCircleIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const MailIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
const PlusIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>;
const EditIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const TrashIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const EyeIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;

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
      const res = await fetch('http://localhost:3000/api/departments', {
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
      await fetch(`http://localhost:3000/api/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
    } else {
      await fetch('http://localhost:3000/api/departments', {
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
      await fetch(`http://localhost:3000/api/departments/${id}`, {
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
      const res = await fetch('http://localhost:3000/api/service-types', {
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
      await fetch(`http://localhost:3000/api/service-types/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('http://localhost:3000/api/service-types', {
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
      await fetch(`http://localhost:3000/api/service-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('aura_token')}` }
      });
      fetchServices();
    }
  };

  const toggleStatus = async (svc: ServiceTypeItem) => {
    const token = localStorage.getItem('aura_token');
    await fetch(`http://localhost:3000/api/service-types/${svc.id}`, {
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

// 4. Email Tab
function EmailTab() {
  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MailIcon /> Configuración de Notificaciones (Email)
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configura el servidor SMTP y automatiza el envío de correos electrónicos a clientes y mecánicos.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Config SMTP Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Configuración SMTP
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Servidor SMTP <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" defaultValue="smtp.office365.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Puerto SMTP <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" defaultValue="587" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Usuario SMTP <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="email" defaultValue="notificaciones@aura.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Contraseña SMTP <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="password" defaultValue="••••••••••••" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }} />
              <div style={{ position: 'absolute', right: '1rem', top: '2.2rem', color: 'var(--text-secondary)' }}><EyeIcon /></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Email del Remitente <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="email" defaultValue="notificaciones@aura.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nombre del Remitente</label>
              <input type="text" defaultValue="Aura Automotive System" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#0ea5e9' }} />
            <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>Usar conexión segura (SSL/TLS)</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ flex: 1 }}>
              Guardar Configuración
            </button>
            <button style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '0.85rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Probar Conexión
            </button>
          </div>
        </div>

        {/* Right Column: Notification Types & Test */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Tipos de Notificación
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['Habilitar notificaciones globales', 'Creación de órdenes', 'Actualización de estados', 'Asignación de órdenes a mecánicos', 'Comentarios en la orden'].map(txt => (
                <label key={txt} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{txt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Pruebas
            </h3>
            <button style={{ width: '100%', background: '#f97316', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginBottom: '0.5rem', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
              Probar Escenarios de Email
            </button>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Envía emails de prueba para simular los diferentes flujos del sistema.
            </p>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#d97706' }}>💡 Configuración de Gmail</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309', lineHeight: 1.5 }}>
              Para cuentas de Gmail, usa una &quot;App Password&quot; (Contraseña de aplicación) en lugar de tu contraseña normal. Recuerda habilitar la autenticación de 2 factores en tu cuenta de Google.
            </p>
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
