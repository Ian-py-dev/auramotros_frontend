'use client';

import React, { useState, useEffect, useRef } from 'react';
import { safeFetch } from '../../../lib/api-config';
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
  Navigation
} from 'lucide-react';

interface BookingRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicle: string;
  serviceType: string;
  address: string;
  date: string;
  notes?: string;
  status: 'PENDING' | 'ATTENDED' | 'CANCELLED';
  attendedBy?: string;
  attendedAt?: string;
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ATTENDED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const prevCountRef = useRef<number | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchBookings = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    const { ok, data } = await safeFetch<BookingRequest[]>('/booking-requests');
    if (ok && Array.isArray(data)) {
      if (prevCountRef.current !== null && data.length > prevCountRef.current) {
        showToast('🎉 ¡Nueva solicitud de cita a domicilio recibida en tiempo real! ✨', 'success');
      }
      prevCountRef.current = data.length;
      setBookings(data);
    }
    if (showLoading) setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings(true);
    // Real-time polling every 5 seconds
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsAttended = async (id: string) => {
    const { ok } = await safeFetch(`/booking-requests/${id}/attend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName: 'Administrador AURA' }),
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

  // Calculate 24-hour urgency check
  const isOverdue = (createdAt: string, status: string) => {
    if (status !== 'PENDING') return false;
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  const filteredBookings = bookings.filter((b) => {
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

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const attendedCount = bookings.filter((b) => b.status === 'ATTENDED').length;
  const overdueCount = bookings.filter((b) => isOverdue(b.createdAt, b.status)).length;

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
              Solicitudes de Citas a Domicilio
            </h1>
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
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Panel de control y mapas en vivo para atender las visitas técnicas programadas desde la página pública.
          </p>
        </div>

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
          Actualizar Lista
        </button>
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
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{booking.vehicle}</div>
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

    </div>
  );
}
