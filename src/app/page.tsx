'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { safeFetch } from '../lib/api-config';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('react-map-gl').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', width: '100%', minHeight: '300px', backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 600 }}>
      🗺️ Cargando Mapa Interactivo...
    </div>
  )
});

const Marker = dynamic(() => import('react-map-gl').then((mod) => mod.Marker), {
  ssr: false
});

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
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState('');

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
      navFeatures: 'Servicios',
      navMisionVision: 'Misión y Visión',
      navReserve: 'Reserva a Domicilio',
      loginBtn: 'Iniciar Sesión',
      demoBtn: 'Ver Demo',
      heroBadge: 'SERVICIO AUTOMOTRIZ 100% A DOMICILIO',
      heroTitle: 'El mantenimiento inteligente de tu auto en tu domicilio',
      heroDesc: 'Solicita revisiones, servicios preventivos y diagnósticos directamente en la puerta de tu casa u oficina con atención técnica profesional.',
      ctaBtn: 'Solicitar Servicio A Domicilio',
      featuresTitle: 'Ecosistema de Mantenimiento a Domicilio',
      featuresSubtitle: 'Atención técnica profesional directamente donde se encuentre tu vehículo.',
      feat1Title: 'Reserva a Domicilio',
      feat1Desc: 'Solicita mantenimientos, revisiones y diagnósticos directamente a tu casa u oficina.',
      feat2Title: 'Atención Satelital y Coordenadas GPS',
      feat2Desc: 'Selecciona tu ubicación exacta en el mapa interactivo para la llegada rápida de nuestro mecánico.',
      feat3Title: 'Taller Móvil Certificado',
      feat3Desc: 'Equipos y herramientas de diagnóstico profesional llevados a la puerta de tu hogar.',
      misionTitle: 'Nuestra Misión',
      misionDesc: 'Transformar el mantenimiento automotriz en una experiencia 100% cómoda, transparente y profesional, llevando talleres móviles certificados directamente a la puerta de tu casa u oficina.',
      visionTitle: 'Nuestra Visión',
      visionDesc: 'Consolidarnos como el ecosistema de mantenimiento automotriz a domicilio líder en Latinoamérica, impulsado por tecnología de vanguardia, máxima confianza y excelencia técnica.',
      networkBadge: 'ATENCIÓN DIRECTA',
      networkTitle: 'Reserva Tu Servicio a Domicilio',
      networkDesc: 'Por el momento todos nuestros servicios se realizan de forma 100% a domicilio. Completa tus datos para agendar la visita de un mecánico certificado.',
      formFullName: 'Nombre Completo *',
      formPhone: 'Teléfono / WhatsApp de Contacto *',
      formVehicle: 'Auto (Marca, Modelo y Año) *',
      formServiceType: 'Tipo de Servicio',
      formDate: 'Fecha Deseada',
      formAddress: 'Ubicación / Dirección a Domicilio *',
      formNotes: 'Notas Adicionales / Instrucciones de Llegada',
      formSubmit: 'Confirmar y Solicitar Cita a Domicilio',
      formSubmitting: 'Enviando solicitud...',
      formRequiredErr: 'Por favor completa los campos obligatorios (Nombre, Teléfono, Vehículo y Dirección)',
      formSuccessTitle: '¡Solicitud a Domicilio Recibida!',
      formSuccessDesc: 'Un asesor técnico de AURA revisará tu solicitud y se pondrá en contacto contigo en breve para confirmar el horario de llegada del mecánico.',
      formAnotherBtn: 'Realizar Otra Solicitud →',
      footerRights: '© 2026 Aura Inc. Todos los derechos reservados.'
    },
    en: {
      navFeatures: 'Services',
      navMisionVision: 'Mission & Vision',
      navReserve: 'Home Service Booking',
      loginBtn: 'Log In',
      demoBtn: 'Watch Demo',
      heroBadge: '100% MOBILE AUTOMOTIVE SERVICE',
      heroTitle: 'Smart vehicle maintenance at your doorstep',
      heroDesc: 'Request inspections, preventive services, and diagnostics directly at your home or office with certified mobile technicians.',
      ctaBtn: 'Book Home Service',
      featuresTitle: 'Mobile Maintenance Ecosystem',
      featuresSubtitle: 'Professional technical assistance directly wherever your vehicle is.',
      feat1Title: 'Home Booking',
      feat1Desc: 'Request maintenance, inspections, and diagnostics directly at your home or office.',
      feat2Title: 'Satellite & GPS Coordinates',
      feat2Desc: 'Select your exact location on the interactive map for fast arrival of our mobile mechanic.',
      feat3Title: 'Certified Mobile Workshop',
      feat3Desc: 'Professional diagnostic tools brought straight to your doorstep.',
      misionTitle: 'Our Mission',
      misionDesc: 'Transforming automotive maintenance into a 100% comfortable, transparent, and professional experience by delivering certified mobile workshops right to your home or office.',
      visionTitle: 'Our Vision',
      visionDesc: 'To consolidate as the leading mobile home automotive maintenance ecosystem in Latin America, powered by cutting-edge technology, maximum trust, and technical excellence.',
      networkBadge: 'DIRECT ASSISTANCE',
      networkTitle: 'Book Your Home Service',
      networkDesc: 'All our services are currently 100% mobile. Complete your details to schedule a certified mechanic visit.',
      formFullName: 'Full Name *',
      formPhone: 'Contact Phone / WhatsApp *',
      formVehicle: 'Vehicle (Make, Model, Year) *',
      formServiceType: 'Service Type',
      formDate: 'Desired Date',
      formAddress: 'Home Address / Location *',
      formNotes: 'Additional Notes / Arrival Instructions',
      formSubmit: 'Confirm & Book Home Service',
      formSubmitting: 'Submitting request...',
      formRequiredErr: 'Please fill in all required fields (Name, Phone, Vehicle, and Address)',
      formSuccessTitle: 'Home Service Request Received!',
      formSuccessDesc: 'An AURA technical advisor will review your request and contact you shortly to confirm the mechanic arrival time.',
      formAnotherBtn: 'Submit Another Request →',
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
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>
        
        {/* Background Glow Orbs */}
        <div className="bg-glow-orb" style={{ top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)' }}></div>
        <div className="bg-glow-orb" style={{ bottom: '-15%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(100px)' }}></div>
        <div className="bg-glow-orb" style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(120px)', pointerEvents: 'none' }}></div>

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
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} style={{
              marginTop: '1rem', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              borderRadius: '30px', padding: '0.8rem 2rem', color: '#fff', fontSize: '1rem',
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
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="glow-effect" style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2.5rem',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              {currentT.ctaBtn}
            </button>
            <button style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '1rem 2.5rem',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}>
              {currentT.demoBtn}
            </button>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" style={{ padding: '8rem 5%', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '1rem', letterSpacing: '-1px' }}>{currentT.featuresTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', fontWeight: 300 }}>{currentT.featuresSubtitle}</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Feature 1 */}
            <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-accent-light)' }}>🗓️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>{currentT.feat1Title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{currentT.feat1Desc}</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-emerald)' }}>📍</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>{currentT.feat2Title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{currentT.feat2Desc}</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#a78bfa' }}>🛡️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>{currentT.feat3Title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{currentT.feat3Desc}</p>
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
                Impulsamos el futuro del mantenimiento automotriz llevando talleres móviles certificados directamente a donde te encuentres.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
              {/* Misión Card */}
              <div className="ios-glass-card" style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  🎯
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
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  🚀
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
                    fontSize: '2.5rem',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                  }}>
                    ✨
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
                      cursor: 'pointer'
                    }}
                  >
                    {currentT.formAnotherBtn}
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
                      fontSize: '0.95rem'
                    }}>
                      ⚠️ {formErrorMsg}
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

                    {/* Marca del Vehículo */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        🚗 {lang === 'es' ? 'Marca del Vehículo' : 'Vehicle Brand'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Toyota, Honda, Ford, Nissan..."
                        value={bookingForm.vehicleBrand}
                        onChange={(e) => setBookingForm({ ...bookingForm, vehicleBrand: e.target.value })}
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

                    {/* Modelo del Vehículo */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        🚘 {lang === 'es' ? 'Modelo del Vehículo' : 'Vehicle Model'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Corolla, Civic, Mustang, Hilux..."
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
                    </div>

                    {/* Año del Vehículo */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        📅 {lang === 'es' ? 'Año del Vehículo' : 'Vehicle Year'}
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
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        🛠️ {currentT.formServiceType}
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
                        <option value="Mantenimiento Preventivo a Domicilio" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Mantenimiento Preventivo a Domicilio</option>
                        <option value="Diagnóstico por Escáner / Check Engine" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Diagnóstico por Escáner / Check Engine</option>
                        <option value="Cambio de Aceite y Filtros" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Cambio de Aceite y Filtros</option>
                        <option value="Revisión de Frenos y Suspensión" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Revisión de Frenos y Suspensión</option>
                        <option value="Auxilio Vial / Cambio de Batería" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Auxilio Vial / Cambio de Batería</option>
                        <option value="Inspección Pre-Compra de Vehículo" style={{ background: theme === 'light' ? '#ffffff' : '#0f172a', color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Inspección Pre-Compra de Vehículo</option>
                      </select>
                    </div>
                  </div>

                  {/* Dirección de Visita con Buscador de Google Maps / Mapbox Interactivo */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                        📍 {currentT.formAddress}
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
                        🎯 {lang === 'es' ? 'Usar mi ubicación actual' : 'Use my current location'}
                      </button>
                    </div>

                    {/* Search Box con Autocompletado de Mapbox */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '1rem', color: theme === 'light' ? '#64748b' : '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
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
                              <span>📍</span>
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
                                fontWeight: 700
                              }}>
                                📍 {lang === 'es' ? 'Punto de servicio a domicilio' : 'Home service location pin'}
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
                        fontWeight: 600
                      }}>
                        💡 {lang === 'es' ? 'Toca cualquier punto del mapa para mover el pin de tu domicilio' : 'Tap anywhere on map to move your home pin location'}
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
                        opacity: isSubmittingBooking ? 0.7 : 1
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {isSubmittingBooking ? currentT.formSubmitting : `${currentT.formSubmit} ✨`}
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: theme === 'light' ? '#64748b' : 'var(--text-secondary)' }}>
                      🔒 {lang === 'es' ? 'Tus datos están protegidos con cifrado y solo serán utilizados para la gestión de tu servicio.' : 'Your data is encrypted and protected. It will only be used for service management.'}
                    </p>
                  </div>

                </form>
              )}
            </div>

          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer style={{
          padding: '4rem 5% 2rem 5%',
          borderTop: '1px solid var(--glass-border)',
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          transition: 'background-color 0.3s'
        }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{currentT.footerRights}</span>
          </div>
        </footer>

      </div>
    </>
  );
}
