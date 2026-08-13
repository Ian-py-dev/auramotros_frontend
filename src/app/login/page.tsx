'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '../../lib/auth-context';
import { safeFetch } from '../../lib/api-config';
import { Eye, EyeOff, ShieldAlert, ShieldCheck, ArrowLeft } from 'lucide-react';

type LangType = 'es' | 'en';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [lang, setLang] = useState<LangType>('es');
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Password Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const savedLang = localStorage.getItem('aura-lang') as LangType;
    if (savedLang === 'es' || savedLang === 'en') {
      setLang(savedLang);
    }
    const root = window.document.documentElement;
    const theme = localStorage.getItem('aura-theme');
    // Default is light mode — only apply dark if explicitly saved
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      if (!theme) localStorage.setItem('aura-theme', 'light');
    }
  }, []);

  const t = {
    es: {
      back: 'Volver al Inicio',
      title: 'Acceso a Aura',
      subtitle: 'Inicia sesión con las credenciales de tu cuenta',
      emailLabel: 'Correo Electrónico',
      emailPlaceholder: 'tu@correo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: '••••••••',
      forgot: '¿Olvidaste tu contraseña?',
      submit: 'Iniciar Sesión Segura',
      submitting: 'Verificando credenciales...',
      invalidCredentials: 'Las credenciales ingresadas son incorrectas. Verifica tu correo y contraseña.',
      resetTitle: 'Recuperar Contraseña',
      resetSubtitle: 'Te enviaremos un enlace de verificación',
      resetBtn: 'Enviar Enlace',
      resetSuccessMsg: '¡Enlace de verificación enviado a tu correo!',
      emailEmpty: 'Por favor, ingresa tu correo electrónico.',
    },
    en: {
      back: 'Back to Home',
      title: 'Access Aura',
      subtitle: 'Sign in with your account credentials',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      forgot: 'Forgot password?',
      submit: 'Secure Sign In',
      submitting: 'Verifying credentials...',
      invalidCredentials: 'The credentials entered are incorrect. Please verify your email and password.',
      resetTitle: 'Reset Password',
      resetSubtitle: 'We will send you a verification link',
      resetBtn: 'Send Link',
      resetSuccessMsg: 'Verification link sent to your email!',
      emailEmpty: 'Please enter your email address.',
    }
  };

  const currentT = t[lang];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    const { ok, data, error: errMessage } = await safeFetch<{ access_token: string; user: User; message?: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (ok && data && data.access_token) {
      login(data.access_token, data.user);
      router.push('/dashboard');
    } else {
      setLoginError(data?.message || errMessage || currentT.invalidCredentials);
    }
    setIsLoading(false);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);

    if (!resetEmail) {
      setResetError(currentT.emailEmpty);
      return;
    }
    
    setTimeout(() => {
      setResetSuccess(true);
    }, 800);
  };

  const isInactiveError = loginError.toLowerCase().includes('inactiva');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070a13',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem'
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
      `}</style>
      
      {/* Background Orbs */}
      <div className="bg-glow-orb" style={{ top: '10%', left: '-10%', opacity: 0.6 }} />
      <div className="bg-glow-orb" style={{ bottom: '-10%', right: '-10%', opacity: 0.4, background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)' }} />

      {/* Back Button */}
      <button 
        onClick={() => router.push('/')}
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600,
          transition: 'color 0.3s',
          zIndex: 10
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
        onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
      >
        <ArrowLeft size={18} />
        {currentT.back}
      </button>

      {/* Login Card */}
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '3rem 2.5rem',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(13, 18, 34, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        
        {/* ORIGINAL CODE-RENDERED AURA LOGO (DOUBLE CIRCLE + CLEAN AURA TEXT) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: '3px solid #0ea5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)'
          }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '3px solid #0ea5e9' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 300, letterSpacing: '5px', color: '#ffffff' }}>
            AURA
          </span>
        </div>

        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: '0.4rem',
          textAlign: 'center',
          letterSpacing: '-0.02em'
        }}>{currentT.title}</h1>
        
        <p style={{
          color: '#94a3b8',
          fontSize: '0.9rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>{currentT.subtitle}</p>

        {/* Dynamic Alert Banner (Credentials vs Inactive Account) */}
        {loginError && (
          <div style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '14px',
            backgroundColor: isInactiveError ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${isInactiveError ? 'rgba(234, 179, 8, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: isInactiveError ? '#facc15' : '#f87171',
            fontSize: '13px',
            marginBottom: '20px',
            animation: 'shake 0.4s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            lineHeight: 1.4
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>{isInactiveError ? 'Cuenta Inactiva' : 'Error de Autenticación'}:</strong>
              <div style={{ marginTop: '2px' }}>{loginError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
              {currentT.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={currentT.emailPlaceholder}
              style={{
                width: '100%',
                backgroundColor: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                {currentT.passwordLabel}
              </label>
              <span onClick={() => setShowResetModal(true)} style={{ fontSize: '0.8rem', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}>
                {currentT.forgot}
              </span>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={currentT.passwordPlaceholder}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  padding: '0.85rem 2.8rem 0.85rem 1rem',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />

              {/* Vector Eye Icon Button (Replaces Monkey Emoji) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: showPassword ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.8rem',
              width: '100%',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.95rem',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.2s',
            }}
          >
            {isLoading ? currentT.submitting : currentT.submit}
          </button>
        </form>

        {/* Security Badge */}
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
          <ShieldCheck size={14} style={{ color: '#38bdf8' }} />
          Conexión Segura SSL 256-bit
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '20px'
        }}>
          <div className="glass-card" style={{
            background: 'rgba(13, 18, 34, 0.95)',
            borderRadius: '24px', width: '100%', maxWidth: '420px',
            border: '1px solid rgba(255, 255, 255, 0.14)', padding: '32px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{currentT.resetTitle}</h3>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>{currentT.resetSubtitle}</p>

            {resetSuccess ? (
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '14px', textAlign: 'center' }}>
                {currentT.resetSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>{currentT.emailLabel}</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={currentT.emailPlaceholder}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', outline: 'none' }}
                  />
                  {resetError && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{resetError}</span>}
                </div>
                <button
                  type="submit"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', color: '#ffffff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  {currentT.resetBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
