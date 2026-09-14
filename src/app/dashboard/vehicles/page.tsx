/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { safeFetch } from '../../../lib/api-config';
import { 
  CarFront, 
  Plus, 
  Search, 
  Calendar, 
  Gauge, 
  FileText, 
  Camera, 
  Trash2, 
  Wrench, 
  Eye, 
  X, 
  User, 
  Hash, 
  Sparkles, 
  CalendarRange,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface VehicleOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  location?: string;
}

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage?: number;
  plates?: string;
  vin?: string;
  color?: string;
  lastMaintenanceDate?: string;
  lastMaintenanceMileage?: number;
  notes?: string;
  photos?: string[];
  userId: string;
  user?: VehicleOwner;
  createdAt: string;
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const isClient = user?.roles?.some(r => r.role?.name === 'Cliente') ?? false;

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State for Register / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plates: '',
    mileage: '',
    vin: '',
    color: '',
    lastMaintenanceDate: '',
    lastMaintenanceMileage: '',
    notes: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);

  // Modal State for Technical Dossier (Vista Completa para el Técnico)
  const [selectedVehicleForDossier, setSelectedVehicleForDossier] = useState<VehicleData | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    const endpoint = isClient && user?.id ? `/vehicles?userId=${user.id}` : '/vehicles';
    const { ok, data } = await safeFetch<VehicleData[]>(endpoint);
    if (ok && Array.isArray(data)) {
      setVehicles(data);
    } else {
      setVehicles([]);
    }
    setIsLoading(false);
  }, [isClient, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchVehicles();
    }
  }, [user?.id, fetchVehicles]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOpenCreateModal = () => {
    setEditingVehicleId(null);
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plates: '',
      mileage: '',
      vin: '',
      color: '',
      lastMaintenanceDate: '',
      lastMaintenanceMileage: '',
      notes: '',
    });
    setPhotos([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: VehicleData) => {
    setEditingVehicleId(v.id);
    setFormData({
      brand: v.brand,
      model: v.model,
      year: v.year,
      plates: v.plates || '',
      mileage: v.mileage ? String(v.mileage) : '',
      vin: v.vin || '',
      color: v.color || '',
      lastMaintenanceDate: v.lastMaintenanceDate ? v.lastMaintenanceDate.split('T')[0] : '',
      lastMaintenanceMileage: v.lastMaintenanceMileage ? String(v.lastMaintenanceMileage) : '',
      notes: v.notes || '',
    });
    setPhotos(Array.isArray(v.photos) ? (v.photos as string[]) : []);
    setIsModalOpen(true);
  };

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model) {
      showToast('Marca y modelo son obligatorios', 'error');
      return;
    }

    if (!user?.id) {
      showToast('Error de autenticación', 'error');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: Number(formData.year) || new Date().getFullYear(),
      plates: formData.plates.trim() || undefined,
      mileage: formData.mileage ? Number(formData.mileage) : undefined,
      vin: formData.vin.trim() || undefined,
      color: formData.color.trim() || undefined,
      lastMaintenanceDate: formData.lastMaintenanceDate || undefined,
      lastMaintenanceMileage: formData.lastMaintenanceMileage ? Number(formData.lastMaintenanceMileage) : undefined,
      notes: formData.notes.trim() || undefined,
      photos: photos,
      userId: user.id
    };

    if (editingVehicleId) {
      const { ok, error } = await safeFetch(`/vehicles/${editingVehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (ok) {
        showToast('Vehículo actualizado exitosamente ✨');
        setIsModalOpen(false);
        fetchVehicles();
      } else {
        showToast(error || 'Error al actualizar vehículo', 'error');
      }
    } else {
      const { ok, error } = await safeFetch('/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (ok) {
        showToast('¡Vehículo registrado con éxito! 🚗✨');
        setIsModalOpen(false);
        fetchVehicles();
      } else {
        showToast(error || 'Error al registrar vehículo', 'error');
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteVehicle = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el vehículo ${name}?`)) return;
    const { ok, error } = await safeFetch(`/vehicles/${id}`, { method: 'DELETE' });
    if (ok) {
      showToast('Vehículo eliminado');
      fetchVehicles();
    } else {
      showToast(error || 'Error al eliminar vehículo', 'error');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchesBrand = v.brand.toLowerCase().includes(term);
    const matchesModel = v.model.toLowerCase().includes(term);
    const matchesPlates = v.plates?.toLowerCase().includes(term) ?? false;
    const matchesClient = v.user ? `${v.user.firstName} ${v.user.lastName}`.toLowerCase().includes(term) : false;
    return matchesBrand || matchesModel || matchesPlates || matchesClient;
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 99999,
          padding: '12px 20px', borderRadius: '14px',
          background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff', fontWeight: 700, fontSize: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(2, 132, 199, 0.14)', color: '#0284c7' }}>
              {isClient ? 'Portal Personalizado' : 'Gestión Técnica Integral'}
            </span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
            {isClient ? 'Mis' : 'Directorio de'} <span style={{ color: '#0284c7' }}>Vehículos</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', maxWidth: '650px' }}>
            {isClient 
              ? 'Registra tus automóviles, placas, kilometraje, fecha del último mantenimiento y sube fotografías para que nuestros técnicos te atiendan con total precisión.'
              : 'Dossiers técnicos con fotografías de estado, kilometraje, placas y fechas de mantenimiento provistas por los clientes.'}
          </p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          style={{ 
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', border: 'none', color: '#fff', 
            padding: '0.85rem 1.6rem', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700, 
            cursor: 'pointer', boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', gap: '0.6rem',
            transition: 'all 0.2s'
          }}
        >
          <Plus size={18} />
          <span>{isClient ? 'Dar de Alta Mi Auto' : 'Registrar Vehículo'}</span>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder={isClient ? "Buscar por marca, modelo o placas..." : "Buscar por cliente, marca, modelo o placas..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '10px', 
              border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', 
              color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
            }}
          />
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
          {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehículo' : 'vehículos'}
        </div>
      </div>

      {/* Vehicles Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #0ea5e9', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p>Cargando vehículos registrados...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
          <CarFront size={48} style={{ color: '#0284c7', margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {isClient ? 'Aún no has registrado ningún automóvil' : 'No se encontraron vehículos'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 24px', fontSize: '14px' }}>
            {isClient 
              ? 'Da de alta tu vehículo para que los mecánicos conozcan su historial, fotos y fecha de último mantenimiento al agendar servicios.'
              : 'No hay vehículos registrados que coincidan con los criterios de búsqueda.'}
          </p>
          {isClient && (
            <button 
              onClick={handleOpenCreateModal}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', border: 'none', color: '#fff',
                padding: '0.8rem 1.6rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              + Dar de Alta Mi Primer Auto
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredVehicles.map(vehicle => {
            const hasPhotos = Array.isArray(vehicle.photos) && vehicle.photos.length > 0;
            const coverImage = hasPhotos ? vehicle.photos![0] : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop';
            const photoCount = hasPhotos ? vehicle.photos!.length : 0;

            return (
              <div 
                key={vehicle.id} 
                className="glass-card" 
                style={{ 
                  padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  borderRadius: '20px', transition: 'all 0.3s ease', position: 'relative'
                }}
              >
                {/* Photo Header */}
                <div style={{ height: '210px', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <img 
                    src={coverImage} 
                    alt={`${vehicle.brand} ${vehicle.model}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} 
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} 
                  />

                  {/* Gradient Overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />

                  {/* Plates Badge */}
                  <div style={{
                    position: 'absolute', top: '12px', left: '12px',
                    backgroundColor: '#ffffff', color: '#0f172a',
                    padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                    letterSpacing: '1.5px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '1.5px solid #0284c7', display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                    <Hash size={13} style={{ color: '#0284c7' }} />
                    <span>{vehicle.plates || 'SIN PLACAS'}</span>
                  </div>

                  {/* Photo Counter Badge */}
                  {photoCount > 0 && (
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
                      color: '#ffffff', padding: '4px 9px', borderRadius: '9999px',
                      fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <Camera size={13} style={{ color: '#38bdf8' }} />
                      <span>{photoCount} {photoCount === 1 ? 'foto' : 'fotos'}</span>
                    </div>
                  )}

                  {/* Year badge */}
                  <div style={{
                    position: 'absolute', bottom: '12px', left: '14px',
                    color: '#ffffff', fontSize: '1.25rem', fontWeight: 800
                  }}>
                    {vehicle.brand} {vehicle.model} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#38bdf8' }}>({vehicle.year})</span>
                  </div>
                </div>

                {/* Card Details Body */}
                <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Owner (Visible to technicians/admins) */}
                  {!isClient && vehicle.user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>
                      <User size={14} style={{ color: '#0284c7' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cliente:</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{vehicle.user.firstName} {vehicle.user.lastName}</span>
                    </div>
                  )}

                  {/* Technical Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0284c7', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                        <Gauge size={13} />
                        <span>Kilometraje</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                        {vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} km` : 'No registrado'}
                      </span>
                    </div>

                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                        <Calendar size={13} />
                        <span>Últ. Mantenimiento</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'block' }}>
                        {vehicle.lastMaintenanceDate 
                          ? new Date(vehicle.lastMaintenanceDate).toLocaleDateString()
                          : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Technical Notes snippet */}
                  {vehicle.notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '8px 10px', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <FileText size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {vehicle.notes}
                      </span>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    
                    {/* View Dossier Button (Full view for technician & client) */}
                    <button
                      onClick={() => {
                        setSelectedVehicleForDossier(vehicle);
                        setActivePhotoIndex(0);
                      }}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: '10px',
                        background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)',
                        color: '#0284c7', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <Eye size={14} />
                      <span>{isClient ? 'Ver Mi Auto' : 'Expediente Técnico'}</span>
                    </button>

                    {/* Book service CTA for client */}
                    {isClient && (
                      <Link
                        href="/dashboard/bookings"
                        style={{
                          padding: '8px 12px', borderRadius: '10px', textDecoration: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff', fontWeight: 700, fontSize: '12px',
                          display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        <CalendarRange size={14} />
                        <span>Agendar</span>
                      </Link>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditModal(vehicle)}
                      title="Editar vehículo"
                      style={{
                        padding: '8px', borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Wrench size={14} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id, `${vehicle.brand} ${vehicle.model}`)}
                      title="Eliminar vehículo"
                      style={{
                        padding: '8px', borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTRAR / EDITAR VEHÍCULO CON FOTOS (CLIENTE & TÉCNICO)       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: '20px'
        }}>
          <div className="glass-card" style={{
            background: 'var(--bg-primary)', borderRadius: '24px', width: '100%', maxWidth: '820px',
            maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border)',
            padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', position: 'relative'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles size={18} style={{ color: '#0284c7' }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                    {editingVehicleId ? 'Actualización de Datos' : 'Registro de Automóvil'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {editingVehicleId ? 'Editar Información del Vehículo' : 'Dar de Alta Automóvil'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitVehicle}>
              
              {/* Row 1: Brand, Model, Year */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Marca *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Ford, Toyota, BMW"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Modelo *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Mustang GT, Corolla, X5"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Año *
                  </label>
                  <input
                    required
                    type="number"
                    min="1960"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Plates, Mileage, Color */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Placas de Circulación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. JX-45-89"
                    value={formData.plates}
                    onChange={e => setFormData({ ...formData, plates: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px', letterSpacing: '1px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Kilometraje Actual
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 45000"
                    value={formData.mileage}
                    onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Gris Platino, Azul Eléctrico"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Maintenance History Details */}
              <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(2, 132, 199, 0.06)', border: '1px solid rgba(2, 132, 199, 0.2)', marginBottom: '18px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={16} />
                  <span>Historial de Mantenimiento Preventivo / Correctivo</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Fecha del Último Mantenimiento
                    </label>
                    <input
                      type="date"
                      value={formData.lastMaintenanceDate}
                      onChange={e => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)', outline: 'none', fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Kilometraje en el Último Mantenimiento
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 38000"
                      value={formData.lastMaintenanceMileage}
                      onChange={e => setFormData({ ...formData, lastMaintenanceMileage: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)', outline: 'none', fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Notas y Observaciones para el Técnico (Fallas previas, ruido, refacciones pendientes)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Cambio de balatas delanteras hace 6 meses. Ruidos al pasar baches del lado derecho."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '13px', resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Row 4: PHOTO UPLOAD SECTION (Subida de Fotografías) */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={16} style={{ color: '#0284c7' }} />
                    <span>Fotografías del Vehículo (Estado general, tablero, golpes, motor)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', border: '1px solid #0284c7',
                      background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', fontWeight: 700,
                      fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Subir Fotos</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </div>

                {photos.length === 0 ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '30px', borderRadius: '14px', border: '2px dashed var(--glass-border)',
                      textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.02)',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <Camera size={32} style={{ color: 'var(--text-secondary)', margin: '0 auto 8px', opacity: 0.6 }} />
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Haz clic para subir fotografías de tu auto desde tu dispositivo
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Formatos soportados: JPG, PNG, WEBP. Los mecánicos podrán inspeccionarlas en su expediente.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                    {photos.map((photoUrl, index) => (
                      <div key={index} style={{ height: '90px', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid var(--glass-border)' }}>
                        <img src={photoUrl} alt={`Foto ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          style={{
                            position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px',
                            borderRadius: '50%', background: 'rgba(239, 68, 68, 0.9)', border: 'none',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        height: '90px', borderRadius: '10px', border: '2px dashed var(--glass-border)',
                        background: 'transparent', color: '#0284c7', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      <Plus size={20} />
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>Añadir más</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                    background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {isSubmitting ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{editingVehicleId ? 'Actualizar Vehículo' : 'Guardar y Dar de Alta'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VISTA COMPLETA PARA EL TÉCNICO / EXPEDIENTE TÉCNICO CON GALERÍA */}
      {/* ========================================================================= */}
      {selectedVehicleForDossier && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: '20px'
        }}>
          <div className="glass-card" style={{
            background: 'var(--bg-primary)', borderRadius: '24px', width: '100%', maxWidth: '960px',
            maxHeight: '92vh', overflowY: 'auto', border: '1px solid var(--glass-border)',
            padding: '32px', boxShadow: '0 30px 70px rgba(0,0,0,0.7)', position: 'relative'
          }}>
            
            {/* Dossier Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 10px', borderRadius: '9999px', textTransform: 'uppercase' }}>
                  Expediente Técnico Completo
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--text-primary)' }}>
                  {selectedVehicleForDossier.brand} {selectedVehicleForDossier.model} <span style={{ color: '#0284c7' }}>({selectedVehicleForDossier.year})</span>
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Placas: <b style={{ color: 'var(--text-primary)' }}>{selectedVehicleForDossier.plates || 'No especificadas'}</b>
                  {selectedVehicleForDossier.user && ` • Propietario: ${selectedVehicleForDossier.user.firstName} ${selectedVehicleForDossier.user.lastName} (${selectedVehicleForDossier.user.email})`}
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicleForDossier(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Dossier Photo Gallery Viewer */}
            {Array.isArray(selectedVehicleForDossier.photos) && selectedVehicleForDossier.photos.length > 0 ? (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ height: '360px', width: '100%', borderRadius: '18px', overflow: 'hidden', backgroundColor: '#000', position: 'relative', border: '1px solid var(--glass-border)' }}>
                  <img 
                    src={selectedVehicleForDossier.photos[activePhotoIndex]} 
                    alt="Foto del auto"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                    Foto {activePhotoIndex + 1} de {selectedVehicleForDossier.photos.length}
                  </div>
                </div>

                {/* Thumbnails */}
                {selectedVehicleForDossier.photos.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {selectedVehicleForDossier.photos.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        style={{
                          width: '70px', height: '50px', borderRadius: '8px', overflow: 'hidden',
                          border: activePhotoIndex === idx ? '2.5px solid #0284c7' : '1px solid var(--glass-border)',
                          padding: 0, cursor: 'pointer', flexShrink: 0, opacity: activePhotoIndex === idx ? 1 : 0.6
                        }}
                      >
                        <img src={url} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                <Camera size={36} style={{ color: 'var(--text-secondary)', margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>El cliente aún no ha subido fotografías de este vehículo.</p>
              </div>
            )}

            {/* Dossier Technical Details Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Kilometraje Actual</span>
                <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedVehicleForDossier.mileage ? `${Number(selectedVehicleForDossier.mileage).toLocaleString()} km` : 'No registrado'}
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Último Mantenimiento</span>
                <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
                  {selectedVehicleForDossier.lastMaintenanceDate ? new Date(selectedVehicleForDossier.lastMaintenanceDate).toLocaleDateString() : 'Sin registro previo'}
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Kilometraje de Últ. Servicio</span>
                <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedVehicleForDossier.lastMaintenanceMileage ? `${Number(selectedVehicleForDossier.lastMaintenanceMileage).toLocaleString()} km` : 'N/A'}
                </p>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Color de Carrocería</span>
                <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedVehicleForDossier.color || 'No especificado'}
                </p>
              </div>
            </div>

            {/* Client Notes for the Mechanic */}
            {selectedVehicleForDossier.notes && (
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} />
                  <span>Observaciones Técnicas Registradas por el Propietario</span>
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedVehicleForDossier.notes}
                </p>
              </div>
            )}

            {/* Modal Dossier Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedVehicleForDossier(null)}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                }}
              >
                Cerrar Expediente
              </button>
              <Link
                href="/dashboard/bookings"
                style={{
                  padding: '10px 20px', borderRadius: '10px', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  color: '#ffffff', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <CalendarRange size={15} />
                <span>Gestionar Solicitud de Cita</span>
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
