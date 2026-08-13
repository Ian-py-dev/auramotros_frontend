'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [activeRole, setActiveRole] = useState<'client' | 'mechanic' | 'seller' | 'admin'>('client');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    vehicle: '',
    serviceType: 'Mantenimiento Preventivo a Domicilio',
    address: '',
    date: '',
    notes: ''
  });
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

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
      navFeatures: 'Funcionalidades',
      navRoles: 'Roles',
      navTracking: 'Rastreo',
      navReserve: 'Reserva a Domicilio',
      loginBtn: 'Iniciar Sesión',
      demoBtn: 'Ver Demo',
      heroBadge: 'SERVICIO AUTOMOTRIZ 100% A DOMICILIO',
      heroTitle: 'El mantenimiento inteligente de tu auto en tu domicilio',
      heroDesc: 'Solicita revisiones, servicios preventivos y diagnósticos directamente en la puerta de tu casa u oficina con seguimiento satelital en tiempo real.',
      ctaBtn: 'Solicitar Servicio A Domicilio',
      featuresTitle: 'Ecosistema de Mantenimiento a Domicilio',
      featuresSubtitle: 'Atención técnica profesional directamente donde se encuentre tu vehículo.',
      feat1Title: 'Reserva a Domicilio',
      feat1Desc: 'Solicita mantenimientos, revisiones y diagnósticos directamente a tu casa u oficina.',
      feat2Title: 'Rastreo Georreferenciado',
      feat2Desc: 'Escribe comentarios sobre las reservas adjuntando enlaces de Google Maps y visualiza el vehículo o mecánico al instante.',
      feat3Title: 'Permisos por Roles',
      feat3Desc: 'Una estructura de seguridad robusta donde mecánicos, vendedores y administradores colaboran de forma aislada.',
      rolesTitle: 'Flujos de Trabajo Inteligentes',
      rolesSubtitle: 'Explora el rol que se adapta a las necesidades de tu empresa.',
      roleBadge: 'ROL DETALLADO',
      roleFuncHeader: 'Funciones Clave:',
      trackingBadge: 'TECNOLOGÍA DE SEGUIMIENTO',
      trackingTitle: 'Conversión Automática de Enlaces de Mapas',
      trackingDesc: 'Nuestra arquitectura extrae automáticamente las coordenadas geográficas de los enlaces estándar de Google Maps pegados en los comentarios de las reservas. No requiere configuraciones manuales.',
      trackStep1: 'Copia un enlace de Google Maps desde tu celular.',
      trackStep2: 'Pégalo en la sección de comentarios de tu orden de servicio.',
      trackStep3: 'El sistema lo mapea automáticamente en tiempo real.',
      demoTitle: 'Demo: Simulador de Coordenadas',
      demoStatus: 'En Línea',
      demoCommentFrom: 'Mecánico a domicilio dice:',
      demoCommentText: 'En camino a la dirección del cliente. Llegada estimada en 15 minutos.',
      demoCopyBtn: 'Copiar',
      demoCopiedBtn: '¡Copiado!',
      demoMapTaller: 'Base Aura',
      demoMapVehicle: 'Mecánico en Ruta',
      demoDetectedLabel: 'Coordenadas detectadas: Lat 23.63, Lng -102.55',
      networkBadge: 'ATENCIÓN DIRECTA',
      networkTitle: 'Reserva Tu Servicio a Domicilio',
      networkDesc: 'Por el momento todos nuestros servicios se realizan de forma 100% a domicilio. Completa tus datos para agendar la visita de un mecánico certificado.',
      footerRights: '© 2026 Aura Inc. Todos los derechos reservados.'
    },
    en: {
      navFeatures: 'Features',
      navRoles: 'Roles',
      navTracking: 'Tracking',
      navReserve: 'Home Service',
      loginBtn: 'Log In',
      demoBtn: 'Watch Demo',
      heroBadge: '100% MOBILE AUTOMOTIVE SERVICE',
      heroTitle: 'Smart vehicle maintenance at your doorstep',
      heroDesc: 'Request inspections, preventive services, and diagnostics directly at your home or office with real-time satellite tracking.',
      ctaBtn: 'Book Home Service',
      featuresTitle: 'Mobile Maintenance Ecosystem',
      featuresSubtitle: 'Professional technical assistance directly wherever your vehicle is.',
      feat1Title: 'Home Booking',
      feat1Desc: 'Request maintenance, inspections, and diagnostics directly at your home or office.',
      feat2Title: 'Georeferenced Tracking',
      feat2Desc: 'Write comments on bookings attaching Google Maps links and visualize the vehicle or mechanic instantly.',
      feat3Title: 'Role Permissions',
      feat3Desc: 'A robust security structure where mechanics, sellers, and administrators collaborate in an isolated way.',
      rolesTitle: 'Intelligent Workflows',
      rolesSubtitle: 'Explore the role that suits your company\'s needs.',
      roleBadge: 'DETAILED ROLE',
      roleFuncHeader: 'Key Functions:',
      trackingBadge: 'TRACKING TECHNOLOGY',
      trackingTitle: 'Automatic Map Link Conversion',
      trackingDesc: 'Our architecture automatically extracts geographic coordinates from standard Google Maps links pasted in booking comments. No manual configuration required.',
      trackStep1: 'Copy a Google Maps link from your phone.',
      trackStep2: 'Paste it in the comments section of your service order.',
      trackStep3: 'The system automatically maps it in real time.',
      demoTitle: 'Demo: Coordinates Simulator',
      demoStatus: 'Online',
      demoCommentFrom: 'Mobile mechanic says:',
      demoCommentText: 'On my way to the customer\'s address. Estimated arrival in 15 minutes.',
      demoCopyBtn: 'Copy',
      demoCopiedBtn: 'Copied!',
      demoMapTaller: 'Aura Base',
      demoMapVehicle: 'Mechanic En Route',
      demoDetectedLabel: 'Detected coordinates: Lat 23.63, Lng -102.55',
      networkBadge: 'DIRECT ASSISTANCE',
      networkTitle: 'Book Your Home Service',
      networkDesc: 'All our services are currently 100% mobile. Complete your details to schedule a certified mechanic visit.',
      footerRights: '© 2026 Aura Inc. All rights reserved.'
    }
  };

  const roles = {
    client: {
      title: { es: 'Cliente', en: 'Client' },
      desc: {
        es: 'Controla el historial de tu auto, programa citas y solicita servicios de mantenimiento a domicilio con seguimiento en vivo en el mapa.',
        en: 'Control your car\'s history, schedule appointments, and request home maintenance services with live tracking on the map.'
      },
      features: {
        es: ['Historial digital de mantenimiento', 'Agendamiento rápido en talleres', 'Servicio a domicilio con rastreo'],
        en: ['Digital maintenance history', 'Fast workshop scheduling', 'Home service with tracking']
      },
      badgeColor: '#38bdf8'
    },
    mechanic: {
      title: { es: 'Mecánico', en: 'Mechanic' },
      desc: {
        es: 'Gestiona tus órdenes de trabajo asignadas, actualiza el estado de las revisiones y añade comentarios con la ubicación del servicio.',
        en: 'Manage your assigned work orders, update the status of inspections, and add comments with the service location.'
      },
      features: {
        es: ['Listado de citas asignadas', 'Actualización de estatus en tiempo real', 'Bitácora técnica digital'],
        en: ['List of assigned appointments', 'Real-time status updates', 'Digital technical logbook']
      },
      badgeColor: '#10b981'
    },
    seller: {
      title: { es: 'Vendedor', en: 'Seller' },
      desc: {
        es: 'Supervisa el inventario de refacciones y vehículos, gestiona clientes interesados y asocia servicios de mantenimiento a las ventas.',
        en: 'Supervise spare parts and vehicle inventory, manage interested leads, and associate maintenance services with sales.'
      },
      features: {
        es: ['Gestión de catálogo de vehículos', 'Fidelización de clientes', 'Venta cruzada de mantenimientos'],
        en: ['Vehicle catalog management', 'Customer loyalty program', 'Maintenance cross-selling']
      },
      badgeColor: '#fb7185'
    },
    admin: {
      title: { es: 'Administrador', en: 'Administrator' },
      desc: {
        es: 'Control total de la plataforma. Configura roles, asigna permisos avanzados, administra talleres afiliados y supervisa métricas globales.',
        en: 'Full control of the platform. Configure roles, assign advanced permissions, manage affiliated workshops, and monitor global metrics.'
      },
      features: {
        es: ['Control de accesos y roles', 'Métricas de rendimiento de talleres', 'Gestión de la base de datos'],
        en: ['Access control and roles', 'Workshop performance metrics', 'Database management']
      },
      badgeColor: '#a78bfa'
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

  const copyGoogleMapsLink = () => {
    navigator.clipboard.writeText('https://maps.google.com/?q=23.63,-102.55');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
            <a href="#roles" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s', fontSize: '1rem', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>{currentT.navRoles}</a>
            <a href="#tracking" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s', fontSize: '1rem', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>{currentT.navTracking}</a>
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
            <a href="#roles" onClick={() => setIsMobileMenuOpen(false)} style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 700 }}>{currentT.navRoles}</a>
            <a href="#tracking" onClick={() => setIsMobileMenuOpen(false)} style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 700 }}>{currentT.navTracking}</a>
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

        {/* --- INTERACTIVE ROLES SECTION --- */}
        <section id="roles" style={{
          padding: '6rem 5%',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--glass-border)',
          borderBottom: '1px solid var(--glass-border)',
          position: 'relative',
          transition: 'background-color 0.3s ease'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>{currentT.rolesTitle}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem' }}>{currentT.rolesSubtitle}</p>
            </div>

            {/* Roles Buttons Grid */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '3rem'
            }}>
              {(Object.keys(roles) as Array<keyof typeof roles>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveRole(key)}
                  style={{
                    background: activeRole === key ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${activeRole === key ? 'var(--color-accent-light)' : 'var(--glass-border)'}`,
                    borderRadius: '12px',
                    padding: '0.8rem 2rem',
                    color: activeRole === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: activeRole === key ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none'
                  }}
                >
                  {roles[key].title[lang]}
                </button>
              ))}
            </div>

            {/* Role Card Detail */}
            <div className="glass-card" style={{
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              borderLeft: `5px solid ${roles[activeRole].badgeColor}`
            }}>
              <span style={{
                color: roles[activeRole].badgeColor,
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>{currentT.roleBadge}</span>
              
              <h3 style={{ fontSize: '2.2rem', fontWeight: 800 }}>{roles[activeRole].title[lang]}</h3>
              
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {roles[activeRole].desc[lang]}
              </p>

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>{currentT.roleFuncHeader}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {roles[activeRole].features[lang].map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: roles[activeRole].badgeColor }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- TRACKING DEMO (INTEGRATED GRAPHICS) --- */}
        <section id="tracking" style={{ padding: '6rem 5%', position: 'relative' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            
            {/* Left Info */}
            <div>
              <div style={{ color: 'var(--color-accent-light)', fontWeight: 700, marginBottom: '1rem', letterSpacing: '1px' }}>{currentT.trackingBadge}</div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem' }}>{currentT.trackingTitle}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                {currentT.trackingDesc}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'var(--color-accent-light)', fontWeight: 'bold' }}>1</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{currentT.trackStep1}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 'bold' }}>2</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{currentT.trackStep2}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(167, 139, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>3</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{currentT.trackStep3}</p>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(56, 189, 248, 0.15)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currentT.demoTitle}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-emerald)', borderRadius: '50%', display: 'inline-block' }}></span>
                  {currentT.demoStatus}
                </span>
              </div>

              {/* Chat/Comment Mock */}
              <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--glass-border)', transition: 'background-color 0.3s' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{currentT.demoCommentFrom}</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  &ldquo;{currentT.demoCommentText}&rdquo;
                </p>
                <div style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.06)',
                  border: '1px dashed rgba(56, 189, 248, 0.3)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-light)', fontFamily: 'monospace' }}>
                    https://maps.google.com/?q=23.63,-102.55
                  </span>
                  <button 
                    onClick={copyGoogleMapsLink}
                    style={{
                      background: 'var(--color-accent)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.35rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {copiedLink ? currentT.demoCopiedBtn : currentT.demoCopyBtn}
                  </button>
                </div>
              </div>

              {/* Map Preview Graph */}
              <div style={{
                height: '180px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s'
              }}>
                {/* Simulated Map lines */}
                <svg width="100%" height="100%" style={{ position: 'absolute', opacity: theme === 'dark' ? 0.15 : 0.4 }}>
                  <line x1="0" y1="50" x2="100%" y2="50" stroke="var(--text-primary)" strokeWidth="1" />
                  <line x1="0" y1="120" x2="100%" y2="120" stroke="var(--text-primary)" strokeWidth="1" />
                  <line x1="120" y1="0" x2="120" y2="100%" stroke="var(--text-primary)" strokeWidth="1" />
                  <line x1="280" y1="0" x2="280" y2="100%" stroke="var(--text-primary)" strokeWidth="1" />
                  <path d="M 0 100 Q 150 150 400 60" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="5" />
                </svg>

                {/* Simulated Location Pins */}
                <div style={{
                  position: 'absolute',
                  left: '35%',
                  top: '40%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    backgroundColor: 'var(--color-emerald)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    marginBottom: '2px',
                    boxShadow: '0 2px 10px rgba(16,185,129,0.3)'
                  }}>
                    {currentT.demoMapTaller}
                  </div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)', border: '2px solid #fff', boxShadow: '0 0 10px var(--color-emerald)' }}></div>
                </div>

                <div style={{
                  position: 'absolute',
                  left: '60%',
                  top: '55%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    backgroundColor: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    marginBottom: '2px',
                    boxShadow: '0 2px 10px rgba(2,132,199,0.4)'
                  }}>
                    {currentT.demoMapVehicle}
                  </div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-accent-light)', border: '2px solid #fff', boxShadow: '0 0 15px var(--color-accent-light)', animation: 'pulse-glow 2s infinite' }}></div>
                </div>

                {/* Info Text Overlay */}
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', zIndex: 2 }}>
                  {currentT.demoDetectedLabel}
                </div>
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
                    ¡Solicitud de Servicio Recibida!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                    Gracias <strong>{bookingForm.name || 'Cliente'}</strong>. Nuestro equipo técnico asignará un mecánico certificado a domicilio para tu <strong>{bookingForm.vehicle || 'Vehículo'}</strong> y se pondrá en contacto contigo a la brevedad.
                  </p>
                  <button
                    onClick={() => {
                      setBookingSubmitted(false);
                      setBookingForm({
                        name: '',
                        phone: '',
                        vehicle: '',
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
                    Realizar Otra Solicitud →
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!bookingForm.name || !bookingForm.phone || !bookingForm.vehicle || !bookingForm.address) {
                    alert('Por favor completa los campos principales (Nombre, Teléfono, Vehículo y Dirección)');
                    return;
                  }
                  setBookingSubmitted(true);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.8rem' }}>
                    {/* Nombre */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        Nombre Completo *
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

                    {/* Teléfono / WhatsApp */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        Teléfono / WhatsApp de Contacto *
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

                    {/* Vehículo */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        Auto (Marca, Modelo y Año) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Toyota Corolla 2022"
                        value={bookingForm.vehicle}
                        onChange={(e) => setBookingForm({ ...bookingForm, vehicle: e.target.value })}
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

                    {/* Servicio Requerido */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', marginBottom: '0.6rem' }}>
                        Servicio Solicitado
                      </label>
                      <select
                        value={bookingForm.serviceType}
                        onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          borderRadius: '12px',
                          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.25)',
                          backgroundColor: theme === 'light' ? '#ffffff' : '#0b1220',
                          color: theme === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '1rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="Mantenimiento Preventivo a Domicilio">Mantenimiento Preventivo a Domicilio</option>
                        <option value="Diagnóstico por Escáner / Check Engine">Diagnóstico por Escáner / Check Engine</option>
                        <option value="Cambio de Aceite y Filtros">Cambio de Aceite y Filtros</option>
                        <option value="Revisión de Frenos y Suspensión">Revisión de Frenos y Suspensión</option>
                        <option value="Auxilio Vial / Cambio de Batería">Auxilio Vial / Cambio de Batería</option>
                        <option value="Inspección Pre-Compra de Vehículo">Inspección Pre-Compra de Vehículo</option>
                      </select>
                    </div>
                  </div>

                  {/* Dirección de Visita con Buscador de Google Maps / Mapbox Interactivo */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                        📍 Ubicación de Visita a Domicilio (Busca en el Mapa o Toca un Punto) *
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
                        🎯 Usar mi ubicación actual
                      </button>
                    </div>

                    {/* Search Box con Autocompletado de Mapbox */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '1rem', color: theme === 'light' ? '#64748b' : '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
                        <input
                          type="text"
                          placeholder="Busca tu colonia, calle o referencia en el mapa (ej. Polanco, CDMX)..."
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
                          <span style={{ position: 'absolute', right: '1rem', fontSize: '0.8rem', color: 'var(--color-accent-light)' }}>Buscando...</span>
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
                                📍 Punto de servicio a domicilio
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
                        💡 Toca cualquier punto del mapa para mover el pin de tu domicilio
                      </div>
                    </div>

                    {/* Input de Dirección en Texto / Enlace de Mapa */}
                    <input
                      type="text"
                      required
                      placeholder="Dirección completa o enlace de mapa georreferenciado..."
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
                      Detalles Adicionales / Síntomas del Vehículo (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe si hay algún ruido, luz encendida en el tablero o requerimiento específico..."
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
                      className="glow-effect"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '1.2rem 3.5rem',
                        color: '#fff',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        letterSpacing: '0.5px',
                        boxShadow: '0 8px 30px rgba(2, 132, 199, 0.4)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Solicitar Servicio a Domicilio ✨
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: theme === 'light' ? '#64748b' : 'var(--text-secondary)' }}>
                      🔒 Tus datos están protegidos con cifrado y solo serán utilizados para la gestión de tu servicio.
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
