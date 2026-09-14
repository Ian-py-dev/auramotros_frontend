/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Car,
  Fuel,
  ClipboardList,
  PenTool,
  ShieldAlert,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Wrench,
  Check
} from 'lucide-react';
import { safeFetch } from '../../lib/api-config';

export type DamageType = 'dent' | 'scratch' | 'crack' | 'missing' | 'paint' | 'glass';
export type DamageSeverity = 'minor' | 'moderate' | 'severe';
export type CarView = 'top' | 'front' | 'rear' | 'left' | 'right';

export interface DamagePoint {
  id: string;
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  view: CarView;
  type: DamageType;
  severity: DamageSeverity;
  notes?: string;
  createdAt: string;
}

export interface VehicleInspectionData {
  fuelLevel?: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  mileageIn?: number;
  accessories?: {
    spareTire?: boolean;
    jackAndHandle?: boolean;
    lugWrench?: boolean;
    safetyTriangles?: boolean;
    fireExtinguisher?: boolean;
    jumperCables?: boolean;
    vehicleRegistration?: boolean;
    toolKit?: boolean;
    floorMats?: boolean;
    antenna?: boolean;
    gasCap?: boolean;
    stereoDisplay?: boolean;
  };
  fluids?: {
    motorOil?: 'optimal' | 'low' | 'needs_change';
    brakeFluid?: 'optimal' | 'low';
    coolant?: 'optimal' | 'low';
    batteryStatus?: 'good' | 'needs_check' | 'low';
    wipers?: 'good' | 'worn';
    lights?: 'all_working' | 'burned_out' | 'broken';
  };
  inspectorNotes?: string;
  inspectorName?: string;
  signature?: string; // base64 data URL
  inspectedAt?: string;
}

interface VehicleDamageMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleTitle: string;
  initialDamages?: DamagePoint[];
  initialInspection?: VehicleInspectionData;
  onSaved?: (damages: DamagePoint[], inspection: VehicleInspectionData) => void;
}

const DAMAGE_TYPE_CONFIG: Record<DamageType, { label: string; color: string; bg: string; icon: string }> = {
  dent: { label: 'Golpe / Abolladura', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', icon: '🔴' },
  scratch: { label: 'Rayón / Raspón', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)', icon: '🟡' },
  crack: { label: 'Grieta / Rotura', color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)', icon: '🟠' },
  missing: { label: 'Pieza Faltante', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)', icon: '🟣' },
  paint: { label: 'Mancha / Pintura', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', icon: '🔵' },
  glass: { label: 'Cristal / Parabrisas', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)', icon: '⚪' }
};

const SEVERITY_CONFIG: Record<DamageSeverity, { label: string; badgeColor: string }> = {
  minor: { label: 'Leve', badgeColor: '#10b981' },
  moderate: { label: 'Moderado', badgeColor: '#f59e0b' },
  severe: { label: 'Grave', badgeColor: '#ef4444' }
};

export default function VehicleDamageMapModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleTitle,
  initialDamages = [],
  initialInspection,
  onSaved
}: VehicleDamageMapModalProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'checklist' | 'signature'>('map');
  const [currentView, setCurrentView] = useState<CarView>('top');
  const [damages, setDamages] = useState<DamagePoint[]>([]);
  const [selectedDamageId, setSelectedDamageId] = useState<string | null>(null);

  // New Damage form popover state
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [pendingType, setPendingType] = useState<DamageType>('scratch');
  const [pendingSeverity, setPendingSeverity] = useState<DamageSeverity>('minor');
  const [pendingNotes, setPendingNotes] = useState('');

  // Checklist state
  const [inspection, setInspection] = useState<VehicleInspectionData>({
    fuelLevel: 'half',
    mileageIn: undefined,
    accessories: {
      spareTire: true,
      jackAndHandle: true,
      lugWrench: true,
      safetyTriangles: true,
      fireExtinguisher: false,
      jumperCables: false,
      vehicleRegistration: true,
      toolKit: true,
      floorMats: true,
      antenna: true,
      gasCap: true,
      stereoDisplay: true,
    },
    fluids: {
      motorOil: 'optimal',
      brakeFluid: 'optimal',
      coolant: 'optimal',
      batteryStatus: 'good',
      wipers: 'good',
      lights: 'all_working',
    },
    inspectorNotes: '',
    inspectorName: '',
    signature: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      setDamages(Array.isArray(initialDamages) ? initialDamages : []);
      if (initialInspection) {
        setInspection({
          fuelLevel: initialInspection.fuelLevel || 'half',
          mileageIn: initialInspection.mileageIn,
          accessories: {
            spareTire: true,
            jackAndHandle: true,
            lugWrench: true,
            safetyTriangles: true,
            fireExtinguisher: false,
            jumperCables: false,
            vehicleRegistration: true,
            toolKit: true,
            floorMats: true,
            antenna: true,
            gasCap: true,
            stereoDisplay: true,
            ...(initialInspection.accessories || {})
          },
          fluids: {
            motorOil: 'optimal',
            brakeFluid: 'optimal',
            coolant: 'optimal',
            batteryStatus: 'good',
            wipers: 'good',
            lights: 'all_working',
            ...(initialInspection.fluids || {})
          },
          inspectorNotes: initialInspection.inspectorNotes || '',
          inspectorName: initialInspection.inspectorName || '',
          signature: initialInspection.signature || '',
          inspectedAt: initialInspection.inspectedAt,
        });
        if (initialInspection.signature) {
          setHasSignature(true);
        }
      }
    }
  }, [isOpen, initialDamages, initialInspection]);

  // Redraw signature on canvas if exists
  useEffect(() => {
    if (activeTab === 'signature' && canvasRef.current && inspection.signature) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = inspection.signature;
      }
    }
  }, [activeTab, inspection.signature]);

  if (!isOpen) return null;

  // Handle Diagram Click to place a damage marker
  const handleDiagramClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - svgRect.left;
    const clickY = e.clientY - svgRect.top;

    const x = Math.round((clickX / svgRect.width) * 100);
    const y = Math.round((clickY / svgRect.height) * 100);

    setPendingPoint({ x, y });
    setPendingNotes('');
    setPendingType('scratch');
    setPendingSeverity('minor');
    setSelectedDamageId(null);
  };

  const handleConfirmAddDamage = () => {
    if (!pendingPoint) return;
    const newDamage: DamagePoint = {
      id: `dmg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: pendingPoint.x,
      y: pendingPoint.y,
      view: currentView,
      type: pendingType,
      severity: pendingSeverity,
      notes: pendingNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setDamages(prev => [...prev, newDamage]);
    setPendingPoint(null);
    setPendingNotes('');
  };

  const handleDeleteDamage = (id: string) => {
    setDamages(prev => prev.filter(d => d.id !== id));
    if (selectedDamageId === id) setSelectedDamageId(null);
  };

  // Signature handling
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setInspection(prev => ({ ...prev, signature: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setInspection(prev => ({ ...prev, signature: '' }));
  };

  // Save changes to vehicle
  const handleSaveAll = async () => {
    setIsSaving(true);
    const updatedInspection: VehicleInspectionData = {
      ...inspection,
      inspectedAt: new Date().toISOString()
    };

    const { ok, error } = await safeFetch(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        damages,
        inspection: updatedInspection
      })
    });

    setIsSaving(false);
    if (ok) {
      setSaveToast('¡Inspección y mapa de daños guardados exitosamente!');
      if (onSaved) {
        onSaved(damages, updatedInspection);
      }
      setTimeout(() => {
        setSaveToast(null);
        onClose();
      }, 1200);
    } else {
      alert(`Error al guardar inspección: ${error || 'Intenta de nuevo'}`);
    }
  };

  const currentViewDamages = damages.filter(d => d.view === currentView);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-card, #0f172a)',
          borderRadius: '24px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #f8fafc)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.08) 0%, transparent 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Módulo MoreApp
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Inspección & Mapa de Daños
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              Vehículo: <strong style={{ color: '#ffffff' }}>{vehicleTitle}</strong> • {damages.length} daño(s) señalado(s)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                padding: '9px 18px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Save size={15} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Inspección'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                borderRadius: '12px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {saveToast && (
          <div style={{
            padding: '10px 24px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          display: 'flex',
          gap: '12px',
          background: 'rgba(0,0,0,0.15)'
        }}>
          <button
            onClick={() => setActiveTab('map')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'map' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'map' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'map' ? '2px solid #38bdf8' : '2px solid transparent'
            }}
          >
            <Car size={16} />
            <span>Mapa de Carrocería & Daños ({damages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'checklist' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'checklist' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'checklist' ? '2px solid #38bdf8' : '2px solid transparent'
            }}
          >
            <ClipboardList size={16} />
            <span>Checklist e Inventario</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'signature' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'signature' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === 'signature' ? '2px solid #38bdf8' : '2px solid transparent'
            }}
          >
            <PenTool size={16} />
            <span>Firma Digital {hasSignature && '✓'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'map' && (
            <div>
              {/* Perspective View Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))' }}>
                  {(['top', 'front', 'rear', 'left', 'right'] as CarView[]).map(view => {
                    const count = damages.filter(d => d.view === view).length;
                    const labels: Record<CarView, string> = {
                      top: 'Vista Superior (Planta)',
                      front: 'Frontal',
                      rear: 'Trasera',
                      left: 'Lateral Izq. (Conductor)',
                      right: 'Lateral Der. (Copiloto)'
                    };
                    return (
                      <button
                        key={view}
                        onClick={() => {
                          setCurrentView(view);
                          setPendingPoint(null);
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: currentView === view ? '#0284c7' : 'transparent',
                          color: currentView === view ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{labels[view]}</span>
                        {count > 0 && (
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '10px',
                            backgroundColor: currentView === view ? 'rgba(255,255,255,0.25)' : 'rgba(239,68,68,0.2)',
                            color: currentView === view ? '#ffffff' : '#f87171',
                            fontSize: '10px',
                            fontWeight: 800
                          }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> Golpe
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }} /> Rayón
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }} /> Grieta
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4' }} /> Cristal
                  </span>
                </div>
              </div>

              {/* Instructions banner */}
              <div style={{
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px dashed rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={15} />
                <span>Haz clic en cualquier parte del diagrama del automóvil para señalar un golpe, rayón o imperfección.</span>
              </div>

              {/* Interactive Diagram Canvas Container */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '380px',
                backgroundColor: '#070c18',
                borderRadius: '20px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)',
                userSelect: 'none'
              }}>
                {/* SVG Blueprint based on active view */}
                <svg
                  viewBox="0 0 800 400"
                  onClick={handleDiagramClick}
                  style={{
                    width: '100%',
                    height: '100%',
                    cursor: 'crosshair',
                    maxHeight: '380px'
                  }}
                >
                  {/* Grid background for technical blueprint effect */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* VISTA SUPERIOR (TOP VIEW) */}
                  {currentView === 'top' && (
                    <g transform="translate(100, 20)">
                      {/* Car Body Contour */}
                      <path
                        d="M 120 40 
                           C 220 30, 380 30, 480 40
                           C 540 50, 560 90, 560 180
                           C 560 270, 540 310, 480 320
                           C 380 330, 220 330, 120 320
                           C 60 310, 40 270, 40 180
                           C 40 90, 60 50, 120 40 Z"
                        fill="rgba(15, 23, 42, 0.85)"
                        stroke="#38bdf8"
                        strokeWidth="3"
                      />
                      {/* Front Bumper & Hood Edge (Capó) */}
                      <path d="M 480 55 C 530 65, 545 100, 545 180 C 545 260, 530 295, 480 305" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="6,4" />
                      <path d="M 450 65 L 450 295" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />
                      
                      {/* Front Windshield (Parabrisas delantero) */}
                      <path d="M 420 70 C 440 120, 440 240, 420 290 L 370 275 C 380 230, 380 130, 370 85 Z" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* Roof (Techo) */}
                      <rect x="230" y="85" width="140" height="190" rx="15" fill="rgba(30, 41, 59, 0.6)" stroke="#0284c7" strokeWidth="2" />
                      
                      {/* Rear Windshield (Medallón trasero) */}
                      <path d="M 230 90 C 215 130, 215 230, 230 270 L 180 280 C 170 240, 170 120, 180 80 Z" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* Trunk (Cajuela) */}
                      <path d="M 120 60 C 80 80, 60 120, 60 180 C 60 240, 80 280, 120 300" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="6,4" />
                      
                      {/* Side Mirrors (Espejos laterales) */}
                      <rect x="425" y="30" width="20" height="15" rx="5" fill="#38bdf8" />
                      <rect x="425" y="315" width="20" height="15" rx="5" fill="#38bdf8" />

                      {/* Headlights (Faros delanteros) */}
                      <ellipse cx="530" cy="85" rx="14" ry="22" fill="rgba(255,255,255,0.4)" stroke="#38bdf8" strokeWidth="1.5" />
                      <ellipse cx="530" cy="275" rx="14" ry="22" fill="rgba(255,255,255,0.4)" stroke="#38bdf8" strokeWidth="1.5" />

                      {/* Taillights (Calaveras traseras) */}
                      <rect x="55" y="70" width="15" height="35" rx="4" fill="rgba(239, 68, 68, 0.6)" stroke="#ef4444" />
                      <rect x="55" y="255" width="15" height="35" rx="4" fill="rgba(239, 68, 68, 0.6)" stroke="#ef4444" />

                      {/* View labels */}
                      <text x="500" y="185" fill="#94a3b8" fontSize="11" fontWeight="700" textAnchor="middle">FRENTE / CAPÓ</text>
                      <text x="300" y="185" fill="#94a3b8" fontSize="11" fontWeight="700" textAnchor="middle">TECHO</text>
                      <text x="120" y="185" fill="#94a3b8" fontSize="11" fontWeight="700" textAnchor="middle">CAJUELA</text>
                    </g>
                  )}

                  {/* VISTA FRONTAL (FRONT VIEW) */}
                  {currentView === 'front' && (
                    <g transform="translate(150, 40)">
                      {/* Roof & Windshield */}
                      <path d="M 120 70 C 190 50, 310 50, 380 70 L 440 160 C 470 170, 490 200, 490 240 L 490 290 L 10 290 L 10 240 C 10 200, 30 170, 60 160 Z" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="3" />
                      <path d="M 130 80 C 190 65, 310 65, 370 80 L 420 160 L 80 160 Z" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* Headlights */}
                      <polygon points="50,180 120,180 110,210 40,205" fill="rgba(255,255,255,0.7)" stroke="#38bdf8" strokeWidth="2" />
                      <polygon points="450,180 380,180 390,210 460,205" fill="rgba(255,255,255,0.7)" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* Grille (Parrilla) */}
                      <rect x="160" y="180" width="180" height="50" rx="8" fill="rgba(30, 41, 59, 0.9)" stroke="#0284c7" strokeWidth="2" />
                      <line x1="180" y1="195" x2="320" y2="195" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1="180" y1="210" x2="320" y2="210" stroke="#38bdf8" strokeWidth="1.5" />

                      {/* Lower Bumper & Fog lights */}
                      <rect x="40" y="240" width="420" height="50" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx="90" cy="265" r="12" fill="#38bdf8" opacity="0.6" />
                      <circle cx="410" cy="265" r="12" fill="#38bdf8" opacity="0.6" />

                      {/* Tires visible */}
                      <rect x="30" y="280" width="50" height="35" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                      <rect x="420" y="280" width="50" height="35" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="2" />

                      <text x="250" y="270" fill="#94a3b8" fontSize="11" fontWeight="700" textAnchor="middle">DEFENSA DELANTERA / FASCIA</text>
                    </g>
                  )}

                  {/* VISTA TRASERA (REAR VIEW) */}
                  {currentView === 'rear' && (
                    <g transform="translate(150, 40)">
                      {/* Rear Contour */}
                      <path d="M 120 70 C 190 55, 310 55, 380 70 L 440 160 C 470 170, 490 200, 490 240 L 490 290 L 10 290 L 10 240 C 10 200, 30 170, 60 160 Z" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="3" />
                      {/* Rear Window */}
                      <path d="M 130 80 C 190 65, 310 65, 370 80 L 420 155 L 80 155 Z" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" />
                      
                      {/* Taillights */}
                      <polygon points="40,175 120,175 110,210 35,200" fill="rgba(239, 68, 68, 0.8)" stroke="#ef4444" strokeWidth="2" />
                      <polygon points="460,175 380,175 390,210 465,200" fill="rgba(239, 68, 68, 0.8)" stroke="#ef4444" strokeWidth="2" />
                      
                      {/* Trunk lid / License plate */}
                      <rect x="180" y="195" width="140" height="40" rx="6" fill="rgba(30, 41, 59, 0.9)" stroke="#0284c7" strokeWidth="1.5" />
                      <text x="250" y="220" fill="#f8fafc" fontSize="11" fontWeight="800" textAnchor="middle">PLACAS</text>

                      {/* Rear Bumper & Exhaust */}
                      <rect x="30" y="240" width="440" height="50" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" strokeWidth="2" />
                      <rect x="60" y="285" width="25" height="10" rx="4" fill="#64748b" stroke="#94a3b8" />
                      <rect x="415" y="285" width="25" height="10" rx="4" fill="#64748b" stroke="#94a3b8" />

                      {/* Tires */}
                      <rect x="30" y="280" width="45" height="35" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                      <rect x="425" y="280" width="45" height="35" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="2" />

                      <text x="250" y="270" fill="#94a3b8" fontSize="11" fontWeight="700" textAnchor="middle">DEFENSA TRASERA / FASCIA</text>
                    </g>
                  )}

                  {/* VISTA LATERAL (LEFT / RIGHT) */}
                  {(currentView === 'left' || currentView === 'right') && (
                    <g transform="translate(60, 40)">
                      {/* Silhouette */}
                      <path
                        d="M 50 250 
                           L 90 250
                           C 90 200, 170 200, 170 250
                           L 450 250
                           C 450 200, 530 200, 530 250
                           L 610 250
                           C 630 240, 635 220, 630 180
                           C 610 170, 540 160, 470 140
                           L 370 70
                           C 330 65, 250 65, 210 75
                           L 130 140
                           C 80 150, 40 160, 30 190
                           C 20 220, 30 245, 50 250 Z"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke="#38bdf8"
                        strokeWidth="3"
                      />

                      {/* Windows */}
                      <path d="M 215 85 L 290 85 L 290 140 L 150 140 Z" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="2" />
                      <path d="M 305 85 L 360 85 L 440 140 L 305 140 Z" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="2" />

                      {/* Doors separator */}
                      <line x1="298" y1="80" x2="298" y2="245" stroke="#0284c7" strokeWidth="2" strokeDasharray="4,3" />
                      <line x1="170" y1="140" x2="170" y2="245" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,3" />
                      <line x1="430" y1="140" x2="430" y2="245" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,3" />

                      {/* Door handles */}
                      <rect x="250" y="150" width="22" height="6" rx="2" fill="#38bdf8" />
                      <rect x="330" y="150" width="22" height="6" rx="2" fill="#38bdf8" />

                      {/* Wheels & Rims */}
                      <circle cx="130" cy="250" r="42" fill="#0f172a" stroke="#64748b" strokeWidth="8" />
                      <circle cx="130" cy="250" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx="130" cy="250" r="6" fill="#38bdf8" />

                      <circle cx="490" cy="250" r="42" fill="#0f172a" stroke="#64748b" strokeWidth="8" />
                      <circle cx="490" cy="250" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx="490" cy="250" r="6" fill="#38bdf8" />

                      {/* Headlight & Taillight edges */}
                      {currentView === 'left' ? (
                        <>
                          <path d="M 610 180 L 630 180 L 625 210 Z" fill="rgba(255,255,255,0.7)" stroke="#38bdf8" />
                          <path d="M 30 190 L 45 190 L 40 220 Z" fill="rgba(239, 68, 68, 0.7)" stroke="#ef4444" />
                        </>
                      ) : (
                        <>
                          <path d="M 30 190 L 45 190 L 40 220 Z" fill="rgba(255,255,255,0.7)" stroke="#38bdf8" />
                          <path d="M 610 180 L 630 180 L 625 210 Z" fill="rgba(239, 68, 68, 0.7)" stroke="#ef4444" />
                        </>
                      )}

                      <text x="235" y="200" fill="#94a3b8" fontSize="11" fontWeight="700">PUERTA DELANTERA</text>
                      <text x="350" y="200" fill="#94a3b8" fontSize="11" fontWeight="700">PUERTA TRASERA</text>
                    </g>
                  )}
                </svg>

                {/* Render Damage Markers for current view */}
                {currentViewDamages.map((dmg, idx) => {
                  const conf = DAMAGE_TYPE_CONFIG[dmg.type];
                  const isSelected = selectedDamageId === dmg.id;
                  return (
                    <div
                      key={dmg.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDamageId(dmg.id);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${dmg.x}%`,
                        top: `${dmg.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: isSelected ? '32px' : '26px',
                        height: isSelected ? '32px' : '26px',
                        borderRadius: '50%',
                        backgroundColor: conf.color,
                        border: '2px solid #ffffff',
                        boxShadow: `0 0 12px ${conf.color}, 0 2px 6px rgba(0,0,0,0.5)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: isSelected ? '13px' : '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-out',
                        zIndex: isSelected ? 30 : 20,
                        animation: isSelected ? 'pulse 1.5s infinite' : 'none'
                      }}
                      title={`${conf.label} (${SEVERITY_CONFIG[dmg.severity].label})`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}

                {/* Pending Marker Click preview */}
                {pendingPoint && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${pendingPoint.x}%`,
                      top: `${pendingPoint.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: DAMAGE_TYPE_CONFIG[pendingType].color,
                      border: '2px dashed #ffffff',
                      boxShadow: '0 0 15px rgba(255,255,255,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '12px',
                      pointerEvents: 'none',
                      zIndex: 40
                    }}
                  >
                    +
                  </div>
                )}
              </div>

              {/* Popover form when user clicked to add damage */}
              {pendingPoint && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px 20px',
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  borderRadius: '16px',
                  border: '1px solid #0284c7',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} />
                      Registrar Daño en este Punto ({pendingPoint.x}%, {pendingPoint.y}%)
                    </h4>
                    <button
                      onClick={() => setPendingPoint(null)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    {/* Damage Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                        TIPO DE DAÑO
                      </label>
                      <select
                        value={pendingType}
                        onChange={(e) => setPendingType(e.target.value as DamageType)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-input, #0f172a)',
                          border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                          color: '#ffffff',
                          fontSize: '13px'
                        }}
                      >
                        {(Object.keys(DAMAGE_TYPE_CONFIG) as DamageType[]).map(t => (
                          <option key={t} value={t}>
                            {DAMAGE_TYPE_CONFIG[t].icon} {DAMAGE_TYPE_CONFIG[t].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Severity */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                        SEVERIDAD
                      </label>
                      <select
                        value={pendingSeverity}
                        onChange={(e) => setPendingSeverity(e.target.value as DamageSeverity)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-input, #0f172a)',
                          border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                          color: '#ffffff',
                          fontSize: '13px'
                        }}
                      >
                        <option value="minor">🟢 Leve (Superficial)</option>
                        <option value="moderate">🟡 Moderado (Visible a media distancia)</option>
                        <option value="severe">🔴 Grave (Deformación / Rotura)</option>
                      </select>
                    </div>

                    {/* Note / Description */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                        DETALLE / OBSERVACIÓN ESPECÍFICA (OPCIONAL)
                      </label>
                      <input
                        type="text"
                        value={pendingNotes}
                        onChange={(e) => setPendingNotes(e.target.value)}
                        placeholder="Ej. Raspón de 10 cm con desprendimiento de barniz"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-input, #0f172a)',
                          border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                          color: '#ffffff',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => setPendingPoint(null)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'transparent',
                        color: '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmAddDamage}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={14} />
                      <span>Fijar Daño en Carrocería</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Registered Damages Table / List */}
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Registro de Daños Señalados ({damages.length})</span>
                  {damages.length > 0 && (
                    <button
                      onClick={() => setDamages([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Borrar todos los puntos</span>
                    </button>
                  )}
                </h3>

                {damages.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    borderRadius: '14px',
                    border: '1px dashed var(--glass-border, rgba(255,255,255,0.1))',
                    textAlign: 'center',
                    color: 'var(--text-secondary, #94a3b8)',
                    fontSize: '13px'
                  }}>
                    <ShieldAlert size={28} style={{ opacity: 0.4, margin: '0 auto 6px' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No hay daños señalados en este vehículo.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.7 }}>Haz clic sobre el automóvil para registrar imperfecciones preexistentes.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '10px' }}>
                    {damages.map((dmg, idx) => {
                      const conf = DAMAGE_TYPE_CONFIG[dmg.type];
                      const sev = SEVERITY_CONFIG[dmg.severity];
                      const isSelected = selectedDamageId === dmg.id;
                      return (
                        <div
                          key={dmg.id}
                          onClick={() => {
                            setCurrentView(dmg.view);
                            setSelectedDamageId(dmg.id);
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: isSelected ? '1px solid #38bdf8' : '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: conf.color,
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {idx + 1}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                                  {conf.label}
                                </span>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: sev.badgeColor + '22',
                                  color: sev.badgeColor
                                }}>
                                  {sev.label}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                                Vista: <strong style={{ color: '#38bdf8' }}>{dmg.view}</strong> {dmg.notes && `• "${dmg.notes}"`}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDamage(dmg.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '6px'
                            }}
                            title="Eliminar este daño"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div>
              {/* SECTION 1: Combustible & Odómetro */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                  <Fuel size={18} />
                  <span>Nivel de Combustible y Odómetro de Entrada</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
                  {/* Fuel level selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: '8px' }}>
                      NIVEL DE GASOLINA AL RECIBIR
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { key: 'empty', label: 'E (Vacío)', pct: '10%' },
                        { key: 'quarter', label: '1/4', pct: '25%' },
                        { key: 'half', label: '1/2', pct: '50%' },
                        { key: 'three_quarters', label: '3/4', pct: '75%' },
                        { key: 'full', label: 'F (Lleno)', pct: '100%' },
                      ].map(f => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setInspection(prev => ({ ...prev, fuelLevel: f.key as any }))}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: '10px',
                            border: inspection.fuelLevel === f.key ? '1px solid #38bdf8' : '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                            backgroundColor: inspection.fuelLevel === f.key ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255,255,255,0.03)',
                            color: inspection.fuelLevel === f.key ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mileage in */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: '8px' }}>
                      KILOMETRAJE DE INGRESO (ODÓMETRO)
                    </label>
                    <input
                      type="number"
                      value={inspection.mileageIn || ''}
                      onChange={(e) => setInspection(prev => ({ ...prev, mileageIn: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="Ej. 65420"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Inventario de Accesorios */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                  <Wrench size={18} />
                  <span>Inventario de Accesorios y Equipamiento</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'spareTire', label: 'Llanta de refacción' },
                    { key: 'jackAndHandle', label: 'Gato y maneral' },
                    { key: 'lugWrench', label: 'Llave de cruz / dados' },
                    { key: 'safetyTriangles', label: 'Triángulos de seguridad' },
                    { key: 'fireExtinguisher', label: 'Extintor' },
                    { key: 'jumperCables', label: 'Cables pasa-corriente' },
                    { key: 'vehicleRegistration', label: 'Tarjeta de circulación' },
                    { key: 'toolKit', label: 'Kit de herramientas' },
                    { key: 'floorMats', label: 'Juego de tapetes' },
                    { key: 'antenna', label: 'Antena' },
                    { key: 'gasCap', label: 'Tapón de gasolina' },
                    { key: 'stereoDisplay', label: 'Pantalla / Estéreo' },
                  ].map(item => {
                    const isChecked = Boolean(inspection.accessories?.[item.key as keyof typeof inspection.accessories]);
                    return (
                      <label
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)',
                          border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: isChecked ? '#f8fafc' : '#94a3b8' }}>
                          {item.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInspection(prev => ({
                              ...prev,
                              accessories: {
                                ...(prev.accessories || {}),
                                [item.key]: val
                              }
                            }));
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: '#10b981',
                            cursor: 'pointer'
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Fluidos & Mecánica Visual */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                  <Layers size={18} />
                  <span>Inspección Rápida de Fluidos y Batería</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {/* Motor Oil */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                      ACEITE DE MOTOR
                    </label>
                    <select
                      value={inspection.fluids?.motorOil || 'optimal'}
                      onChange={(e) => setInspection(prev => ({
                        ...prev,
                        fluids: { ...(prev.fluids || {}), motorOil: e.target.value as any }
                      }))}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        backgroundColor: 'var(--bg-input, #0f172a)', border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                        color: '#ffffff', fontSize: '13px'
                      }}
                    >
                      <option value="optimal">🟢 Nivel Óptimo</option>
                      <option value="low">🟡 Nivel Bajo</option>
                      <option value="needs_change">🔴 Requiere Cambio Urgente</option>
                    </select>
                  </div>

                  {/* Brake Fluid */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                      LÍQUIDO DE FRENOS
                    </label>
                    <select
                      value={inspection.fluids?.brakeFluid || 'optimal'}
                      onChange={(e) => setInspection(prev => ({
                        ...prev,
                        fluids: { ...(prev.fluids || {}), brakeFluid: e.target.value as any }
                      }))}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        backgroundColor: 'var(--bg-input, #0f172a)', border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                        color: '#ffffff', fontSize: '13px'
                      }}
                    >
                      <option value="optimal">🟢 Nivel Óptimo</option>
                      <option value="low">🔴 Nivel Bajo (Revisar fugas)</option>
                    </select>
                  </div>

                  {/* Coolant */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                      ANTICONGELANTE / REFRIGERANTE
                    </label>
                    <select
                      value={inspection.fluids?.coolant || 'optimal'}
                      onChange={(e) => setInspection(prev => ({
                        ...prev,
                        fluids: { ...(prev.fluids || {}), coolant: e.target.value as any }
                      }))}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        backgroundColor: 'var(--bg-input, #0f172a)', border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                        color: '#ffffff', fontSize: '13px'
                      }}
                    >
                      <option value="optimal">🟢 Nivel Óptimo</option>
                      <option value="low">🔴 Nivel Bajo</option>
                    </select>
                  </div>

                  {/* Battery */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                      ESTADO DE BATERÍA
                    </label>
                    <select
                      value={inspection.fluids?.batteryStatus || 'good'}
                      onChange={(e) => setInspection(prev => ({
                        ...prev,
                        fluids: { ...(prev.fluids || {}), batteryStatus: e.target.value as any }
                      }))}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                        backgroundColor: 'var(--bg-input, #0f172a)', border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                        color: '#ffffff', fontSize: '13px'
                      }}
                    >
                      <option value="good">🟢 Buen Estado (Bornes limpios)</option>
                      <option value="needs_check">🟡 Requiere Carga / Diagnóstico</option>
                      <option value="low">🔴 Descargada / Dañada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes & Inspector Name */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                      ASESOR / INSPECTOR RESPONSABLE
                    </label>
                    <input
                      type="text"
                      value={inspection.inspectorName || ''}
                      onChange={(e) => setInspection(prev => ({ ...prev, inspectorName: e.target.value }))}
                      placeholder="Nombre del técnico o asesor que recibe"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                        color: '#ffffff', fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                      OBSERVACIONES GENERALES DE RECEPCIÓN
                    </label>
                    <input
                      type="text"
                      value={inspection.inspectorNotes || ''}
                      onChange={(e) => setInspection(prev => ({ ...prev, inspectorNotes: e.target.value }))}
                      placeholder="Detalles sobre pertenencias en cajuela, testigos encendidos, etc."
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        backgroundColor: 'var(--bg-input, rgba(255,255,255,0.05))',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                        color: '#ffffff', fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signature' && (
            <div>
              <div style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                textAlign: 'center'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px', color: '#ffffff' }}>
                  Firma Digital de Conformidad
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', margin: '0 0 20px', maxWidth: '600px', marginInline: 'auto' }}>
                  El cliente y/o asesor firman a continuación certificando que el mapa de daños, el inventario de accesorios y el nivel de gasolina representan con fidelidad el estado de ingreso del vehículo.
                </p>

                <div style={{
                  maxWidth: '520px',
                  margin: '0 auto',
                  borderRadius: '16px',
                  border: '2px dashed rgba(56, 189, 248, 0.4)',
                  backgroundColor: '#070c18',
                  padding: '10px',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    style={{
                      width: '100%',
                      height: '200px',
                      cursor: 'crosshair',
                      touchAction: 'none'
                    }}
                  />
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={clearSignature}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary, #94a3b8)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Limpiar Firma</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
            <span>{damages.length} daño(s) registrado(s)</span> •{' '}
            <span>Combustible: <strong>{inspection.fuelLevel || 'N/A'}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'var(--text-secondary, #94a3b8)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                padding: '9px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Save size={15} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Inspección'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
