'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { safeFetch } from '../lib/api-config';
import dynamic from 'next/dynamic';
import {
  Wrench,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Car,
  Calendar,
  MapPin,
  Search,
  Crosshair,
  Lock,
  AlertTriangle,
  CheckCircle2,
  X,
  Target,
  Compass,
  ArrowRight
} from 'lucide-react';

const Map = dynamic(() => import('react-map-gl').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', width: '100%', minHeight: '300px', backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 600, gap: '0.6rem' }}>
      <MapPin size={20} className="animate-pulse" />
      <span>Cargando Mapa Interactivo...</span>
    </div>
  )
});

const Marker = dynamic(() => import('react-map-gl').then((mod) => mod.Marker), {
  ssr: false
});

import { CAR_CATALOG } from '../lib/car-catalog';

type LangType = 'es' | 'en';
type ThemeType = 'dark' | 'light';

export default function Home() {
  const [lang, setLang] = useState<LangType>('es');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [isScrolled, setIsScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    serviceType: 'Mantenimiento Preventivo a Domicilio',
    address: '',
    date: '',
    notes: ''
  });
  const [bookingSelectedBrand, setBookingSelectedBrand] = useState('');
  const [bookingSelectedModel, setBookingSelectedModel] = useState('');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState('');

  // Access Request Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessForm, setAccessForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Cliente',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehiclePlates: '',
    lastMaintenanceDate: ''
  });
  const [accessSelectedBrand, setAccessSelectedBrand] = useState('');
  const [accessSelectedModel, setAccessSelectedModel] = useState('');
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);
  const [accessSuccess, setAccessSuccess] = useState(false);
  const [accessError, setAccessError] = useState('');

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAccess(true);
    setAccessError('');
    setAccessSuccess(false);

    const { ok, data, error } = await safeFetch<{ message?: string }>('/users/access-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accessForm),
    });

    if (ok) {
      setAccessSuccess(true);
    } else {
      setAccessError(data?.message || error || 'Error al enviar la solicitud de acceso.');
    }
    setIsSubmittingAccess(false);
  };

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ('pk.' + 'eyJ1IjoiaWFubmF2aW9tYXIiLCJhIjoiY21mdmdseTMxMDdiazJxb3d3bHY1bmVrOCJ9.pzo31yAY28ZIFGHnUhydjg');

  const [mapViewState, setMapViewState] = useState({
    longitude: -99.1622,
    latitude: 19.4299,
    zoom: 13
  });
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>({
    lat: 19.4299,
    lng: -99.1622
  });
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; place_name: string; center: [number, number] }>>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Search places via Mapbox Geocoding API
  const handleMapSearch = async (query: string) => {
    setMapSearchQuery(query);
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearchingMap(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=MX&language=es`);
      const data = await res.json();
      if (data.features) {
        setSearchResults(data.features.map((f: { id: string; place_name: string; center: [number, number] }) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center
        })));
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const selectSearchResult = (center: [number, number], placeName: string) => {
    const [lng, lat] = center;
    setMapViewState({ longitude: lng, latitude: lat, zoom: 15 });
    setMarkerPos({ lat, lng });
    setBookingForm((prev) => ({
      ...prev,
      address: `${placeName} (https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)})`
    }));
    setSearchResults([]);
    setMapSearchQuery(placeName);
  };

  const handleMapClick = (e: { lngLat: { lat: number; lng: number } }) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setMarkerPos({ lat, lng });
    setBookingForm((prev) => ({
      ...prev,
      address: `Ubicación Seleccionada en Mapa: https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`
    }));
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapViewState({ longitude: lng, latitude: lat, zoom: 16 });
          setMarkerPos({ lat, lng });
          setBookingForm((prev) => ({
            ...prev,
            address: `Mi Ubicación Actual (GPS): https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`
          }));
        },
        () => {
          alert('No se pudo obtener la ubicación GPS actual. Por favor selecciona el punto en el mapa o busca tu dirección.');
        }
      );
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if page has been scrolled down past 50px
      if (currentScrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Determine scroll direction (hide on scroll down, show on scroll up)
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false); // scrolling down
      } else {
        setVisible(true); // scrolling up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load language and theme from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('aura-lang') as LangType;
    if (savedLang === 'es' || savedLang === 'en') {
      setLang(savedLang);
    }
    const savedTheme = localStorage.getItem('aura-theme') as ThemeType;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }
  }, []);

  // Update HTML body theme class when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('aura-theme', theme);
  }, [theme]);

  // Dictionary for translations
  const t = {
    es: {
      navFeatures: 'Lo Que Hacemos',
      navMisionVision: 'Misión y Visión',
      navReserve: 'Agendar Cita',
      loginBtn: 'Iniciar Sesión',
      portalBtn: 'Portal de Clientes',
      heroBadge: 'SERVICIOS AUTOMOTRICES & MANTENIMIENTO CERTIFICADO',
      heroTitle: 'Mantenimiento automotriz inteligente, certificado y hecho a tu medida',
      heroDesc: 'Atención técnica integral para tu vehículo: diagnósticos computarizados avanzados, mecánicos calificados, expediente técnico digital en tu perfil de usuario y servicio flexible a domicilio o taller.',
      ctaBtn: 'Agendar Servicio',
      featuresTitle: 'Lo Que Hacemos en Aura',
      featuresSubtitle: 'Ingeniería, tecnología digital y máxima confianza aplicadas al cuidado inteligente de tu automóvil.',
      feat1Title: 'Servicios Automotrices Integrales',
      feat1Desc: 'Afinaciones mayores y menores, diagnóstico computarizado con escáner OBD-II, frenos, suspensión, dirección y revisión integral de fluidos con equipos de precisión.',
      feat2Title: 'Mantenimiento Certificado',
      feat2Desc: 'Protocolos rigurosos respaldados por mecánicos calificados, refacciones originales (OEM) de alta gama y póliza de garantía por escrito en cada intervención.',
      feat3Title: 'Perfil del Usuario & Expediente Digital',
      feat3Desc: 'Tu auto con su propio expediente técnico en la nube: historial clínico de servicios, bitácora fotográfica de evidencia, mapa interactivo de daños e inspecciones y alertas preventivas.',
      feat4Title: 'Hecho a la Medida',
      feat4Desc: 'Nos adaptamos 100% a tu tiempo y necesidades: solicita mecánicos certificados en la comodidad de tu casa u oficina, o agenda cita en taller. Cobertura para autos particulares y flotas corporativas.',
      misionTitle: 'Nuestra Misión',
      misionDesc: 'Transformar el mantenimiento automotriz en una experiencia transparente, cómoda y de calidad superior, combinando tecnología digital, mecánicos certificados y atención personalizada a la medida de cada conductor.',
      visionTitle: 'Nuestra Visión',
      visionDesc: 'Consolidarnos como el ecosistema de mantenimiento automotriz líder en Latinoamérica, impulsado por tecnología de vanguardia, máxima confianza y excelencia técnica.',
      networkBadge: 'ATENCIÓN DIRECTA',
      networkTitle: 'Agenda Tu Servicio Automotriz',
      networkDesc: 'Selecciona tus datos y ubicación para programar la atención técnica de tu auto con mecánicos certificados.',
      formFullName: 'Nombre Completo *',
      formPhone: 'Teléfono / WhatsApp de Contacto *',
      formVehicle: 'Auto (Marca, Modelo y Año) *',
      formServiceType: 'Tipo de Servicio',
      services: [
        { id: 'Mantenimiento Preventivo a Domicilio', label: 'Mantenimiento Preventivo a Domicilio' },
        { id: 'Diagnóstico por Escáner / Check Engine', label: 'Diagnóstico por Escáner / Check Engine' },
        { id: 'Cambio de Aceite y Filtros', label: 'Cambio de Aceite y Filtros' },
        { id: 'Revisión de Frenos y Suspensión', label: 'Revisión de Frenos y Suspensión' },
        { id: 'Auxilio Vial / Cambio de Batería', label: 'Auxilio Vial / Cambio de Batería' },
        { id: 'Inspección Pre-Compra de Vehículo', label: 'Inspección Pre-Compra de Vehículo' },
      ],
      formDate: 'Fecha Deseada',
      formAddress: 'Ubicación / Dirección *',
      formNotes: 'Notas Adicionales / Síntomas del Auto',
      formSubmit: 'Confirmar y Agendar Servicio',
      formSubmitting: 'Enviando solicitud...',
      formRequiredErr: 'Por favor completa los campos obligatorios (Nombre, Teléfono, Vehículo y Dirección)',
      formSuccessTitle: '¡Solicitud Recibida con Éxito!',
      formSuccessDesc: 'Un asesor técnico de AURA revisará los datos de tu auto y se pondrá en contacto contigo a la brevedad para coordinar la llegada del mecánico certificado.',
      formAnotherBtn: 'Agendar Otro Servicio',
      footerRights: '© 2026 Aura Inc. Todos los derechos reservados.'
    },
    en: {
      navFeatures: 'What We Do',
      navMisionVision: 'Mission & Vision',
      navReserve: 'Book Service',
      loginBtn: 'Log In',
      portalBtn: 'Client Portal',
      heroBadge: 'AUTOMOTIVE SERVICES & CERTIFIED MAINTENANCE',
      heroTitle: 'Smart, certified automotive maintenance tailored to your needs',
      heroDesc: 'Comprehensive technical care for your vehicle: advanced computerized diagnostics, certified technicians, digital records in your user profile, and flexible mobile or workshop service.',
      ctaBtn: 'Book Service',
      featuresTitle: 'What We Do at Aura',
      featuresSubtitle: 'Engineering, cutting-edge technology, and trust dedicated to smart vehicle care.',
      feat1Title: 'Comprehensive Automotive Services',
      feat1Desc: 'Major and minor tune-ups, computerized OBD-II diagnostics, brake systems, suspension, and complete fluid servicing performed with precision equipment.',
      feat2Title: 'Certified Maintenance',
      feat2Desc: 'Dealership-grade protocols executed by certified technicians, high-grade OEM parts, and written service warranties on every inspection.',
      feat3Title: 'User Profile & Digital Records',
      feat3Desc: 'Your car gets its own clinical record in the cloud: technical maintenance logs, HD photo evidence, interactive damage inspection maps, and preventive alerts.',
      feat4Title: 'Tailored to Your Needs',
      feat4Desc: 'Total flexibility adapted to your lifestyle: request certified technicians directly at home or office, or visit partner workshops. Tailored plans for private drivers and corporate fleets.',
      misionTitle: 'Our Mission',
      misionDesc: 'To transform automotive maintenance into a transparent, convenient, and top-tier experience, fusing digital technology, certified mechanics, and personalized care tailored to each driver.',
      visionTitle: 'Our Vision',
      visionDesc: 'To become Latin America’s leading automotive service and maintenance management platform, redefining trust, transparency, and vehicle technical traceability.',
      networkBadge: 'DIRECT ASSISTANCE',
      networkTitle: 'Book Your Automotive Service',
      networkDesc: 'Fill in your vehicle details and location to schedule certified technical assistance.',
      formFullName: 'Full Name *',
      formPhone: 'Contact Phone / WhatsApp *',
      formVehicle: 'Vehicle (Make, Model, Year) *',
      formServiceType: 'Service Type',
      services: [
        { id: 'Mantenimiento Preventivo a Domicilio', label: 'Preventive Mobile Maintenance' },
        { id: 'Diagnóstico por Escáner / Check Engine', label: 'Computerized OBD-II / Check Engine Diagnostic' },
        { id: 'Cambio de Aceite y Filtros', label: 'Oil & Filter Replacement' },
        { id: 'Revisión de Frenos y Suspensión', label: 'Brake & Suspension Inspection' },
        { id: 'Auxilio Vial / Cambio de Batería', label: 'Roadside Assistance / Battery Replacement' },
        { id: 'Inspección Pre-Compra de Vehículo', label: 'Pre-Purchase Vehicle Inspection' },
      ],
      formDate: 'Desired Date',
      formAddress: 'Service Address / Location *',
      formNotes: 'Additional Notes / Vehicle Symptoms',
      formSubmit: 'Confirm & Book Service',
      formSubmitting: 'Submitting request...',
      formRequiredErr: 'Please fill in all required fields (Name, Phone, Vehicle, and Address)',
      formSuccessTitle: 'Service Request Received!',
      formSuccessDesc: 'An AURA technical advisor will review your vehicle details and contact you shortly to confirm your certified technician schedule.',
      formAnotherBtn: 'Submit Another Request',
      footerRights: '© 2026 Aura Inc. All rights reserved.'
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
    localStorage.setItem('aura-lang', nextLang);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentT = t[lang];

  return (
    <>
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', overflowX: 'clip', transition: 'background-color 0.3s ease' }}>
        
        {/* Background Glow Orbs container (contained to prevent bottom overflow) */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div className="bg-glow-orb" style={{ top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }}></div>
          <div className="bg-glow-orb" style={{ bottom: '5%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(100px)' }}></div>
          <div className="bg-glow-orb" style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(120px)' }}></div>
        </div>

        {/* --- HEADER (Liquid Glass Navigation Bar) --- */}
        <header className="liquid-glass" style={{
          position: 'fixed',
          top: '0.6rem',
          left: '50%',
          transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-140%)',
          width: 'calc(100% - 1.5rem)',
          maxWidth: '1280px',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isScrolled ? '0.7rem 1.25rem' : '0.95rem 1.5rem',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(25px) saturate(180%)',
          WebkitBackdropFilter: 'blur(25px) saturate(180%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease, background 0.3s ease',
          boxShadow: isScrolled ? '0 16px 36px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.06)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid var(--color-accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--color-accent-glow)'
            }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--color-accent)' }}></div>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 300, letterSpacing: '3px', color: 'var(--text-primary)' }}>AURA</span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s', fontSize: '1rem', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>{currentT.navFeatures}</a>
            <a href="#mision-vision" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s', fontSize: '1rem', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>{currentT.navMisionVision}</a>
            <a href="#domicilio" style={{ color: 'var(--color-accent-light)', textDecoration: 'none', transition: 'color 0.3s', fontSize: '1rem', fontWeight: 700 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-accent-light)'}>{currentT.navReserve}</a>
          </nav>

          {/* Controls & Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.4rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              {lang === 'es' ? 'ES' : 'EN'}
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.4rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            {/* Solicitar Acceso (Desktop) */}
            <button 
              onClick={() => { setIsAccessModalOpen(true); setAccessSuccess(false); setAccessError(''); }}
              className="glow-effect desktop-nav" 
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                border: 'none',
                borderRadius: '30px',
                padding: '0.6rem 1.4rem',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-block',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}>
              {currentT.portalBtn}
            </button>

            {/* Iniciar Sesión (Desktop) */}
            <Link href="/login" className="glow-effect desktop-nav" style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '30px',
              padding: '0.6rem 1.5rem',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.25)';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              {currentT.loginBtn}
            </Link>

            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{
              background: 'transparent', border: 'none', color: 'var(--text-primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                {isMobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12"></path> : <path d="M4 6h16M4 12h16M4 18h16"></path>}
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'fixed', top: '70px', left: 0, right: 0,
            backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.2)',
            padding: '2rem', zIndex: 99,
            display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 700 }}>{currentT.navFeatures}</a>
            <a href="#mision-vision" onClick={() => setIsMobileMenuOpen(false)} style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 700 }}>{currentT.navMisionVision}</a>
            <a href="#domicilio" onClick={() => setIsMobileMenuOpen(false)} style={{ color: theme === 'light' ? '#0284c7' : '#38bdf8', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 800 }}>{currentT.navReserve}</a>
            <button onClick={() => { setIsMobileMenuOpen(false); setIsAccessModalOpen(true); setAccessSuccess(false); setAccessError(''); }} style={{
              marginTop: '0.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              borderRadius: '30px', padding: '0.8rem 2rem', color: '#fff', fontSize: '1rem',
              fontWeight: 700, border: 'none', width: '100%', cursor: 'pointer'
            }}>
              {currentT.portalBtn}
            </button>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} style={{
              background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '30px', padding: '0.8rem 2rem', color: 'var(--text-primary)', fontSize: '1rem',
              fontWeight: 700, textDecoration: 'none', width: '100%', textAlign: 'center'
            }}>
              {currentT.loginBtn}
            </Link>
          </div>
        )}

        {/* CSS for responsiveness and high contrast typography */}
        <style>{`
          .hero-title {
            font-size: 3.8rem;
            font-weight: 800;
            line-height: 1.15;
            letter-spacing: -1.5px;
            margin-bottom: 2rem;
            max-width: 1000px;
          }
          @media (min-width: 768px) {
            .mobile-menu-btn { display: none !important; }
          }
          @media (max-width: 767px) {
            .desktop-nav { display: none !important; }
            .hero-title {
              font-size: 2.1rem !important;
              line-height: 1.3 !important;
              letter-spacing: 0px !important;
              margin-bottom: 1.5rem !important;
            }
            .hero-section {
              padding: 7rem 5% 3rem 5% !important;
            }
          }
        `}</style>

        {/* --- HERO SECTION --- */}
        <section className="hero-section" style={{
          padding: '9rem 5% 4rem 5%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Tagline Badge */}
          <div style={{
            background: 'var(--color-accent-glow)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '100px',
            padding: '0.4rem 1.2rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--color-accent-light)',
            marginBottom: '2rem',
            letterSpacing: '1px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent-light)', display: 'inline-block', boxShadow: '0 0 8px var(--color-accent-light)' }}></span>
            {currentT.heroBadge}
          </div>

          {/* Main Title (Adaptable a Modo Claro y Oscuro con tipografía móvil nítida) */}
          <h1 className="hero-title animate-float" style={{
            color: theme === 'light' ? '#0f172a' : '#ffffff',
            background: theme === 'light' ? 'none' : 'linear-gradient(to bottom right, #ffffff 40%, #94a3b8 100%)',
            WebkitBackgroundClip: theme === 'light' ? 'initial' : 'text',
            WebkitTextFillColor: theme === 'light' ? '#0f172a' : 'transparent',
            textShadow: theme === 'light' ? 'none' : '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            {currentT.heroTitle}
          </h1>

          {/* Description */}
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.3rem',
            maxWidth: '650px',
            lineHeight: 1.6,
            marginBottom: '3rem',
            fontWeight: 400
          }}>
            {currentT.heroDesc}
          </p>

          {/* Call to Actions */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="#domicilio"
              className="glow-effect"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                border: 'none',
                borderRadius: '14px',
                padding: '1rem 2.4rem',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span>{currentT.ctaBtn}</span>
              <ArrowRight size={18} />
            </a>
            <button
              onClick={() => {
                setIsAccessModalOpen(true);
                setAccessSuccess(false);
                setAccessError('');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '14px',
                padding: '1rem 2.2rem',
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <UserCheck size={19} color="var(--color-accent-light)" />
              <span>{currentT.portalBtn}</span>
            </button>
          </div>
        </section>

        {/* --- FEATURES / LO QUE HACEMOS SECTION --- */}
        <section id="features" style={{ padding: '8rem 5%', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '1rem', letterSpacing: '-1px' }}>{currentT.featuresTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', fontWeight: 300, maxWidth: '750px', margin: '0 auto' }}>{currentT.featuresSubtitle}</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
            maxWidth: '1240px',
            margin: '0 auto'
          }}>
            {/* Feature 1: Servicios Automotrices Integrales */}
            <div className="glass-card" style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: 'var(--color-accent-light)'
              }}>
                <Wrench size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.85rem' }}>{currentT.feat1Title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>{currentT.feat1Desc}</p>
            </div>

            {/* Feature 2: Mantenimiento Certificado */}
            <div className="glass-card" style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: 'var(--color-emerald)'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.85rem' }}>{currentT.feat2Title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>{currentT.feat2Desc}</p>
            </div>

            {/* Feature 3: Perfil del Usuario & Expediente Digital */}
            <div className="glass-card" style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(167, 139, 250, 0.15)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: '#a78bfa'
              }}>
                <UserCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.85rem' }}>{currentT.feat3Title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>{currentT.feat3Desc}</p>
            </div>

            {/* Feature 4: Hecho a la Medida */}
            <div className="glass-card" style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: '#f59e0b'
              }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.85rem' }}>{currentT.feat4Title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>{currentT.feat4Desc}</p>
            </div>
          </div>
        </section>

        {/* --- MISIÓN Y VISIÓN SECTION --- */}
        <section id="mision-vision" style={{
          padding: '6rem 5%',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--glass-border)',
          borderBottom: '1px solid var(--glass-border)',
          position: 'relative',
          transition: 'background-color 0.3s ease'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <span style={{ color: 'var(--color-accent-light)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                NUESTRA IDENTIDAD
              </span>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                Misión y Visión
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '700px', margin: '0.5rem auto 0' }}>
                {lang === 'es' ? 'Impulsamos el cuidado integral automotriz con innovación digital, calidad certificada y máxima transparencia.' : 'We drive comprehensive automotive care through digital innovation, certified quality, and absolute transparency.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
              {/* Misión Card */}
              <div className="ios-glass-card" style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-light)' }}>
                  <Target size={30} />
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {currentT.misionTitle}
                </h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  {currentT.misionDesc}
                </p>
              </div>

              {/* Visión Card */}
              <div className="ios-glass-card" style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-emerald)' }}>
                  <Compass size={30} />
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {currentT.visionTitle}
                </h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  {currentT.visionDesc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- WORKSHOPS SECTION (TEMPORARILY COMMENTED OUT - ALL SERVICES ARE HOME-BASED FOR NOW) --- */}
        {/* 
        <section style={{ padding: '6rem 5%', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', transition: 'background-color 0.3s' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ color: 'var(--color-emerald)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>{currentT.networkBadge}</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', maxWidth: '600px' }}>{currentT.networkTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginBottom: '4rem', maxWidth: '700px' }}>
              {currentT.networkDesc}
            </p>

            <div className="glass-card" style={{ width: '100%', height: '480px', position: 'relative', overflow: 'hidden', borderRadius: '32px', padding: 0, border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <Map
                initialViewState={{
                  longitude: -99.1622,
                  latitude: 19.4299,
                  zoom: 10
                }}
                mapStyle="mapbox://styles/iannaviomar/cmfwxjr9w009901qmgmsi1172"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                interactive={true}
              >
                {[
                  { lng: -99.1622, lat: 19.4299, name: 'Aura Central', info: 'Reforma 222, CDMX' },
                  { lng: -99.2195, lat: 19.4350, name: 'Aura Norte', info: 'Avila Camacho 50, Naucalpan' },
                  { lng: -99.1983, lat: 19.3045, name: 'Aura Sur', info: 'Periférico Sur 4121, CDMX' },
                  { lng: -99.2588, lat: 19.3636, name: 'Aura Santa Fe', info: 'Vasco de Quiroga 3800, CDMX' }
                ].map((pos, i) => (
                  <Marker key={i} longitude={pos.lng} latitude={pos.lat} anchor="bottom">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="workshop-tooltip" style={{
                        backgroundColor: 'rgba(20,25,40,0.9)', color: '#fff', fontSize: '0.7rem', padding: '0.4rem 0.8rem',
                        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '6px', whiteSpace: 'nowrap',
                        backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                      }}>
                        <div style={{ fontWeight: 700 }}>{pos.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{pos.info}</div>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)', border: '2.5px solid #fff', position: 'relative', zIndex: 2,
                          boxShadow: '0 0 10px rgba(16,185,129,0.8)'
                        }}></div>
                        <div style={{
                          position: 'absolute', top: '-4px', left: '-4px', width: '22px', height: '22px',
                          borderRadius: '50%', backgroundColor: 'var(--color-emerald)', opacity: 0.4, animation: `pulse-glow ${2 + (i % 2)}s infinite ${i * 0.2}s`
                        }}></div>
                      </div>
                    </div>
                  </Marker>
                ))}
              </Map>

              <div style={{
                position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: 'rgba(20, 25, 40, 0.85)', backdropFilter: 'blur(12px)',
                padding: '0.8rem 1.8rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 600, zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)', display: 'inline-block', boxShadow: '0 0 12px var(--color-emerald)', animation: 'pulse-glow 2s infinite' }}></span>
                4 Centros de Servicio Activos en CDMX
              </div>
            </div>
          </div>
        </section>
        */}

        {/* --- NUEVA SECCIÓN DE RESERVA DE SERVICIO 100% A DOMICILIO --- */}
        <section id="domicilio" style={{ padding: '7rem 5%', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', transition: 'background-color 0.3s' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div style={{
                color: 'var(--color-accent-light)',
                fontWeight: 700,
                fontSize: '0.9rem',
                marginBottom: '1rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--color-accent-glow)',
                padding: '0.4rem 1.2rem',
                borderRadius: '50px',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent-light)' }}></span>
                {currentT.networkBadge}
              </div>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.2rem', letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                {currentT.networkTitle}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
                {currentT.networkDesc}
              </p>
            </div>

            {/* Formulario de Reserva / Contacto a Domicilio (Adaptable a Modo Claro / Oscuro) */}
            <div className="glass-card" style={{
              padding: '3.5rem',
              borderRadius: '28px',
              border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: theme === 'light' ? '0 20px 50px rgba(0,0,0,0.06)' : '0 20px 60px rgba(0,0,0,0.4)',
              background: theme === 'light' ? '#ffffff' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(7, 10, 19, 0.98) 100%)',
              transition: 'all 0.3s ease'
            }}>
              {bookingSubmitted ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid var(--color-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
                    color: 'var(--color-emerald)'
                  }}>
                    <CheckCircle2 size={42} />
                  </div>
                  <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    {currentT.formSuccessTitle}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                    {currentT.formSuccessDesc}
                  </p>
                  <button
                    onClick={() => {
                      setBookingSubmitted(false);
                      setBookingSelectedBrand('');
                      setBookingSelectedModel('');
                      setBookingForm({
                        name: '',
                        phone: '',
                        vehicleBrand: '',
                        vehicleModel: '',
                        vehicleYear: '',
                        serviceType: 'Mantenimiento Preventivo a Domicilio',
                        address: '',
                        date: '',
                        notes: ''
                      });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.9rem 2.2rem',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>{currentT.formAnotherBtn}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setFormErrorMsg('');
                  if (!bookingForm.name || !bookingForm.phone || !bookingForm.vehicleBrand || !bookingForm.vehicleModel || !bookingForm.vehicleYear || !bookingForm.address) {
                    setFormErrorMsg(lang === 'es' ? 'Por favor completa todos los campos requeridos, incluyendo Marca, Modelo y Año.' : 'Please fill in all required fields including Brand, Model and Year.');
                    return;
                  }
                  setIsSubmittingBooking(true);
                  const combinedVehicle = `${bookingForm.vehicleBrand} ${bookingForm.vehicleModel} ${bookingForm.vehicleYear}`.trim();
                  const { ok, error: fetchErr } = await safeFetch('/booking-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      clientName: bookingForm.name,
                      clientPhone: bookingForm.phone,
                      vehicle: combinedVehicle,
                      vehicleBrand: bookingForm.vehicleBrand,
                      vehicleModel: bookingForm.vehicleModel,
                      vehicleYear: bookingForm.vehicleYear,
                      serviceType: bookingForm.serviceType,
                      address: bookingForm.address,
                      date: bookingForm.date || new Date().toLocaleDateString('es-MX'),
                      notes: bookingForm.notes
                    })
                  });
                  setIsSubmittingBooking(false);
                  if (ok) {
                    setBookingSubmitted(true);
                  } else {
                    setFormErrorMsg(fetchErr || 'Error al procesar la solicitud');
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                  {/* UI Error Alert Banner */}
                  {formErrorMsg && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '14px',
                      padding: '1rem 1.25rem',
                      color: '#f87171',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                      <span>{formErrorMsg}</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.8rem' }}>
                    {/* Nombre */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        {currentT.formFullName}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos Mendoza"
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          borderRadius: '14px',
                          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                          backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                          color: theme === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '1rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>

                    {/* Teléfono / WhatsApp */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        {currentT.formPhone}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 55 1234 5678"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          borderRadius: '14px',
                          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                          backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                          color: theme === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '1rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>

                    {/* Marca del Vehículo (Selector Dinámico y Moderno) */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        <Car size={16} color="var(--color-accent-light)" />
                        <span>{lang === 'es' ? 'Marca del Vehículo *' : 'Vehicle Brand *'}</span>
                      </label>
                      <select
                        required
                        value={bookingSelectedBrand}
                        onChange={(e) => {
                          const b = e.target.value;
                          setBookingSelectedBrand(b);
                          if (b === 'OTRA') {
                            setBookingForm((prev) => ({ ...prev, vehicleBrand: '', vehicleModel: '' }));
                            setBookingSelectedModel('OTRO');
                          } else {
                            setBookingForm((prev) => ({ ...prev, vehicleBrand: b, vehicleModel: '' }));
                            setBookingSelectedModel('');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          borderRadius: '14px',
                          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                          backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                          color: theme === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '1rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backdropFilter: 'blur(10px)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                          {lang === 'es' ? '-- Selecciona la Marca --' : '-- Select Brand --'}
                        </option>
                        {Object.keys(CAR_CATALOG).map((brand) => (
                          <option key={brand} value={brand} style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                            {brand}
                          </option>
                        ))}
                        <option value="OTRA" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: 'var(--color-accent-light)', fontWeight: 600 }}>
                          {lang === 'es' ? 'Otra marca (escribir manualmente)...' : 'Other brand (type manually)...'}
                        </option>
                      </select>

                      {/* Input manual si seleccionó OTRA marca */}
                      {bookingSelectedBrand === 'OTRA' && (
                        <input
                          type="text"
                          required
                          autoFocus
                          placeholder={lang === 'es' ? 'Escribe la marca de tu auto...' : 'Type your vehicle brand...'}
                          value={bookingForm.vehicleBrand}
                          onChange={(e) => setBookingForm({ ...bookingForm, vehicleBrand: e.target.value })}
                          style={{
                            width: '100%',
                            marginTop: '0.75rem',
                            padding: '0.85rem 1.2rem',
                            borderRadius: '12px',
                            border: theme === 'light' ? '1px solid #94a3b8' : '1px solid var(--color-accent-light)',
                            backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.9)',
                            color: theme === 'light' ? '#0f172a' : '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      )}
                    </div>

                    {/* Modelo del Vehículo (Selector Dependiente de Marca) */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        <Car size={16} color="var(--color-accent-light)" />
                        <span>{lang === 'es' ? 'Modelo del Vehículo *' : 'Vehicle Model *'}</span>
                      </label>

                      {bookingSelectedBrand === 'OTRA' ? (
                        <input
                          type="text"
                          required
                          placeholder={lang === 'es' ? 'Escribe el modelo de tu auto...' : 'Type your vehicle model...'}
                          value={bookingForm.vehicleModel}
                          onChange={(e) => setBookingForm({ ...bookingForm, vehicleModel: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.9rem 1.2rem',
                            borderRadius: '14px',
                            border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                            backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                            color: theme === 'light' ? '#0f172a' : '#ffffff',
                            fontSize: '1rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                      ) : (
                        <>
                          <select
                            required
                            disabled={!bookingSelectedBrand}
                            value={bookingSelectedModel}
                            onChange={(e) => {
                              const m = e.target.value;
                              setBookingSelectedModel(m);
                              if (m === 'OTRO') {
                                setBookingForm((prev) => ({ ...prev, vehicleModel: '' }));
                              } else {
                                setBookingForm((prev) => ({ ...prev, vehicleModel: m }));
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.9rem 1.2rem',
                              borderRadius: '14px',
                              border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                              backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                              color: theme === 'light' ? '#0f172a' : '#ffffff',
                              fontSize: '1rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              backdropFilter: 'blur(10px)',
                              cursor: !bookingSelectedBrand ? 'not-allowed' : 'pointer',
                              opacity: !bookingSelectedBrand ? 0.6 : 1
                            }}
                          >
                            <option value="" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                              {!bookingSelectedBrand
                                ? (lang === 'es' ? '-- Selecciona primero la marca --' : '-- Select brand first --')
                                : (lang === 'es' ? '-- Selecciona el Modelo --' : '-- Select Model --')}
                            </option>
                            {bookingSelectedBrand && CAR_CATALOG[bookingSelectedBrand]?.map((model) => (
                              <option key={model} value={model} style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                                {model}
                              </option>
                            ))}
                            {bookingSelectedBrand && (
                              <option value="OTRO" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: 'var(--color-accent-light)', fontWeight: 600 }}>
                                {lang === 'es' ? 'Otro modelo (escribir manualmente)...' : 'Other model (type manually)...'}
                              </option>
                            )}
                          </select>

                          {/* Input manual si seleccionó OTRO modelo */}
                          {bookingSelectedModel === 'OTRO' && (
                            <input
                              type="text"
                              required
                              autoFocus
                              placeholder={lang === 'es' ? 'Escribe el modelo de tu auto...' : 'Type your vehicle model...'}
                              value={bookingForm.vehicleModel}
                              onChange={(e) => setBookingForm({ ...bookingForm, vehicleModel: e.target.value })}
                              style={{
                                width: '100%',
                                marginTop: '0.75rem',
                                padding: '0.85rem 1.2rem',
                                borderRadius: '12px',
                                border: theme === 'light' ? '1px solid #94a3b8' : '1px solid var(--color-accent-light)',
                                backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.9)',
                                color: theme === 'light' ? '#0f172a' : '#ffffff',
                                fontSize: '0.95rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Año del Vehículo */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        <Calendar size={16} color="var(--color-accent-light)" />
                        <span>{lang === 'es' ? 'Año del Vehículo' : 'Vehicle Year'}</span>
                      </label>
                      <select
                        required
                        value={bookingForm.vehicleYear}
                        onChange={(e) => setBookingForm({ ...bookingForm, vehicleYear: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          borderRadius: '14px',
                          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                          backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                          color: theme === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '1rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <option value="" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                          {lang === 'es' ? '-- Selecciona el Año --' : '-- Select Year --'}
                        </option>
                        {Array.from({ length: 37 }, (_, i) => 2026 - i).map((y) => (
                          <option key={y} value={String(y)} style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Servicio Requerido */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        <Wrench size={16} color="var(--color-accent-light)" />
                        <span>{currentT.formServiceType}</span>
                      </label>
                      <select
                        value={bookingForm.serviceType}
                        onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          borderRadius: '14px',
                          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                          backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
                          color: theme === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '1rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {currentT.services.map((s) => (
                          <option key={s.id} value={s.id} style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dirección de Visita con Buscador de Google Maps / Mapbox Interactivo */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                        <MapPin size={16} color="var(--color-accent-light)" />
                        <span>{currentT.formAddress}</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '20px',
                          padding: '0.4rem 0.9rem',
                          color: theme === 'light' ? '#0284c7' : '#38bdf8',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Crosshair size={14} />
                        <span>{lang === 'es' ? 'Usar mi ubicación actual' : 'Use my current location'}</span>
                      </button>
                    </div>

                    {/* Search Box con Autocompletado de Mapbox */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={17} style={{ position: 'absolute', left: '1rem', color: theme === 'light' ? '#64748b' : '#94a3b8' }} />
                        <input
                          type="text"
                          placeholder={lang === 'es' ? 'Busca tu colonia, calle o referencia en el mapa...' : 'Search your street, neighborhood or location on map...'}
                          value={mapSearchQuery}
                          onChange={(e) => handleMapSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.9rem 1.2rem 0.9rem 2.8rem',
                            borderRadius: '12px',
                            border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                            backgroundColor: theme === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.9)',
                            color: theme === 'light' ? '#0f172a' : '#ffffff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        {isSearchingMap && (
                          <span style={{ position: 'absolute', right: '1rem', fontSize: '0.8rem', color: 'var(--color-accent-light)' }}>{lang === 'es' ? 'Buscando...' : 'Searching...'}</span>
                        )}
                      </div>

                      {/* Dropdown de Resultados de Búsqueda */}
                      {searchResults.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 50,
                          backgroundColor: theme === 'light' ? '#ffffff' : '#0b1220',
                          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '12px',
                          marginTop: '0.4rem',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                          overflow: 'hidden',
                          maxHeight: '220px',
                          overflowY: 'auto'
                        }}>
                          {searchResults.map((result) => (
                            <div
                              key={result.id}
                              onClick={() => selectSearchResult(result.center, result.place_name)}
                              style={{
                                padding: '0.8rem 1.2rem',
                                fontSize: '0.9rem',
                                color: theme === 'light' ? '#0f172a' : '#f8fafc',
                                cursor: 'pointer',
                                borderBottom: theme === 'light' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.05)',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#f1f5f9' : 'rgba(56, 189, 248, 0.15)'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <MapPin size={16} color="var(--color-accent-light)" style={{ flexShrink: 0 }} />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.place_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mapbox Interactivo con Pin Personalizado */}
                    <div style={{
                      height: '340px',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                      marginBottom: '1rem',
                      position: 'relative'
                    }}>
                      <Map
                        {...mapViewState}
                        scrollZoom={false}
                        onMove={(evt) => setMapViewState(evt.viewState)}
                        onClick={handleMapClick}
                        mapStyle={theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/iannaviomar/cmfwxjr9w009901qmgmsi1172'}
                        mapboxAccessToken={MAPBOX_TOKEN}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {markerPos && (
                          <Marker longitude={markerPos.lng} latitude={markerPos.lat} anchor="bottom">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                              <div style={{
                                backgroundColor: 'rgba(2, 132, 199, 0.95)',
                                color: '#fff',
                                fontSize: '0.75rem',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                marginBottom: '6px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <MapPin size={13} />
                                <span>{lang === 'es' ? 'Punto de servicio seleccionado' : 'Selected service location'}</span>
                              </div>
                              <div style={{ position: 'relative' }}>
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  backgroundColor: '#06b6d4',
                                  border: '3px solid #fff',
                                  boxShadow: '0 0 15px #06b6d4'
                                }}></div>
                                <div style={{
                                  position: 'absolute',
                                  top: '-5px',
                                  left: '-5px',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: '#06b6d4',
                                  opacity: 0.4,
                                  animation: 'pulse-glow 2s infinite'
                                }}></div>
                              </div>
                            </div>
                          </Marker>
                        )}
                      </Map>

                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.92)',
                        backdropFilter: 'blur(8px)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: theme === 'light' ? '#0f172a' : '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <MapPin size={13} color="var(--color-accent-light)" />
                        <span>{lang === 'es' ? 'Toca cualquier punto del mapa para mover el pin de tu servicio' : 'Tap anywhere on map to move your service pin location'}</span>
                      </div>
                    </div>

                    {/* Input de Dirección en Texto / Enlace de Mapa */}
                    <input
                      type="text"
                      required
                      placeholder={lang === 'es' ? 'Dirección completa o enlace de mapa georreferenciado...' : 'Full address or map location link...'}
                      value={bookingForm.address}
                      onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.9rem 1.2rem',
                        borderRadius: '12px',
                        border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.25)',
                        backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(2, 6, 23, 0.7)',
                        color: theme === 'light' ? '#0f172a' : '#ffffff',
                        fontSize: '1rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Notas o Detalles */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                      {currentT.formNotes}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={lang === 'es' ? 'Describe si hay algún ruido, luz encendida en el tablero o requerimiento específico...' : 'Describe any vehicle symptoms, dashboard warning lights, or specific requests...'}
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.9rem 1.2rem',
                        borderRadius: '12px',
                        border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.25)',
                        backgroundColor: theme === 'light' ? '#f8fafc' : 'rgba(2, 6, 23, 0.7)',
                        color: theme === 'light' ? '#0f172a' : '#ffffff',
                        fontSize: '1rem',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Botón de Enviar */}
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                      type="submit"
                      disabled={isSubmittingBooking}
                      className="glow-effect"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '1.2rem 3.5rem',
                        color: '#fff',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        cursor: isSubmittingBooking ? 'wait' : 'pointer',
                        letterSpacing: '0.5px',
                        boxShadow: '0 8px 30px rgba(2, 132, 199, 0.4)',
                        transition: 'transform 0.2s',
                        opacity: isSubmittingBooking ? 0.7 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <span>{isSubmittingBooking ? currentT.formSubmitting : currentT.formSubmit}</span>
                      <ArrowRight size={20} />
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: theme === 'light' ? '#64748b' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <Lock size={14} color="var(--color-accent-light)" />
                      <span>{lang === 'es' ? 'Tus datos están protegidos con cifrado y solo serán utilizados para la gestión de tu servicio.' : 'Your data is encrypted and protected. It will only be used for service management.'}</span>
                    </p>
                  </div>

                </form>
              )}
            </div>

          </div>
        </section>

        {/* --- FOOTER ELEGANTE Y COMPLETO --- */}
        <footer style={{
          padding: '4.5rem 5% 2.5rem 5%',
          borderTop: '1px solid var(--glass-border)',
          backgroundColor: 'var(--bg-secondary)',
          transition: 'background-color 0.3s',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem',
            textAlign: 'left'
          }}>
            {/* Columna 1: Marca y Propósito */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '2px solid var(--color-accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px var(--color-accent-glow)'
                }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--color-accent)' }}></div>
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 300, letterSpacing: '4px', color: 'var(--text-primary)' }}>AURA</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '340px', margin: 0 }}>
                {lang === 'es'
                  ? 'Plataforma integral de ingeniería y mantenimiento automotriz certificado a domicilio y en talleres especializados.'
                  : 'Comprehensive automotive engineering and certified maintenance platform, delivered at your doorstep and certified workshops.'}
              </p>
            </div>

            {/* Columna 2: Navegación Rápida */}
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Navegación' : 'Navigation'}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <li>
                  <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent-light)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    {currentT.navFeatures}
                  </a>
                </li>
                <li>
                  <a href="#mision-vision" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent-light)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    {currentT.navMisionVision}
                  </a>
                </li>
                <li>
                  <a href="#domicilio" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.92rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent-light)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    {currentT.navReserve}
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 3: Servicios & Soporte */}
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Servicios' : 'Services'}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                <li>{lang === 'es' ? 'Mantenimiento Preventivo a Domicilio' : 'Preventive Maintenance at Home'}</li>
                <li>{lang === 'es' ? 'Diagnóstico por Escáner OBD-II' : 'OBD-II Computer Diagnostic'}</li>
                <li>{lang === 'es' ? 'Expediente Clínico Digital' : 'Digital Service History'}</li>
                <li>{lang === 'es' ? 'Mapeo Técnico de Daños' : 'Technical Damage Mapping'}</li>
              </ul>
            </div>

            {/* Columna 4: Portal y Accesos */}
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.5px' }}>
                {lang === 'es' ? 'Portal de Clientes' : 'Client Access'}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {lang === 'es'
                  ? 'Gestiona tu auto, revisa tus bitácoras y agenda servicios desde tu cuenta.'
                  : 'Manage your vehicle, review inspection records, and schedule services from your portal.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setIsAccessModalOpen(true); setAccessSuccess(false); setAccessError(''); }}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0.55rem 1.25rem',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  {currentT.portalBtn}
                </button>
                <Link
                  href="/login"
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '20px',
                    padding: '0.55rem 1.25rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  {currentT.loginBtn}
                </Link>
              </div>
            </div>
          </div>

          {/* Barra Inferior con Derechos */}
          <div style={{
            maxWidth: '1240px',
            margin: '0 auto',
            paddingTop: '2rem',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)'
          }}>
            <span>{currentT.footerRights}</span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>{lang === 'es' ? 'Tecnología e Ingeniería Automotriz' : 'Automotive Tech & Engineering'}</span>
            </div>
          </div>
        </footer>

        {/* --- MODAL DE SOLICITUD DE ACCESO AL SISTEMA --- */}
        {isAccessModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(7, 10, 19, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
          }}>
            <div className="glass-card" style={{
              width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto',
              padding: '2.5rem', position: 'relative', borderRadius: '24px',
              border: '1px solid rgba(56, 189, 248, 0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              background: 'rgba(11, 18, 32, 0.95)'
            }}>
              <button
                onClick={() => setIsAccessModalOpen(false)}
                style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8',
                  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{
                  display: 'inline-flex', padding: '8px 16px', borderRadius: '30px',
                  background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.3)',
                  color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem'
                }}>
                  {lang === 'es' ? 'Portal de Clientes & Acceso Exclusivo' : 'Client Portal & Exclusive Access'}
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {lang === 'es' ? 'Solicitar Acceso a Aura' : 'Request Access to Aura'}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  {lang === 'es' ? 'Completa tus datos para crear tu cuenta. Una vez aprobada por nuestro equipo, recibirás tus credenciales por correo electrónico.' : 'Complete your details to create your account. Once approved by our team, you will receive your credentials via email.'}
                </p>
              </div>

              {accessSuccess ? (
                <div style={{
                  textAlign: 'center', padding: '2rem 1rem', background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    color: '#10b981'
                  }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', margin: '0 0 0.75rem 0' }}>
                    {lang === 'es' ? '¡Solicitud Enviada con Éxito!' : 'Request Successfully Submitted!'}
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                    {lang === 'es'
                      ? <>Hemos registrado tu solicitud para <strong>{accessForm.email}</strong>. Nuestro equipo administrador la revisará y recibirás tus accesos directos por correo electrónico una vez aprobada.</>
                      : <>We have received your application for <strong>{accessForm.email}</strong>. Our team will review it and you will receive your credentials via email once approved.</>}
                  </p>
                  <button
                    onClick={() => setIsAccessModalOpen(false)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '30px',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem'
                    }}
                  >
                    {lang === 'es' ? 'Entendido, Cerrar' : 'Got it, Close'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAccessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {accessError && (
                    <div style={{
                      padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                      <span>{accessError}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {lang === 'es' ? 'Nombre' : 'First Name'} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Juan"
                        value={accessForm.firstName}
                        onChange={(e) => setAccessForm({ ...accessForm, firstName: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {lang === 'es' ? 'Apellido' : 'Last Name'} <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Pérez"
                        value={accessForm.lastName}
                        onChange={(e) => setAccessForm({ ...accessForm, lastName: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      {lang === 'es' ? 'Correo Electrónico' : 'Email Address'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="tu@correo.com"
                      value={accessForm.email}
                      onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {lang === 'es' ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}
                      </label>
                      <input
                        type="tel"
                        placeholder="55 1234 5678"
                        value={accessForm.phone}
                        onChange={(e) => setAccessForm({ ...accessForm, phone: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {lang === 'es' ? 'Tipo de Perfil' : 'Profile Type'}
                      </label>
                      <select
                        value={accessForm.role}
                        onChange={(e) => setAccessForm({ ...accessForm, role: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                      >
                        <option value="Cliente">{lang === 'es' ? 'Cliente (Dueño de vehículo)' : 'Client (Vehicle Owner)'}</option>
                        <option value="Asesor">{lang === 'es' ? 'Asesor / Colaborador' : 'Advisor / Team Member'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Sección de Vehículo Inicial */}
                  <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Car size={18} />
                      <span>{lang === 'es' ? 'Datos de tu Auto (Opcional)' : 'Vehicle Details (Optional)'}</span>
                    </h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {lang === 'es' ? 'Si los ingresas ahora, tu auto quedará automáticamente dado de alta en tu perfil al aprobarse tu cuenta.' : 'If provided now, your vehicle will be registered immediately to your profile upon approval.'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {/* Marca Selector */}
                      <div>
                        <select
                          value={accessSelectedBrand}
                          onChange={(e) => {
                            const b = e.target.value;
                            setAccessSelectedBrand(b);
                            if (b === 'OTRA') {
                              setAccessForm((prev) => ({ ...prev, vehicleBrand: '', vehicleModel: '' }));
                              setAccessSelectedModel('OTRO');
                            } else {
                              setAccessForm((prev) => ({ ...prev, vehicleBrand: b, vehicleModel: '' }));
                              setAccessSelectedModel('');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(2, 6, 23, 0.8)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="" style={{ background: '#0b1220', color: '#fff' }}>
                            {lang === 'es' ? '-- Marca --' : '-- Brand --'}
                          </option>
                          {Object.keys(CAR_CATALOG).map((brand) => (
                            <option key={brand} value={brand} style={{ background: '#0b1220', color: '#fff' }}>
                              {brand}
                            </option>
                          ))}
                          <option value="OTRA" style={{ background: '#0b1220', color: '#38bdf8', fontWeight: 600 }}>
                            {lang === 'es' ? 'Otra marca (escribir)...' : 'Other brand (type)...'}
                          </option>
                        </select>

                        {accessSelectedBrand === 'OTRA' && (
                          <input
                            type="text"
                            autoFocus
                            placeholder={lang === 'es' ? 'Escribe la marca...' : 'Type brand...'}
                            value={accessForm.vehicleBrand}
                            onChange={(e) => setAccessForm({ ...accessForm, vehicleBrand: e.target.value })}
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.9)', border: '1px solid #38bdf8', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                          />
                        )}
                      </div>

                      {/* Modelo Selector */}
                      <div>
                        {accessSelectedBrand === 'OTRA' ? (
                          <input
                            type="text"
                            placeholder={lang === 'es' ? 'Escribe el modelo...' : 'Type model...'}
                            value={accessForm.vehicleModel}
                            onChange={(e) => setAccessForm({ ...accessForm, vehicleModel: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                          />
                        ) : (
                          <>
                            <select
                              disabled={!accessSelectedBrand}
                              value={accessSelectedModel}
                              onChange={(e) => {
                                const m = e.target.value;
                                setAccessSelectedModel(m);
                                if (m === 'OTRO') {
                                  setAccessForm((prev) => ({ ...prev, vehicleModel: '' }));
                                } else {
                                  setAccessForm((prev) => ({ ...prev, vehicleModel: m }));
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '0.65rem 0.85rem',
                                borderRadius: '8px',
                                background: 'rgba(2, 6, 23, 0.8)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#fff',
                                outline: 'none',
                                fontSize: '0.85rem',
                                cursor: !accessSelectedBrand ? 'not-allowed' : 'pointer',
                                opacity: !accessSelectedBrand ? 0.6 : 1
                              }}
                            >
                              <option value="" style={{ background: '#0b1220', color: '#fff' }}>
                                {!accessSelectedBrand
                                  ? (lang === 'es' ? '-- Selecciona marca --' : '-- Select brand --')
                                  : (lang === 'es' ? '-- Modelo --' : '-- Model --')}
                              </option>
                              {accessSelectedBrand && CAR_CATALOG[accessSelectedBrand]?.map((model) => (
                                <option key={model} value={model} style={{ background: '#0b1220', color: '#fff' }}>
                                  {model}
                                </option>
                              ))}
                              {accessSelectedBrand && (
                                <option value="OTRO" style={{ background: '#0b1220', color: '#38bdf8', fontWeight: 600 }}>
                                  {lang === 'es' ? 'Otro modelo (escribir)...' : 'Other model (type)...'}
                                </option>
                              )}
                            </select>

                            {accessSelectedModel === 'OTRO' && (
                              <input
                                type="text"
                                autoFocus
                                placeholder={lang === 'es' ? 'Escribe el modelo...' : 'Type model...'}
                                value={accessForm.vehicleModel}
                                onChange={(e) => setAccessForm({ ...accessForm, vehicleModel: e.target.value })}
                                style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.9)', border: '1px solid #38bdf8', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <input
                        type="number"
                        placeholder="Año (ej. 2022)"
                        value={accessForm.vehicleYear || ''}
                        onChange={(e) => setAccessForm({ ...accessForm, vehicleYear: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Placas (ej. ABC-123-D)"
                        value={accessForm.vehiclePlates}
                        onChange={(e) => setAccessForm({ ...accessForm, vehiclePlates: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                        Fecha o Detalle del Último Mantenimiento Realizado:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Hace 3 meses (cambio de aceite y frenos)"
                        value={accessForm.lastMaintenanceDate}
                        onChange={(e) => setAccessForm({ ...accessForm, lastMaintenanceDate: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAccess}
                    style={{
                      marginTop: '0.5rem', padding: '1rem', borderRadius: '30px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                      color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem',
                      cursor: 'pointer', boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
                      opacity: isSubmittingAccess ? 0.7 : 1
                    }}
                  >
                    {isSubmittingAccess ? 'Enviando Solicitud...' : 'Enviar Solicitud de Acceso'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
