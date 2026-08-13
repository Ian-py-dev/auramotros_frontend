import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

export type AuthModalType = 'none' | 'login' | 'reset';

interface AuthModalsProps {
  currentModal: AuthModalType;
  setCurrentModal: (modal: AuthModalType) => void;
  lang: 'es' | 'en';
}

export function AuthModals({ currentModal, setCurrentModal, lang }: AuthModalsProps) {
  const { login } = useAuth();
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginHovered, setIsLoginHovered] = useState(false);
  const [isTestHovered, setIsTestHovered] = useState(false);

  // Reset Password States
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const t = {
    es: {
      loginTitle: 'Acceso a Aura',
      loginSubtitle: 'Gestiona tu ecosistema automotriz',
      emailLabel: 'Correo Electrónico',
      passLabel: 'Contraseña',
      loginBtn: 'Iniciar Sesión',
      testUserBtn: 'Ingresar como Usuario de Prueba',
      forgotLink: '¿Olvidaste tu contraseña?',
      invalidCredentials: 'Las credenciales ingresadas son incorrectas.',
      resetTitle: 'Recuperar Contraseña',
      resetSubtitle: 'Te enviaremos un enlace para que crees una nueva',
      resetBtn: 'Enviar Enlace',
      resetSuccessMsg: '¡Enlace enviado! Revisa tu bandeja de entrada.',
      backToLogin: 'Volver a Iniciar Sesión',
      emailEmpty: 'Por favor, ingresa tu correo electrónico.',
    },
    en: {
      loginTitle: 'Access Aura',
      loginSubtitle: 'Manage your automotive ecosystem',
      emailLabel: 'Email Address',
      passLabel: 'Password',
      loginBtn: 'Sign In',
      testUserBtn: 'Log in as Test User',
      forgotLink: 'Forgot your password?',
      invalidCredentials: 'The credentials entered are incorrect.',
      resetTitle: 'Reset Password',
      resetSubtitle: 'We will send you a link to create a new one',
      resetBtn: 'Send Link',
      resetSuccessMsg: 'Link sent! Check your inbox.',
      backToLogin: 'Back to Sign In',
      emailEmpty: 'Please enter your email address.',
    }
  };

  const currentT = t[lang];

  if (currentModal === 'none') return null;

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === 'modal-backdrop') {
      setCurrentModal('none');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (email === 'demo@aura.com' && password === 'admin123') {
      login('test_token', {
        id: 'test_user_id',
        firstName: 'Usuario',
        lastName: 'Demo',
        email: 'demo@aura.com',
        roles: [{ role: { id: 'super_admin', name: 'Super Admin', permissions: [] } }]
      });
      setCurrentModal('none');
    } else {
      setLoginError(currentT.invalidCredentials);
    }
  };

  const handleTestUser = () => {
    setEmail('demo@aura.com');
    setPassword('admin123');
    setLoginError('');
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);

    if (!resetEmail) {
      setResetError(currentT.emailEmpty);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      setResetSuccess(true);
    }, 800);
  };

  return (
    <div 
      id="modal-backdrop"
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
      `}</style>

      {/* --- LOGIN MODAL --- */}
      {currentModal === 'login' && (
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          position: 'relative',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <button onClick={() => setCurrentModal('none')} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>&times;</button>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.2rem', textAlign: 'center' }}>{currentT.loginTitle}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center' }}>{currentT.loginSubtitle}</p>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>{currentT.emailLabel}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)',
                  borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.95rem',
                  outline: 'none', transition: 'all 0.3s'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-light)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-glow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>{currentT.passLabel}</label>
                <span onClick={() => setCurrentModal('reset')} style={{ fontSize: '0.8rem', color: 'var(--color-accent-light)', cursor: 'pointer', fontWeight: 600 }}>{currentT.forgotLink}</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', border: loginError ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                  borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.95rem',
                  outline: 'none', transition: 'all 0.3s',
                  animation: loginError ? 'shake 0.4s' : 'none'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-light)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-glow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = loginError ? '#ef4444' : 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {loginError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem', marginLeft: '0.2rem' }}>{loginError}</span>}
            </div>

            <button
              type="submit"
              onMouseEnter={() => setIsLoginHovered(true)}
              onMouseLeave={() => setIsLoginHovered(false)}
              style={{
                marginTop: '0.5rem', width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                border: 'none', borderRadius: '10px', padding: '0.85rem', color: '#fff', fontSize: '1rem',
                fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)', transform: isLoginHovered ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {currentT.loginBtn}
            </button>
            
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }}></div>
              <span style={{ margin: '0 10px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>O</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }}></div>
            </div>

            <button
              type="button"
              onClick={handleTestUser}
              onMouseEnter={() => setIsTestHovered(true)}
              onMouseLeave={() => setIsTestHovered(false)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                borderRadius: '10px', padding: '0.85rem', color: 'var(--text-primary)', fontSize: '0.9rem',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: isTestHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'
              }}
            >
              {currentT.testUserBtn}
            </button>
          </form>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {currentModal === 'reset' && (
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          position: 'relative',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <button onClick={() => setCurrentModal('none')} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>&times;</button>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.2rem', textAlign: 'center' }}>{currentT.resetTitle}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center' }}>{currentT.resetSubtitle}</p>

          {resetSuccess ? (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-emerald)', borderRadius: '10px', padding: '1rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--color-emerald)', fontWeight: 600, fontSize: '0.95rem' }}>{currentT.resetSuccessMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>{currentT.emailLabel}</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{
                    width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', border: resetError ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.95rem',
                    outline: 'none', transition: 'all 0.3s',
                    animation: resetError ? 'shake 0.4s' : 'none'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-light)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-glow)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = resetError ? '#ef4444' : 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                {resetError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem', marginLeft: '0.2rem' }}>{resetError}</span>}
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '0.5rem', width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  border: 'none', borderRadius: '10px', padding: '0.85rem', color: '#fff', fontSize: '1rem',
                  fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)'
                }}
              >
                {currentT.resetBtn}
              </button>
            </form>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <span onClick={() => setCurrentModal('login')} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>
              ← {currentT.backToLogin}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
