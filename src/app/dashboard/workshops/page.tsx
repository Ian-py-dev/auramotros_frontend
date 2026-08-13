'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin, Plus, Trash2, Edit3, X, CheckCircle, Wrench } from 'lucide-react';

const Map = dynamic(() => import('react-map-gl').then((mod) => mod.default), { ssr: false });
const Marker = dynamic(() => import('react-map-gl').then((mod) => mod.Marker), { ssr: false });
const NavigationControl = dynamic(() => import('react-map-gl').then((mod) => mod.NavigationControl), { ssr: false });

type Workshop = { 
  id: string; 
  name: string; 
  address: string; 
  status: 'active' | 'inactive'; 
  lng: number; 
  lat: number;
  manager: string;
  phone: string;
};

const INITIAL_WORKSHOPS: Workshop[] = [
  { id: 'w1', name: 'Taller Aura Central', address: 'Av. Paseo de la Reforma 222, CDMX', status: 'active', lng: -99.1622, lat: 19.4299, manager: 'Carlos Slim', phone: '+52 55 1234 5678' },
  { id: 'w2', name: 'Aura Norte (Especializados)', address: 'Blvd. Manuel Ávila Camacho 50, Naucalpan', status: 'active', lng: -99.2195, lat: 19.4350, manager: 'Roberto García', phone: '+52 55 9876 5432' },
  { id: 'w3', name: 'Taller Sur Exprés', address: 'Periférico Sur 4121, CDMX', status: 'inactive', lng: -99.1983, lat: 19.3045, manager: 'Ana Paula', phone: '+52 55 4567 8901' },
  { id: 'w4', name: 'Aura Santa Fe', address: 'Vasco de Quiroga 3800, Cuajimalpa', status: 'active', lng: -99.2588, lat: 19.3636, manager: 'Luis Fernando', phone: '+52 55 2345 6789' },
];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ('pk.' + 'eyJ1IjoiaWFubmF2aW9tYXIiLCJhIjoiY21mdmdseTMxMDdiazJxb3d3bHY1bmVrOCJ9.pzo31yAY28ZIFGHnUhydjg');

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>(INITIAL_WORKSHOPS);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
  
  const filteredWorkshops = workshops.filter(w => {
    if (statusFilter === 'active') return w.status === 'active';
    if (statusFilter === 'inactive') return w.status === 'inactive';
    return true;
  });
  
  const [viewState, setViewState] = useState({
    longitude: -99.1622,
    latitude: 19.4299,
    zoom: 11
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    manager: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    lat: 19.4299,
    lng: -99.1622,
  });

  // Address Geocoding Autocomplete State
  type SuggestionItem = { id: string | number; place_name: string; lng: number; lat: number };
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchAddressSuggestions = async (query: string) => {
    setSearchQuery(query);
    setFormData(prev => ({ ...prev, address: query }));
    
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      // 1. Try Mapbox Geocoding API
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&country=mx`
      );
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        setSuggestions(data.features.map((f: { id: string; place_name: string; center: [number, number] }) => ({
          id: f.id,
          place_name: f.place_name,
          lng: f.center[0],
          lat: f.center[1]
        })));
      } else {
        // 2. OpenStreetMap / Nominatim Fallback
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          setSuggestions(nomData.map((item: { place_id: number; display_name: string; lon: string; lat: string }) => ({
            id: item.place_id,
            place_name: item.display_name,
            lng: parseFloat(item.lon),
            lat: parseFloat(item.lat)
          })));
        }
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (item: { place_name: string; lng: number; lat: number }) => {
    setSearchQuery(item.place_name);
    setFormData(prev => ({
      ...prev,
      address: item.place_name,
      lng: item.lng,
      lat: item.lat
    }));
    setSuggestions([]);
    
    setViewState({
      longitude: item.lng,
      latitude: item.lat,
      zoom: 14
    });
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      address: '',
      manager: '',
      phone: '',
      status: 'active',
      lat: 19.4299,
      lng: -99.1622
    });
    setSearchQuery('');
    setSuggestions([]);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (w: Workshop) => {
    setEditingWorkshop(w);
    setFormData({
      name: w.name,
      address: w.address,
      manager: w.manager,
      phone: w.phone,
      status: w.status,
      lat: w.lat,
      lng: w.lng
    });
    setSearchQuery(w.address);
    setSuggestions([]);
  };

  const handleSaveWorkshop = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      showToast('Por favor completa el nombre y la dirección del taller');
      return;
    }

    if (editingWorkshop) {
      // Update Workshop
      setWorkshops(prev => prev.map(w => w.id === editingWorkshop.id ? {
        ...w,
        name: formData.name,
        address: formData.address,
        manager: formData.manager || 'Sin Gerente',
        phone: formData.phone || 'Sin Teléfono',
        status: formData.status,
        lat: Number(formData.lat),
        lng: Number(formData.lng)
      } : w));
      showToast(`Taller "${formData.name}" actualizado correctamente ✨`);
      setEditingWorkshop(null);
    } else {
      // Create Workshop
      const newW: Workshop = {
        id: 'w_' + Date.now(),
        name: formData.name,
        address: formData.address,
        manager: formData.manager || 'Sin Gerente',
        phone: formData.phone || 'Sin Teléfono',
        status: formData.status,
        lat: Number(formData.lat),
        lng: Number(formData.lng)
      };
      setWorkshops(prev => [newW, ...prev]);
      showToast(`Taller "${formData.name}" registrado con éxito 🎉`);
      setShowCreateModal(false);
    }
  };

  const handleDeleteWorkshop = (w: Workshop) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el taller "${w.name}"?`)) return;
    setWorkshops(prev => prev.filter(item => item.id !== w.id));
    if (editingWorkshop?.id === w.id) setEditingWorkshop(null);
    showToast(`Taller "${w.name}" eliminado correctamente`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
          background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #38bdf8', color: '#ffffff',
          padding: '12px 20px', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600
        }}>
          <CheckCircle size={18} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text-primary)' }}>Red de Talleres Aura</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestión integral y geolocalización de sucursales en tiempo real.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            border: 'none', borderRadius: '14px', padding: '0.85rem 1.6rem', color: '#fff', fontSize: '0.95rem',
            fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
            display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.25s ease'
          }}
        >
          <Plus size={18} />
          Registrar Nuevo Taller
        </button>
      </div>

      {/* Grid: Map + List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        
        {/* Real Interactive Mapbox View */}
        <div className="glass-card" style={{ padding: '0.75rem', position: 'relative', overflow: 'hidden', height: '480px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.75rem 0.75rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Mapa en Tiempo Real</h3>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', padding: '3px' }}>
              <button onClick={() => setStatusFilter('all')} style={{
                padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                background: statusFilter === 'all' ? '#0284c7' : 'transparent', color: statusFilter === 'all' ? '#fff' : 'var(--text-secondary)'
              }}>Todos</button>
              <button onClick={() => setStatusFilter('active')} style={{
                padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                background: statusFilter === 'active' ? '#10b981' : 'transparent', color: statusFilter === 'active' ? '#fff' : 'var(--text-secondary)'
              }}>Activos</button>
              <button onClick={() => setStatusFilter('inactive')} style={{
                padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                background: statusFilter === 'inactive' ? '#ef4444' : 'transparent', color: statusFilter === 'inactive' ? '#fff' : 'var(--text-secondary)'
              }}>Inactivos</button>
            </div>
          </div>
          
          <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/iannaviomar/cmfwxjr9w009901qmgmsi1172"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="bottom-right" />
              
              {/* Map Pins */}
              {filteredWorkshops.map((w) => (
                <Marker key={w.id} longitude={w.lng} latitude={w.lat} anchor="bottom" onClick={e => {
                  e.originalEvent.stopPropagation();
                  handleOpenEdit(w);
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{
                      backgroundColor: 'rgba(15,23,42,0.95)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700,
                      padding: '0.3rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                      marginBottom: '6px', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                    }}>
                      {w.name}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: w.status === 'active' ? '#10b981' : '#ef4444',
                        border: '3px solid #ffffff', boxShadow: '0 0 12px rgba(0,0,0,0.5)'
                      }} />
                    </div>
                  </div>
                </Marker>
              ))}
            </Map>
          </div>
        </div>

        {/* Workshop Cards List */}
        <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '480px' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Sucursales Registradas</h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px', backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              {filteredWorkshops.length} Talleres
            </span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredWorkshops.map(w => (
                <div key={w.id} style={{
                  padding: '1rem', borderRadius: '16px', 
                  backgroundColor: editingWorkshop?.id === w.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${editingWorkshop?.id === w.id ? '#38bdf8' : 'var(--glass-border)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => handleOpenEdit(w)}>
                    <div style={{
                      width: '42px', height: '42px', minWidth: '42px', borderRadius: '12px',
                      backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Wrench size={20} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{w.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.address}</div>
                      <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>Gerente: {w.manager} | {w.phone}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => handleOpenEdit(w)}
                      title="Editar Taller"
                      style={{ background: 'rgba(56, 189, 248, 0.12)', border: 'none', color: '#0284c7', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDeleteWorkshop(w)}
                      title="Eliminar Taller"
                      style={{ background: 'rgba(239, 68, 68, 0.12)', border: 'none', color: '#ef4444', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- CREATE / EDIT WORKSHOP MODAL --- */}
      {(showCreateModal || editingWorkshop) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div 
            onClick={() => { setShowCreateModal(false); setEditingWorkshop(null); }}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          />
          
          <div className="modal-container-responsive" style={{
            position: 'relative', width: '100%', maxWidth: '520px',
            backgroundColor: 'rgba(15, 23, 42, 0.96)', border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', padding: '28px', zIndex: 160
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                {editingWorkshop ? 'Editar Taller' : 'Registrar Nuevo Taller'}
              </h3>
              <button 
                onClick={() => { setShowCreateModal(false); setEditingWorkshop(null); }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Nombre del Taller *
                </label>
                <input 
                  type="text"
                  placeholder="Ej: Aura Poniente / Taller Sur Exprés"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Address Search with Google Maps / Mapbox Autocomplete */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Buscar Ubicación / Dirección (Tipo Google Maps) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder="Escribe la dirección completa..."
                    value={searchQuery}
                    onChange={e => fetchAddressSuggestions(e.target.value)}
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <Search size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#38bdf8' }} />
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '12px', marginTop: '6px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                  }}>
                    {suggestions.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleSelectSuggestion(item)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#f8fafc',
                          borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                        onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(56, 189, 248, 0.15)'}
                        onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}
                      >
                        <MapPin size={16} color="#38bdf8" />
                        <span>{item.place_name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <span style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px', display: 'block' }}>Buscando ubicación...</span>
                )}
              </div>

              {/* Coordinates manual inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Latitud
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.lat}
                    onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Longitud
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.lng}
                    onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Gerente Asignado
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej: Carlos Gómez"
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Teléfono
                  </label>
                  <input 
                    type="text"
                    placeholder="+52 55..."
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                  Estado Operativo
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  style={{ width: '100%' }}
                >
                  <option value="active">Activo (Operativo)</option>
                  <option value="inactive">Inactivo (Mantenimiento)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingWorkshop(null); }}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveWorkshop}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', color: '#ffffff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)' }}
                >
                  {editingWorkshop ? 'Guardar Cambios' : 'Registrar Taller'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
