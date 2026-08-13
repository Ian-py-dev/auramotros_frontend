'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type OrderType = {
  id: string; client: string; car: string; type: string; status: string;
  color: string; bg: string; date: string; mechanic: string; phone: string;
  notes: string; amount: number; carImage?: string;
};

const MOCK_ORDERS: OrderType[] = [
  { id: 'ORD-901', client: 'Carlos Mendoza', car: 'Honda Civic 2021 (Placas: GHF-123)', type: 'Mantenimiento en Taller', status: 'En Proceso', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', date: '21 Oct, 10:30 AM', mechanic: 'Roberto García', phone: '+52 55 1234 5678', notes: 'Cambio de aceite, revisión de frenos y niveles.', amount: 1250, carImage: 'https://images.unsplash.com/photo-1590362891991-f7004f14798c?q=80&w=600&auto=format&fit=crop' },
  { id: 'ORD-902', client: 'Sofía Reyes', car: 'Nissan March 2023 (Placas: TYU-456)', type: 'Servicio a Domicilio', status: 'En Ruta', color: 'var(--color-accent)', bg: 'rgba(56,189,248,0.1)', date: '21 Oct, 11:15 AM', mechanic: 'Luis Fernando', phone: '+52 55 8765 4321', notes: 'Revisión general y cambio de balatas.', amount: 1800, carImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?q=80&w=600&auto=format&fit=crop' },
  { id: 'ORD-903', client: 'Luis Torres', car: 'Ford Mustang 2019 (Placas: QWE-789)', type: 'Reparación Mayor', status: 'Pendiente', color: '#fb7185', bg: 'rgba(251,113,133,0.1)', date: '20 Oct, 09:00 AM', mechanic: 'Carlos Slim', phone: '+52 55 1122 3344', notes: 'Falla en la transmisión, se necesita escaner avanzado.', amount: 4500, carImage: 'https://images.unsplash.com/photo-1584345611124-277def3db066?q=80&w=600&auto=format&fit=crop' },
  { id: 'ORD-904', client: 'Ana García', car: 'VW Jetta 2020 (Placas: ZXC-098)', type: 'Mantenimiento en Taller', status: 'Finalizado', color: 'var(--color-emerald)', bg: 'rgba(16,185,129,0.1)', date: '19 Oct, 14:00 PM', mechanic: 'Ana Paula', phone: '+52 55 4455 6677', notes: 'Alineación y balanceo completados satisfactoriamente.', amount: 950, carImage: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=600&auto=format&fit=crop' }
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some(r => r.role.name === 'Administrador' || r.role.name === 'ADMIN' || r.role.name === 'Super Admin' || r.role.name === 'Mecánico' || r.role.name === 'Asesor');

  const [orders, setOrders] = useState<OrderType[]>(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [activeCarImage, setActiveCarImage] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSelectOrder = (order: OrderType) => {
    setSelectedOrder(order);
    setActiveCarImage(order.carImage || null);
  };

  const handleAcceptOrder = (orderId: string) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'Aceptada', mechanic: user ? `${user.firstName} ${user.lastName}` : 'Taller Aura', color: 'var(--color-accent)', bg: 'rgba(56,189,248,0.1)' };
      }
      return o;
    }));
    // Update local selected state to re-render slide-over immediately
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: 'Aceptada', mechanic: user ? `${user.firstName} ${user.lastName}` : 'Taller Aura', color: 'var(--color-accent)', bg: 'rgba(56,189,248,0.1)' });
    }
  };

  const generatePDFDocument = (order: OrderType) => {
    const doc = new jsPDF();

    // Draw AURA Logo
    // Outer Circle
    doc.setDrawColor('#0284c7');
    doc.setLineWidth(1.5);
    doc.circle(24, 23, 8);
    // Inner Circle
    doc.circle(24, 23, 4);

    // Header Text
    doc.setFontSize(28);
    doc.setTextColor('#0f172a');
    doc.text('AURA', 38, 28);

    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    doc.text('Taller Autorizado & Certificado', 14, 40);

    // Folio
    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    doc.text('FOLIO', 170, 25);
    doc.setFontSize(12);
    doc.setTextColor('#ef4444');
    doc.text(order.id, 170, 31);

    doc.setDrawColor('#e2e8f0');
    doc.setLineWidth(0.5);
    doc.line(14, 46, 196, 46);

    // Details
    doc.setFontSize(11);
    doc.setTextColor('#1e293b');
    doc.text(`Vehículo: ${order.car}`, 14, 58);
    doc.text(`Propietario: ${order.client}`, 14, 66);
    doc.text(`Fecha: ${order.date}`, 14, 74);

    // Services Table using autoTable
    autoTable(doc, {
      startY: 85,
      head: [['Descripción del Servicio', 'Estado', 'Mecánico Asignado']],
      body: [
        [order.notes, order.status, order.mechanic]
      ],
      theme: 'grid',
      headStyles: { fillColor: '#0284c7' }
    });

    // Footer / Total
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 110;

    doc.setFontSize(12);
    doc.setTextColor('#64748b');
    doc.text('Total (MXN):', 140, finalY + 20);
    doc.setFontSize(16);
    doc.setTextColor('#0f172a');
    doc.text(`$${order.amount.toLocaleString()}`, 170, finalY + 20);

    // Watermark
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    doc.text('AURA CERTIFIED', 40, finalY + 80, { angle: 30 });

    return doc;
  };

  const downloadPDF = () => {
    if (!selectedOrder) return;
    const doc = generatePDFDocument(selectedOrder);
    doc.save(`AURA_Certificado_${selectedOrder.id}.pdf`);
  };

  const previewPDF = () => {
    if (!selectedOrder) return;
    const doc = generatePDFDocument(selectedOrder);
    const pdfDataUri = doc.output('datauristring');
    setPdfPreview(pdfDataUri);
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '0.5rem' }}>
            Hola, <span style={{ fontWeight: 600 }}>{user?.firstName}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bienvenido de vuelta a tu ecosistema Aura.
          </p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          style={{ 
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #06b6d4 100%)', 
            border: 'none', color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '12px', 
            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', 
            boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'}
          onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
          Nueva Orden / Reservación
        </button>
      </div>

      {isAdmin ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Metric 1 */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Usuarios Totales</span>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-accent)' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 300 }}>1,248</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-emerald)' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span>+12% este mes</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Citas Hoy</span>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 300 }}>34</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>8 pendientes</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Vehículos Activos</span>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald)' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 300 }}>892</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-emerald)' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span>+5% este mes</span>
              </div>
            </div>
          </div>

          {/* Mock Data: Citas Recientes */}
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-accent)' }}></div>
              Órdenes y Citas Recientes
            </h3>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>ID CITA</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>CLIENTE</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>VEHÍCULO</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>TIPO</th>
                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr key={order.id} onClick={() => handleSelectOrder(order)} style={{
                      borderBottom: i === orders.length - 1 ? 'none' : '1px solid var(--glass-border)',
                      transition: 'all 0.2s', cursor: 'pointer',
                      backgroundColor: selectedOrder?.id === order.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                    }}
                      onMouseOver={e => !selectedOrder && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                      onMouseOut={e => !selectedOrder && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{order.id}</td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)' }}>{order.client}</td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{order.car.split('(')[0]}</td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {order.type.includes('Domicilio') ? '📍' : '🏢'} {order.type}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span style={{ backgroundColor: order.bg, color: order.color, padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '1rem' }}>Vista de Cliente / Taller</h3>
          <p style={{ color: 'var(--text-secondary)' }}>El contenido de esta vista se adaptará dependiendo del rol asignado a tu cuenta (Cliente, Mecánico, Vendedor).</p>
        </div>
      )}

      {/* --- ORDER DETAILS SLIDE-OVER --- */}
      {selectedOrder && (
        <>
          <div onClick={() => setSelectedOrder(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(5px)', animation: 'fadeIn 0.3s' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '600px',
            backgroundColor: 'var(--bg-primary)', borderLeft: '1px solid var(--glass-border)',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.5)', zIndex: 101, display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .timeline-dot::before {
                content: '';
                position: absolute;
                top: 24px;
                bottom: -24px;
                left: 7px;
                width: 2px;
                background-color: var(--glass-border);
              }
              .timeline-item:last-child .timeline-dot::before {
                display: none;
              }
            `}</style>

            <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 300 }}>{selectedOrder.id}</h2>
                  <span style={{ backgroundColor: selectedOrder.bg, color: selectedOrder.color, padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${selectedOrder.color}40` }}>
                    {selectedOrder.status}
                  </span>
                  
                  {/* Accept Pending Request Button */}
                  {selectedOrder.status === 'Pendiente' && isAdmin && (
                    <button onClick={() => handleAcceptOrder(selectedOrder.id)} style={{
                      background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)', border: 'none', color: '#fff',
                      padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      Aceptar Solicitud
                    </button>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{selectedOrder.date} &bull; {selectedOrder.type}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                &times;
              </button>
            </div>

            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Client & Car Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>

                {/* Vehicle Photo Area with Delete/Upload UX */}
                <div style={{ gridColumn: 'span 2', height: '180px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                  {activeCarImage ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                      <img src={activeCarImage} alt="Vehículo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                      {/* Gradient and Badge */}
                      <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '1.2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                        <span style={{ backgroundColor: 'var(--color-accent)', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(56, 189, 248, 0.4)' }}>
                          FOTO EN ARCHIVO
                        </span>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveCarImage(null); }}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.8)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                        title="Eliminar Fotografía"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setActiveCarImage('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop')}
                      style={{ width: '100%', height: '100%', border: '2px dashed var(--color-accent-light)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56, 189, 248, 0.05)', cursor: 'pointer', transition: 'all 0.2s', gap: '0.5rem' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.05)'}
                    >
                      <div style={{ backgroundColor: 'var(--color-accent)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', boxShadow: '0 4px 10px rgba(56, 189, 248, 0.4)' }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>Subir Nueva Fotografía</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Haz clic para adjuntar archivo</span>
                    </div>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: 600 }}>Cliente</p>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedOrder.client}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedOrder.phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: 600 }}>Vehículo</p>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedOrder.car.split('(')[0].trim()}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedOrder.car.split('(')[1]?.replace(')', '')}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: 600 }}>Mecánico Asignado</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      {selectedOrder.mechanic.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600 }}>{selectedOrder.mechanic}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Línea de Tiempo</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  <div className="timeline-item" style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                    <div className="timeline-dot" style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)', position: 'relative', zIndex: 2, flexShrink: 0, marginTop: '4px', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }}></div>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Reserva Confirmada</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>El cliente programó el servicio.</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-light)', marginTop: '0.25rem' }}>{selectedOrder.date}</p>
                    </div>
                  </div>

                  <div className="timeline-item" style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                    <div className="timeline-dot" style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: selectedOrder.status === 'Pendiente' ? 'var(--glass-border)' : 'var(--color-emerald)', position: 'relative', zIndex: 2, flexShrink: 0, marginTop: '4px' }}></div>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Vehículo Recibido</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Inspección visual inicial completada.</p>
                    </div>
                  </div>

                  <div className="timeline-item" style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                    <div className="timeline-dot" style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: selectedOrder.status === 'Finalizado' ? 'var(--color-emerald)' : (selectedOrder.status === 'En Proceso' || selectedOrder.status === 'En Ruta' ? 'var(--color-accent)' : 'var(--glass-border)'), position: 'relative', zIndex: 2, flexShrink: 0, marginTop: '4px' }}>
                      {(selectedOrder.status === 'En Proceso' || selectedOrder.status === 'En Ruta') && (
                        <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', opacity: 0.4, animation: 'pulse-glow 2s infinite' }}></div>
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Diagnóstico y Trabajo</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedOrder.notes}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* PDF Certificate Mockup */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Certificado de Servicio
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={previewPDF} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--color-emerald)', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      Previsualizar
                    </button>
                    <button onClick={downloadPDF} style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--color-accent-light)', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Descargar PDF
                    </button>
                  </div>
                </h3>
                <div style={{
                  backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0',
                  color: '#1e293b', position: 'relative', overflow: 'hidden'
                }}>
                  {/* PDF Watermark */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '6rem', fontWeight: 900, color: 'rgba(0,0,0,0.03)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>AURA CERTIFIED</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>AURA MOTORS</h4>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Taller Autorizado & Certificado</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>FOLIO</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#ef4444' }}>{selectedOrder.id}</p>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    <p><strong>Vehículo:</strong> {selectedOrder.car}</p>
                    <p><strong>Propietario:</strong> {selectedOrder.client}</p>
                    <p><strong>Servicio Realizado:</strong> {selectedOrder.notes}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid #94a3b8', width: '120px', marginBottom: '0.5rem' }}></div>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Firma del Técnico</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Total (MXN)</p>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>${selectedOrder.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* --- PDF PREVIEW MODAL --- */}
      {pdfPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setPdfPreview(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}></div>
          <div className="glass-card" style={{
            position: 'relative', width: '90%', maxWidth: '900px', height: '90vh',
            backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s ease-out', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Previsualización de Certificado AURA
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={downloadPDF} style={{ background: 'var(--color-accent)', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Descargar
                </button>
                <button onClick={() => setPdfPreview(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#525659', padding: '1rem', overflow: 'hidden' }}>
              <iframe src={pdfPreview} width="100%" height="100%" style={{ border: 'none', borderRadius: '4px', backgroundColor: '#fff' }} title="PDF Preview"></iframe>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE ORDER MODAL --- */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '600px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', overflow: 'hidden', animation: 'scaleIn 0.3s ease', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>Nueva Orden / Reservación</h2>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cliente</label>
                  <input type="text" placeholder="Ej. Juan Pérez" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vehículo</label>
                  <input type="text" placeholder="Ej. Honda Civic 2020" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tipo de Servicio</label>
                <select style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                  <option style={{ color: '#000' }}>Servicio a Domicilio</option>
                  <option style={{ color: '#000' }}>Mantenimiento en Taller</option>
                  <option style={{ color: '#000' }}>Reparación Mayor</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  const newOrder: OrderType = {
                    id: 'ORD-' + Math.floor(Math.random() * 1000), client: 'Cliente Nuevo', car: 'Vehículo Nuevo', type: 'Servicio Programado',
                    status: 'Pendiente', color: '#fb7185', bg: 'rgba(251,113,133,0.1)', date: 'Hoy', mechanic: 'Sin Asignar', phone: '+52 55 0000 0000', notes: 'Detalles del servicio...', amount: 0
                  };
                  setOrders([newOrder, ...orders]);
                  setIsCreateModalOpen(false);
                  
                  // Trigger toast manually using a custom event
                  const event = new CustomEvent('show-toast', { detail: { title: 'Orden Creada', message: 'Se ha creado la orden y enviado notificación a los mecánicos.' } });
                  window.dispatchEvent(event);
                }}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--color-accent)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '1rem' }}
              >
                Crear Orden y Notificar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
