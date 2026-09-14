'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { safeFetch } from '../../../lib/api-config';
import { useAuth } from '../../../lib/auth-context';
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  Car,
  User,
  Calendar as CalendarIcon,
  FileText,
  Search,
  Trash2,
  RefreshCw,
  ExternalLink,
  Navigation,
  Plus,
  X,
  CarFront
} from 'lucide-react';
import Link from 'next/link';

interface BookingRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicle: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  serviceType: string;
  address: string;
  date: string;
  notes?: string;
  status: 'PENDING' | 'ATTENDED' | 'CANCELLED';
  attendedBy?: string;
  attendedAt?: string;
  createdAt: string;
}

interface ClientVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plates?: string;
  lastMaintenanceDate?: string;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const isClient = user?.roles?.some(r => r.role?.name === 'Cliente') ?? false;

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [clientVehicles, setClientVehicles] = useState<ClientVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ATTENDED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const prevCountRef = useRef<number | null>(null);

  // New Booking Modal State (for Client)
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [newBookingData, setNewBookingData] = useState({
    vehicleId: '',
    serviceType: 'Mantenimiento Preventivo Integral',
    date: '',
    time: '10:00',
    address: '',
    phone: '',
    notes: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchClientVehicles = useCallback(async () => {
    if (!user?.id) return;
    const { ok, data } = await safeFetch<ClientVehicle[]>(`/vehicles?userId=${user.id}`);
    if (ok && Array.isArray(data)) {
      setClientVehicles(data);
      if (data.length > 0) {
        setNewBookingData(prev => ({ ...prev, vehicleId: prev.vehicleId || data[0].id }));
      }
    }
  }, [user?.id]);

  const fetchBookings = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    const { ok, data } = await safeFetch<BookingRequest[]>('/booking-requests');
    if (ok && Array.isArray(data)) {
      if (prevCountRef.current !== null && data.length > prevCountRef.current && !isClient) {
        showToast('🎉 ¡Nueva solicitud de cita a domicilio recibida en tiempo real! ✨', 'success');
      }
      prevCountRef.current = data.length;
      setBookings(data);
    }
    if (showLoading) setIsLoading(false);
  }, [isClient]);

  useEffect(() => {
    fetchBookings(true);
    if (isClient && user?.id) {
      fetchClientVehicles();
    }
    // Real-time polling every 6 seconds
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [isClient, user?.id, fetchBookings, fetchClientVehicles]);

  const handleMarkAsAttended = async (id: string) => {
    const { ok } = await safeFetch(`/booking-requests/${id}/attend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName: `${user?.firstName || 'Técnico'} AURA` }),
    });

    if (ok) {
      showToast('Solicitud marcada como ATENDIDA ✨');
      fetchBookings(false);
    } else {
      showToast('Error al actualizar estatus de la solicitud', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud de cita?')) return;
    const { ok } = await safeFetch(`/booking-requests/${id}`, { method: 'DELETE' });
    if (ok) {
      showToast('Solicitud eliminada');
      fetchBookings(false);
    } else {
      showToast('Error al eliminar la solicitud', 'error');
    }
  };

  const handleCreateClientBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingData.date || !newBookingData.address) {
      showToast('Por favor completa la fecha y la dirección de atención', 'error');
      return;
    }

    const selectedCar = clientVehicles.find(v => v.id === newBookingData.vehicleId);
    const vehicleText = selectedCar
      ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.year}) - Placas: ${selectedCar.plates || 'S/P'}`
      : 'Vehículo Cliente';

    setIsSubmittingBooking(true);
    const payload = {
      clientName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Cliente Registrado',
      clientPhone: newBookingData.phone || '555-000-0000',
      vehicle: vehicleText,
      vehicleBrand: selectedCar?.brand,
      vehicleModel: selectedCar?.model,
      vehicleYear: selectedCar ? String(selectedCar.year) : undefined,
      serviceType: newBookingData.serviceType,
      address: newBookingData.address,
      date: `${newBookingData.date} ${newBookingData.time || '10:00'}`,
      notes: newBookingData.notes || undefined,
    };

    const { ok, error } = await safeFetch('/booking-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (ok) {
      showToast('¡Tu cita ha sido agendada con éxito! Un técnico se pondrá en contacto pronto 🚗✨');
      setIsNewBookingModalOpen(false);
      fetchBookings(false);
    } else {
      showToast(error || 'Error al agendar la cita', 'error');
    }
    setIsSubmittingBooking(false);
  };

  // Calculate 24-hour urgency check
  const isOverdue = (createdAt: string, status: string) => {
    if (status !== 'PENDING') return false;
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  const filteredBookings = bookings.filter((b) => {
    // If client, restrict to their own bookings
    if (isClient && user) {
      const clientName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesClient = b.clientName.toLowerCase().includes(user.firstName.toLowerCase()) ||
        b.clientName.toLowerCase().includes(clientName);
      if (!matchesClient) return false;
    }

    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      b.clientName.toLowerCase().includes(searchLower) ||
      b.clientPhone.toLowerCase().includes(searchLower) ||
      b.vehicle.toLowerCase().includes(searchLower) ||
      b.serviceType.toLowerCase().includes(searchLower) ||
      b.address.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const totalCount = filteredBookings.length;
  const pendingCount = filteredBookings.filter((b) => b.status === 'PENDING').length;
  const attendedCount = filteredBookings.filter((b) => b.status === 'ATTENDED').length;
  const overdueCount = filteredBookings.filter((b) => isOverdue(b.createdAt, b.status)).length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        @keyframes pulse-live {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: toastMessage.type === 'success' ? '#059669' : '#dc2626',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.6rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8' }}>
              <CalendarRange size={24} />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isClient ? 'Mis Citas y Servicios de Mantenimiento' : 'Solicitudes de Citas a Domicilio'}
            </h1>
            {!isClient && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  display: 'inline-block',
                  animation: 'pulse-live 1.5s infinite ease-in-out'
                }} />
                EN VIVO (Tiempo Real)
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            {isClient
              ? 'Consulta el estado de tus citas programadas y agenda nuevos servicios a domicilio para tus automóviles.'
              : 'Panel de control y mapas en vivo para atender las visitas técnicas programadas desde la página pública.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isClient && (
            <button
              onClick={() => setIsNewBookingModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.4rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)'
              }}
            >
              <Plus size={18} />
              <span>Agendar Nueva Cita</span>
            </button>
          )}

          <button
            onClick={() => fetchBookings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert Banner */}
      {overdueCount > 0 && (
        <div style={{
          backgroundColor: 'rgba(220, 38, 38, 0.12)',
          border: '1px solid rgba(220, 38, 38, 0.4)',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: '#f87171'
        }}>
          <AlertTriangle size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: '0 0 0.25rem', fontWeight: 800, color: '#f87171', fontSize: '1.05rem' }}>
              🚨 Atención Requerida: {overdueCount} {overdueCount === 1 ? 'Solicitud pendiente' : 'Solicitudes pendientes'} hace más de 24 horas
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#fca5a5' }}>
              Por políticas de servicio al cliente de AURA, las citas agendadas deben ser atendidas y confirmadas en un máximo de 1 día.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Solicitudes</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{totalCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
          <span style={{ fontSize: '0.85rem', color: '#eab308', fontWeight: 600 }}>Pendientes por Atender</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#eab308', marginTop: '0.25rem' }}>{pendingCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Atendidas Exitosamente</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{attendedCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>🚨 +24 Horas sin Atender</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>{overdueCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['ALL', 'PENDING', 'ATTENDED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                backgroundColor: filterStatus === st ? 'var(--color-accent)' : 'transparent',
                color: filterStatus === st ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {st === 'ALL' ? 'Todas' : st === 'PENDING' ? 'Pendientes' : 'Atendidas'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, auto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.6rem !important'
            }}
          />
        </div>
      </div>

      {/* Bookings List Cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Cargando solicitudes de citas a domicilio...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CalendarRange size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <h3>No se encontraron solicitudes registradas</h3>
          <p>Las solicitudes de citas agendadas por los clientes aparecerán aquí en tiempo real.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredBookings.map((booking) => {
            const overdue = isOverdue(booking.createdAt, booking.status);
            const mapQuery = booking.address.trim();
            const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
            const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(mapQuery)}&navigate=yes`;

            return (
              <div
                key={booking.id}
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  borderRadius: '24px',
                  border: overdue ? '2px solid rgba(239, 68, 68, 0.6)' : '1px solid var(--glass-border)',
                  backgroundColor: overdue ? 'rgba(239, 68, 68, 0.04)' : 'var(--glass-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                {/* Status Badges Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {booking.status === 'ATTENDED' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                        <CheckCircle2 size={16} /> ATENDIDO
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '10px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308', fontWeight: 700, fontSize: '0.85rem' }}>
                        <Clock size={16} /> PENDIENTE DE ATENCIÓN
                      </span>
                    )}

                    {overdue && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '10px', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>
                        <AlertTriangle size={16} /> URGENTE (+24H SIN ATENDER)
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Recibido: {new Date(booking.createdAt).toLocaleString('es-MX')}
                  </span>
                </div>

                {/* Client Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>

                  {/* Client Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <User size={14} /> Cliente
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{booking.clientName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', marginTop: '0.25rem', fontWeight: 600, fontSize: '0.95rem' }}>
                      <Phone size={15} /> <a href={`tel:${booking.clientPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{booking.clientPhone}</a>
                    </div>
                  </div>

                  {/* Vehicle & Service */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <Car size={14} /> Vehículo y Servicio
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {booking.vehicleBrand || booking.vehicleModel ? (
                        <span>
                          <span style={{ color: '#38bdf8' }}>{booking.vehicleBrand}</span> {booking.vehicleModel} <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>({booking.vehicleYear})</span>
                        </span>
                      ) : (
                        booking.vehicle
                      )}
                    </div>
                    <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>{booking.serviceType}</div>
                  </div>

                  {/* Date scheduled */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <CalendarIcon size={14} /> Fecha Solicitada
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{booking.date}</div>
                  </div>

                </div>

                {/* Location / Interactive Map Section */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 800 }}>
                      <MapPin size={18} /> Ubicación Exacta del Cliente:
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(2, 132, 199, 0.15)',
                          color: '#38bdf8',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          border: '1px solid rgba(56, 189, 248, 0.3)'
                        }}
                      >
                        <ExternalLink size={13} /> Google Maps
                      </a>
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          border: '1px solid rgba(96, 165, 250, 0.3)'
                        }}
                      >
                        <Navigation size={13} /> Waze
                      </a>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                    {booking.address}
                  </div>

                  {/* Embedded Interactive Map */}
                  <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                    <iframe
                      title={`Ubicación de ${booking.clientName}`}
                      width="100%"
                      height="240"
                      style={{ border: 0, display: 'block' }}
                      loading="lazy"
                      allowFullScreen
                      src={mapEmbedUrl}
                    />
                  </div>
                </div>

                {/* Notes if present */}
                {booking.notes && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <FileText size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Notas del Cliente:</strong> {booking.notes}</span>
                  </div>
                )}

                {/* Attended info if completed */}
                {booking.status === 'ATTENDED' && booking.attendedBy && (
                  <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                    ✓ Solicitud atendida por {booking.attendedBy} el {booking.attendedAt ? new Date(booking.attendedAt).toLocaleString('es-MX') : ''}
                  </div>
                )}

                {/* Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => handleMarkAsAttended(booking.id)}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '12px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <CheckCircle2 size={16} /> Marcar como Atendido
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(booking.id)}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: AGENDAR CITA PARA CLIENTE */}
      {isNewBookingModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: '20px'
        }}>
          <div className="glass-card" style={{
            background: 'var(--bg-primary)', borderRadius: '24px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border)',
            padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarRange size={22} style={{ color: '#0284c7' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Agendar Cita de Mantenimiento
                </h3>
              </div>
              <button
                onClick={() => setIsNewBookingModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {clientVehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <CarFront size={44} style={{ color: '#0284c7', margin: '0 auto 12px', opacity: 0.8 }} />
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Aún no tienes ningún vehículo registrado
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Para programar una cita técnica, primero debes dar de alta tu automóvil con sus placas y datos.
                </p>
                <Link
                  href="/dashboard/vehicles"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 20px', borderRadius: '12px', textDecoration: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    color: '#ffffff', fontWeight: 700, fontSize: '13px'
                  }}
                >
                  <Plus size={16} />
                  <span>Ir a Mis Vehículos y Registrar Auto</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateClientBooking}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Selecciona tu Vehículo *
                  </label>
                  <select
                    required
                    value={newBookingData.vehicleId}
                    onChange={e => setNewBookingData({ ...newBookingData, vehicleId: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                    }}
                  >
                    {clientVehicles.map(v => (
                      <option key={v.id} value={v.id} style={{ background: '#0f172a', color: '#fff' }}>
                        {v.brand} {v.model} ({v.year}) {v.plates ? `• Placas: ${v.plates}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Tipo de Servicio Requerido *
                  </label>
                  <select
                    value={newBookingData.serviceType}
                    onChange={e => setNewBookingData({ ...newBookingData, serviceType: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                    }}
                  >
                    <option value="Mantenimiento Preventivo Integral" style={{ background: '#0f172a', color: '#fff' }}>Mantenimiento Preventivo Integral</option>
                    <option value="Revisión de Frenos y Balatas" style={{ background: '#0f172a', color: '#fff' }}>Revisión de Frenos y Balatas</option>
                    <option value="Afinación Mayor y Cambio de Aceite" style={{ background: '#0f172a', color: '#fff' }}>Afinación Mayor y Cambio de Aceite</option>
                    <option value="Diagnóstico por Escáner OBD2" style={{ background: '#0f172a', color: '#fff' }}>Diagnóstico por Escáner OBD2</option>
                    <option value="Suspensión, Dirección y Amortiguadores" style={{ background: '#0f172a', color: '#fff' }}>Suspensión, Dirección y Amortiguadores</option>
                    <option value="Revisión General Previa a Viaje" style={{ background: '#0f172a', color: '#fff' }}>Revisión General Previa a Viaje</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Fecha Preferida *
                    </label>
                    <input
                      required
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newBookingData.date}
                      onChange={e => setNewBookingData({ ...newBookingData, date: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Hora Preferida
                    </label>
                    <input
                      type="time"
                      value={newBookingData.time}
                      onChange={e => setNewBookingData({ ...newBookingData, time: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Dirección para la Visita *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Calle, número, colonia"
                      value={newBookingData.address}
                      onChange={e => setNewBookingData({ ...newBookingData, address: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 55-1234-5678"
                      value={newBookingData.phone}
                      onChange={e => setNewBookingData({ ...newBookingData, phone: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Notas para el Técnico (Fallas, ruidos o detalles específicos)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe los síntomas que presenta tu vehículo para que el técnico lleve las herramientas adecuadas..."
                    value={newBookingData.notes}
                    onChange={e => setNewBookingData({ ...newBookingData, notes: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', outline: 'none', fontSize: '13px', resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsNewBookingModalOpen(false)}
                    style={{
                      padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                      background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    style={{
                      padding: '10px 22px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                      color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: isSubmittingBooking ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    {isSubmittingBooking ? 'Agendando...' : 'Confirmar Cita'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
