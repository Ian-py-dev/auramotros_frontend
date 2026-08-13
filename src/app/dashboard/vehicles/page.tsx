'use client';

import React, { useState, useEffect } from 'react';

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  plates: string;
  client: string;
  image: string;
  status: 'active' | 'in_service' | 'inactive';
  condition: 'Nuevo' | 'Usado';
};

const MOCK_VEHICLES: Vehicle[] = [
  { id: 'V-101', brand: 'Honda', model: 'Civic', year: 2021, plates: 'GHF-123', client: 'Carlos Mendoza', image: 'https://images.unsplash.com/photo-1590362891991-f7004f14798c?q=80&w=600&auto=format&fit=crop', status: 'in_service', condition: 'Usado' },
  { id: 'V-102', brand: 'Toyota', model: 'RAV4', year: 2023, plates: 'TYU-456', client: 'Sofía Reyes', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?q=80&w=600&auto=format&fit=crop', status: 'active', condition: 'Nuevo' },
  { id: 'V-103', brand: 'Ford', model: 'Mustang', year: 2019, plates: 'QWE-789', client: 'Luis Torres', image: 'https://images.unsplash.com/photo-1584345611124-277def3db066?q=80&w=600&auto=format&fit=crop', status: 'in_service', condition: 'Usado' },
  { id: 'V-104', brand: 'VW', model: 'Jetta', year: 2020, plates: 'ZXC-098', client: 'Ana García', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=600&auto=format&fit=crop', status: 'active', condition: 'Usado' },
  { id: 'V-105', brand: 'BMW', model: 'X5', year: 2022, plates: 'MNO-321', client: 'Jorge Silva', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=600&auto=format&fit=crop', status: 'inactive', condition: 'Usado' },
  { id: 'V-106', brand: 'Tesla', model: 'Model 3', year: 2023, plates: 'TES-111', client: 'Elena Cruz', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=600&auto=format&fit=crop', status: 'active', condition: 'Nuevo' },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    brand: '', model: '', year: 2023, plates: '', client: '', condition: 'Usado', status: 'active'
  });

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.plates.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'active') {
      return matchesSearch && v.status !== 'inactive';
    } else if (statusFilter === 'inactive') {
      return matchesSearch && v.status === 'inactive';
    }
    return matchesSearch;
  });

  const handleToggleStatus = (id: string) => {
    setVehicles(vehicles.map(v => {
      if (v.id === id) {
        return { ...v, status: v.status === 'inactive' ? 'active' : 'inactive' };
      }
      return v;
    }));
    setMenuOpenId(null);
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model) return;

    const newVehicle: Vehicle = {
      id: 'V-' + Math.floor(Math.random() * 1000),
      brand: formData.brand,
      model: formData.model,
      year: formData.year || 2023,
      plates: formData.plates || 'S/N',
      client: formData.client || 'Usuario Nuevo',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop',
      status: formData.status as 'active' | 'inactive',
      condition: formData.condition as 'Nuevo' | 'Usado'
    };

    setVehicles([newVehicle, ...vehicles]);
    setIsModalOpen(false);
    setFormData({ brand: '', model: '', year: 2023, plates: '', client: '', condition: 'Usado', status: 'active' });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '0.5rem' }}>Directorio de <span style={{ fontWeight: 600 }}>Vehículos</span></h2>
          <p style={{ color: 'var(--text-secondary)' }}>Administra el inventario de autos registrados por los clientes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', border: 'none', color: '#fff', 
            padding: '0.8rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, 
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' 
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
          Registrar Vehículo
        </button>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por cliente, marca o placas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '8px', 
              border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', 
              color: 'var(--text-primary)', outline: 'none' 
            }}
          />
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.3rem' }}>
          <button onClick={() => setStatusFilter('active')} style={{
            padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            background: statusFilter === 'active' ? 'var(--color-accent)' : 'transparent',
            color: statusFilter === 'active' ? '#fff' : 'var(--text-secondary)'
          }}>Activos</button>
          <button onClick={() => setStatusFilter('inactive')} style={{
            padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            background: statusFilter === 'inactive' ? 'var(--color-accent)' : 'transparent',
            color: statusFilter === 'inactive' ? '#fff' : 'var(--text-secondary)'
          }}>Inactivos</button>
          <button onClick={() => setStatusFilter('all')} style={{
            padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            background: statusFilter === 'all' ? 'var(--color-accent)' : 'transparent',
            color: statusFilter === 'all' ? '#fff' : 'var(--text-secondary)'
          }}>Todos</button>
        </div>
      </div>

      {/* Grid of Vehicles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="glass-card" style={{ 
            padding: 0, overflow: 'visible', display: 'flex', flexDirection: 'column',
            opacity: vehicle.status === 'inactive' ? 0.5 : 1, transition: 'all 0.3s ease',
            filter: vehicle.status === 'inactive' ? 'grayscale(100%)' : 'none',
            position: 'relative',
            zIndex: menuOpenId === vehicle.id ? 50 : 1
          }}>
            {/* Image container */}
            <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--glass-border)' }}>
              <img src={vehicle.image} alt={vehicle.model} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'} />
              
              {/* Status Badge */}
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(10px)', 
                backgroundColor: vehicle.status === 'active' ? 'rgba(16, 185, 129, 0.8)' : vehicle.status === 'in_service' ? 'rgba(56, 189, 248, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                {vehicle.status === 'active' ? 'Activo' : vehicle.status === 'in_service' ? 'En Taller' : 'Inactivo'}
              </div>

              {/* Condition Badge */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(10px)', 
                backgroundColor: 'rgba(20, 25, 40, 0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                {vehicle.condition}
              </div>
            </div>
            
            {/* Info */}
            <div style={{ padding: '1.5rem', position: 'relative' }}>
              
              {/* Actions Dropdown */}
              <div style={{ position: 'absolute', top: '1.5rem', right: '1rem' }}>
                <button 
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation(); 
                    e.nativeEvent.stopImmediatePropagation();
                    setMenuOpenId(menuOpenId === vehicle.id ? null : vehicle.id); 
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                </button>

                {menuOpenId === vehicle.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: '100%', right: '0', width: '160px', marginTop: '0.5rem',
                      background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                      borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 10,
                      overflow: 'hidden', animation: 'scaleIn 0.2s ease'
                    }}
                  >
                    <button 
                      onClick={() => handleToggleStatus(vehicle.id)}
                      style={{
                        width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'transparent', border: 'none',
                        color: vehicle.status !== 'inactive' ? '#ef4444' : '#10b981', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem'
                      }}
                      onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'} 
                      onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}
                    >
                      {vehicle.status !== 'inactive' ? 'Desactivar Auto' : 'Activar Auto'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingRight: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.2rem 0', textDecoration: vehicle.status === 'inactive' ? 'line-through' : 'none' }}>{vehicle.brand} {vehicle.model}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Año: {vehicle.year}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent-light)', letterSpacing: '1px' }}>
                  {vehicle.plates}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.65rem' }}>
                    {vehicle.client.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{vehicle.client}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredVehicles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No se encontraron vehículos.
          </div>
        )}
      </div>

      {/* Modern Light Modal Crear Vehículo */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px', width: '90%', maxWidth: '850px', minHeight: '500px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
            overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', position: 'relative'
          }}>
            
            {/* Left side panel (Light Blue) */}
            <div style={{
              width: '35%', background: '#eef8ff',
              padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#cce9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#0284c7' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Registrar Vehículo</h2>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Agrega un nuevo automóvil al directorio para que pueda recibir servicios en nuestros talleres.
              </p>
            </div>

            {/* Right side Form */}
            <div style={{ flex: 1, padding: '3rem', position: 'relative' }}>
              
              {/* Close Button */}
              <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Marca</label>
                    <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={{
                      width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: '#f8fafc',
                      border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.95rem'
                    }} onFocus={e=>e.currentTarget.style.borderColor='#0284c7'} onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Modelo</label>
                    <input required type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} style={{
                      width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: '#f8fafc',
                      border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.95rem'
                    }} onFocus={e=>e.currentTarget.style.borderColor='#0284c7'} onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Año</label>
                    <input required type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} style={{
                      width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: '#f8fafc',
                      border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.95rem'
                    }} onFocus={e=>e.currentTarget.style.borderColor='#0284c7'} onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Condición</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as 'Nuevo' | 'Usado'})} style={{
                      width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: '#f8fafc',
                      border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', appearance: 'none', fontSize: '0.95rem'
                    }}>
                      <option value="Usado">Usado</option>
                      <option value="Nuevo">Nuevo</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Placas</label>
                  <input required type="text" value={formData.plates} onChange={e => setFormData({...formData, plates: e.target.value})} style={{
                    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.95rem'
                  }} onFocus={e=>e.currentTarget.style.borderColor='#0284c7'} onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'} />
                </div>
                
                <div style={{ marginBottom: '3rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Cliente (Propietario)</label>
                  <input required type="text" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} style={{
                    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.95rem'
                  }} onFocus={e=>e.currentTarget.style.borderColor='#0284c7'} onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'} />
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginTop: 'auto', alignItems: 'center', justifyContent: 'center' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{
                    background: 'transparent', border: 'none', color: '#0f172a', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', flex: 1
                  }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{
                    flex: 1, padding: '0.9rem', borderRadius: '12px', border: 'none',
                    background: '#0ea5e9',
                    color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
                    transition: 'background-color 0.2s'
                  }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#0284c7'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#0ea5e9'}>
                    Guardar Vehículo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
