'use client';

import React, { useState, useEffect } from 'react';
import { safeFetch } from '../../../lib/api-config';
import { ShieldCheck, Plus, BarChart3, Mail, Send, Zap, Trash2, PlayCircle, PauseCircle, Copy, ExternalLink, Phone, Car, Lock } from 'lucide-react';

type Survey = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  _count?: { responses: number };
};

type SurveyResponseItem = {
  id: string;
  clientEmail: string | null;
  clientName: string | null;
  rating: number;
  answers: Record<string, unknown>;
  createdAt: string;
};

type SmtpConfig = {
  configured: boolean;
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  fromName: string;
  fromEmail: string;
};

type SurveyStats = {
  totalResponses: number;
  averageRating: number;
  csatPercentage: number;
  npsScore: number;
  ratingDistribution: Record<number, number>;
  responses: SurveyResponseItem[];
  questionAggregates: Record<string, Record<string, number>>;
};

function Btn({
  children, onClick, type = 'button', variant = 'primary', size = 'md', disabled = false, style = {},
}: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md' | 'lg';
  disabled?: boolean; style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: hov ? 'linear-gradient(135deg,#0369a1,#0284c7)' : 'linear-gradient(135deg,#0284c7,#06b6d4)', color: '#fff', border: '1px solid rgba(56,189,248,0.3)', boxShadow: hov ? '0 8px 28px rgba(2,132,199,0.45)' : '0 4px 16px rgba(2,132,199,0.25)' },
    secondary: { background: hov ? 'var(--glass-border)' : 'var(--glass-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' },
    danger: { background: hov ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '7px 14px', fontSize: 12, borderRadius: 10, fontWeight: 700 },
    md: { padding: '11px 20px', fontSize: 13, borderRadius: 12, fontWeight: 700 },
    lg: { padding: '14px 28px', fontSize: 15, borderRadius: 14, fontWeight: 800 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.2s ease',
        transform: !disabled && hov ? 'translateY(-1px)' : 'none',
        ...variants[variant], ...sizes[size], ...style,
      }}
    >{children}</button>
  );
}

function StatCard({ label, value, sub, color = '#38bdf8' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="glass-card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1.1, marginTop: 4 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</span>}
    </div>
  );
}

const AURA_Q_LABELS: Record<string, string> = {
  q1: '¿Qué tan satisfecho quedaste con el servicio?',
  q2: '¿Qué fue lo que más valoraste?',
  q3: 'Principal preocupación antes del servicio',
  q4: 'Tranquilidad respecto al vehículo (post-servicio)',
  q5: 'Importancia del historial digital',
  q6: '¿Usarías el historial digital de AURA?',
  q7: 'Servicios de interés',
  q8: 'Valor de AURA durante la vida del vehículo',
  q9: '¿Qué necesitaría AURA para ganarte tu confianza?',
  q10: '¿Recomendarías AURA? (NPS)',
  q11: '¿Qué mejorarías de tu experiencia?',
  q12: '¿Te gustaría ser contactado?',
};

export default function SurveysPage() {
  const [activeTab, setActiveTab] = useState<'manage' | 'smtp' | 'send' | 'analytics'>('manage');

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    configured: false, host: 'smtp.gmail.com', port: 587,
    user: '', pass: '', secure: false,
    fromName: 'Aura Servicios', fromEmail: '',
  });
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [clientEmailsText, setClientEmailsText] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [analyticsSurveyId, setAnalyticsSurveyId] = useState('');
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSurveys = async () => {
    setIsLoadingSurveys(true);
    const { ok, data } = await safeFetch<Survey[]>('/surveys');
    if (ok && Array.isArray(data)) {
      setSurveys(data);
      if (data.length > 0 && !selectedSurveyId) setSelectedSurveyId(data[0].id);
      if (data.length > 0 && !analyticsSurveyId) setAnalyticsSurveyId(data[0].id);
    } else setSurveys([]);
    setIsLoadingSurveys(false);
  };

  const fetchSmtpConfig = async () => {
    const { ok, data } = await safeFetch<SmtpConfig>('/surveys/smtp-config');
    if (ok && data) setSmtpConfig(data);
  };

  const fetchSurveyStats = async (surveyId: string) => {
    if (!surveyId) return;
    setIsLoadingStats(true);
    const { ok, data } = await safeFetch<SurveyStats>(`/surveys/${surveyId}/stats`);
    if (ok && data) setStats(data); else setStats(null);
    setIsLoadingStats(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSurveys(); fetchSmtpConfig(); }, []);
  useEffect(() => { if (analyticsSurveyId) fetchSurveyStats(analyticsSurveyId); }, [analyticsSurveyId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    const { ok } = await safeFetch('/surveys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDescription }),
    });
    if (ok) {
      showToast('Encuesta creada con éxito');
      setNewTitle(''); setNewDescription('');
      setShowCreateModal(false);
      fetchSurveys();
    } else showToast('Error al crear encuesta', 'error');
    setIsCreating(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { ok } = await safeFetch(`/surveys/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    if (ok) { showToast(`Encuesta ${!current ? 'activada' : 'pausada'}`); fetchSurveys(); }
    else showToast('Error al actualizar', 'error');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta encuesta y todos sus datos?')) return;
    const { ok } = await safeFetch(`/surveys/${id}`, { method: 'DELETE' });
    if (ok) { showToast('Encuesta eliminada'); fetchSurveys(); }
    else showToast('Error al eliminar', 'error');
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true); setSmtpFeedback(null);
    const { ok, data, error: fetchErr } = await safeFetch<{ message?: string }>('/surveys/smtp-test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig),
    });
    setSmtpFeedback(ok ? { type: 'success', message: data?.message || '¡Conexión SMTP verificada con éxito!' } : { type: 'error', message: data?.message || fetchErr || 'Error al conectar con el servidor SMTP' });
    setIsTestingSmtp(false);
  };

  const handleSendTestEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testEmailAddress.trim()) { showToast('Ingresa un correo de destino', 'error'); return; }
    setIsSendingTestEmail(true); setSmtpFeedback(null);
    const { ok, data, error: fetchErr } = await safeFetch<{ message: string }>('/surveys/smtp-config/send-test-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail: testEmailAddress.trim() }),
    });
    if (ok && data) {
      setSmtpFeedback({ type: 'success', message: data.message });
      showToast('¡Correo de prueba enviado con éxito!');
    } else {
      const msg = data?.message || fetchErr || 'Error al enviar correo de prueba';
      setSmtpFeedback({ type: 'error', message: msg });
      showToast(msg, 'error');
    }
    setIsSendingTestEmail(false);
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoadingSmtp(true); setSmtpFeedback(null);
    const { ok } = await safeFetch('/surveys/smtp-config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpConfig),
    });
    if (ok) { showToast('Configuración SMTP guardada'); fetchSmtpConfig(); }
    else setSmtpFeedback({ type: 'error', message: 'Error al guardar configuración' });
    setIsLoadingSmtp(false);
  };

  const handleSendEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurveyId) { showToast('Selecciona una encuesta', 'error'); return; }
    const emailsList = clientEmailsText.split(/[\n,;]+/).map((em) => em.trim()).filter((em) => em.length > 0);
    if (emailsList.length === 0) { showToast('Ingresa al menos un correo', 'error'); return; }
    setIsSendingEmails(true); setSendResult(null);
    const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const { ok, data } = await safeFetch<{ message?: string }>('/surveys/send-emails', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surveyId: selectedSurveyId, clientEmails: emailsList, customMessage, appBaseUrl }),
    });
    if (ok) {
      setSendResult({ type: 'success', message: data?.message || 'Correos enviados' });
      setClientEmailsText(''); showToast('¡Encuestas enviadas!'); fetchSurveys();
    } else {
      setSendResult({ type: 'error', message: data?.message || 'Error al enviar' });
    }
    setIsSendingEmails(false);
  };

  const copySurveyLink = (id: string) => {
    const link = `${window.location.origin}/encuesta/${id}`;
    navigator.clipboard.writeText(link);
    showToast('Enlace copiado al portapapeles');
  };

  const tabs = [
    { id: 'manage', label: 'Encuestas', icon: <BarChart3 size={15} /> },
    { id: 'smtp', label: 'Correo SMTP', icon: <Mail size={15} /> },
    { id: 'send', label: 'Enviar a Clientes', icon: <Send size={15} /> },
    { id: 'analytics', label: 'Resultados', icon: <BarChart3 size={15} /> },
  ];

  const inputStyle: React.CSSProperties = {
    background: 'var(--glass-bg)', border: '1.5px solid var(--glass-border)',
    color: 'var(--text-primary)', borderRadius: 12, padding: '12px 16px',
    fontSize: 14, fontFamily: 'Outfit, sans-serif', width: '100%', boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: 1,
    textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8,
  };

  const alertStyle = (type: 'success' | 'error'): React.CSSProperties => ({
    padding: '14px 18px', borderRadius: 14, fontSize: 14, marginBottom: 20,
    background: type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
    color: type === 'success' ? '#34d399' : '#f87171',
    border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
    display: 'flex', alignItems: 'center', gap: 10,
  });

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        .survey-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 3px rgba(14,165,233,0.15); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(7,10,19,0.75); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; animation: slideUp 0.2s ease; }
        .modal-box { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 24px; padding: 40px; max-width: 520px; width: 100%; box-shadow: 0 30px 80px rgba(0,0,0,0.5); }
        .tab-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; border: 1.5px solid transparent; white-space: nowrap; background: transparent; font-family: Outfit, sans-serif; }
        .tab-btn.active { background: rgba(2,132,199,0.15); color: #38bdf8; border-color: rgba(56,189,248,0.3); }
        .tab-btn:not(.active) { color: var(--text-secondary); }
        .tab-btn:not(.active):hover { background: var(--glass-bg); border-color: var(--glass-border); color: var(--text-primary); }
      `}</style>

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 99999,
          padding: '14px 22px', borderRadius: 14, fontSize: 14, fontWeight: 700,
          background: toastMessage.type === 'success' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#dc2626,#ef4444)',
          color: '#fff', boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
          animation: 'toastIn 0.3s ease', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {toastMessage.type === 'success' ? '✓' : '✕'} {toastMessage.text}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Nueva Encuesta</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Se crearán automáticamente las 12 preguntas AURA.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>✕</button>
            </div>
            <form onSubmit={handleCreateSurvey} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Título de la encuesta *</label>
                <input
                  className="survey-input" type="text" required
                  placeholder="ej: Encuesta de Satisfacción AURA 2026"
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Descripción / Mensaje de bienvenida</label>
                <textarea
                  className="survey-input" rows={3}
                  placeholder="Gracias por confiar en AURA para el cuidado de tu vehículo..."
                  value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <Btn variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Btn>
                <Btn type="submit" variant="primary" disabled={isCreating}>
                  {isCreating ? 'Creando...' : <><Plus size={14} /> Crear Encuesta</>}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 80, paddingLeft: 16, paddingRight: 16 }}>

        {/* Header */}
        <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 9999, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, border: '1px solid rgba(56,189,248,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              Módulo de Satisfacción
            </div>
            <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
              Encuestas de Satisfacción
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15, maxWidth: 520 }}>
              Diseña encuestas, configura correo y analiza respuestas en tiempo real.
            </p>
          </div>
          <Btn variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Nueva Encuesta
          </Btn>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, marginBottom: 36, overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: ENCUESTAS */}
        {activeTab === 'manage' && (
          <div style={{ animation: 'slideUp 0.25s ease' }}>
            {isLoadingSurveys ? (
              <div style={{ textAlign: 'center', padding: 80 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTopColor: '#38bdf8', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Cargando encuestas…</span>
              </div>
            ) : surveys.length === 0 ? (
              <div className="glass-card" style={{ padding: '64px 32px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(2,132,199,0.1)', border: '1.5px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <BarChart3 size={26} color="#38bdf8" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Sin encuestas creadas</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>
                  Crea tu primera encuesta con las 12 preguntas AURA y comienza a medir la satisfacción de tus clientes.
                </p>
                <Btn variant="primary" size="lg" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Crear primera encuesta</Btn>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 22 }}>
                {surveys.map((survey) => (
                  <div key={survey.id} className="glass-card" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
                            background: survey.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.1)',
                            color: survey.isActive ? '#10b981' : '#94a3b8',
                            border: `1px solid ${survey.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.2)'}`,
                          }}>
                            {survey.isActive ? '● Activa' : '○ Inactiva'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{survey.title}</h3>
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {survey.description || 'Sin descripción'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
                      <div>
                        <span style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8' }}>{survey._count?.responses || 0}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>respuestas</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(survey.createdAt).toLocaleDateString('es-MX')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Btn variant="secondary" size="sm" onClick={() => copySurveyLink(survey.id)} style={{ flex: 1, justifyContent: 'center' }}>
                        <Copy size={13} /> Copiar Link
                      </Btn>
                      <Btn variant="primary" size="sm" onClick={() => { setAnalyticsSurveyId(survey.id); setActiveTab('analytics'); }} style={{ flex: 1, justifyContent: 'center' }}>
                        <BarChart3 size={13} /> Métricas
                      </Btn>
                      <Btn variant={survey.isActive ? 'ghost' : 'secondary'} size="sm" onClick={() => handleToggle(survey.id, survey.isActive)} style={{ justifyContent: 'center' }}>
                        {survey.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                      </Btn>
                      <Btn variant="danger" size="sm" onClick={() => handleDelete(survey.id)} style={{ justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </Btn>
                    </div>

                    <a
                      href={`/encuesta/${survey.id}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid rgba(56,189,248,0.2)', color: '#38bdf8', fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s ease', background: 'rgba(2,132,199,0.06)' }}
                    >
                      <ExternalLink size={13} /> Ver encuesta pública
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: SMTP */}
        {activeTab === 'smtp' && (
          <div style={{ maxWidth: 700, margin: '0 auto', animation: 'slideUp 0.25s ease' }}>
            <div className="glass-card" style={{ padding: '36px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Correo Emisor (SMTP)</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 5 }}>Credenciales para el envío de encuestas por email.</p>
                </div>
                <span style={{
                  padding: '5px 14px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
                  background: smtpConfig.configured ? 'rgba(16,185,129,0.12)' : 'rgba(234,179,8,0.12)',
                  color: smtpConfig.configured ? '#10b981' : '#eab308',
                  border: `1px solid ${smtpConfig.configured ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)'}`,
                }}>
                  {smtpConfig.configured ? '✓ Configurado' : '⚠ Pendiente'}
                </span>
              </div>

              {smtpFeedback && (
                <div style={alertStyle(smtpFeedback.type)}>
                  {smtpFeedback.type === 'success' ? '✓' : '✕'} {smtpFeedback.message}
                </div>
              )}

              {/* Card Guía Gmail App Password */}
              <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                  <Zap size={16} /> ¿Usas Gmail (smtp.gmail.com)?
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Google <strong>no permite usar tu contraseña habitual</strong> para conexiones SMTP. Debes generar una <strong>Contraseña de Aplicación</strong> de 16 caracteres:
                </p>
                <ol style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 0 18px', padding: 0, lineHeight: 1.6 }}>
                  <li>Activa la <strong>Verificación en 2 pasos</strong> en tu cuenta de Google.</li>
                  <li>Ve a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 700 }}>myaccount.google.com/apppasswords</a>.</li>
                  <li>Genera una clave y pégala abajo en el campo <em>Contraseña / App Password</em>.</li>
                </ol>
              </div>

              <form onSubmit={handleSaveSmtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Host SMTP</label>
                    <input className="survey-input" type="text" required placeholder="smtp.gmail.com"
                      value={smtpConfig.host} onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ minWidth: 110 }}>
                    <label style={labelStyle}>Puerto</label>
                    <input className="survey-input" type="number" required placeholder="587"
                      value={smtpConfig.port} onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Correo emisor</label>
                  <input className="survey-input" type="email" required placeholder="tucorreo@ejemplo.com"
                    value={smtpConfig.user} onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value, fromEmail: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Contraseña / App Password</label>
                  <input className="survey-input" type="password" required placeholder="Contraseña de aplicación"
                    value={smtpConfig.pass} onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nombre del remitente</label>
                  <input className="survey-input" type="text" placeholder="Aura Servicios Automotrices"
                    value={smtpConfig.fromName} onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={smtpConfig.secure} onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })} style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Usar SSL seguro (puerto 465)</span>
                </label>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Btn type="button" variant="secondary" onClick={handleTestSmtp} disabled={isTestingSmtp} style={{ flex: 1, justifyContent: 'center' }}>
                    <Zap size={14} /> {isTestingSmtp ? 'Probando...' : 'Probar Conexión'}
                  </Btn>
                  <Btn type="submit" variant="primary" disabled={isLoadingSmtp} style={{ flex: 1, justifyContent: 'center' }}>
                    {isLoadingSmtp ? 'Guardando...' : 'Guardar Configuración'}
                  </Btn>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: 13, marginBottom: 18 }}>
                    <ShieldCheck size={16} /> Cifrado <strong>AES-256-CBC</strong> — contraseñas protegidas en base de datos.
                  </div>
                  <label style={labelStyle}>Enviar correo de prueba</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input className="survey-input" type="email" placeholder="destino@correo.com"
                      value={testEmailAddress} onChange={(e) => setTestEmailAddress(e.target.value)}
                      style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                    />
                    <Btn type="button" variant="secondary" onClick={handleSendTestEmail} disabled={isSendingTestEmail}>
                      <Mail size={14} /> {isSendingTestEmail ? 'Enviando...' : 'Enviar Prueba'}
                    </Btn>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB: ENVIAR */}
        {activeTab === 'send' && (
          <div style={{ maxWidth: 740, margin: '0 auto', animation: 'slideUp 0.25s ease' }}>
            <div className="glass-card" style={{ padding: '36px 40px' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Enviar Encuesta por Email</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                Los clientes recibirán un correo elegante con enlace directo a la encuesta pública.
              </p>

              {sendResult && <div style={alertStyle(sendResult.type)}>{sendResult.type === 'success' ? '✓' : '✕'} {sendResult.message}</div>}

              <form onSubmit={handleSendEmails} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Encuesta</label>
                  <select value={selectedSurveyId} onChange={(e) => setSelectedSurveyId(e.target.value)} style={{ ...inputStyle }}>
                    {surveys.map((s) => (
                      <option key={s.id} value={s.id}>{s.title} ({s.isActive ? 'Activa' : 'Inactiva'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Correos de clientes (separados por comas o saltos de línea)</label>
                  <textarea className="survey-input" rows={5} required
                    placeholder={'cliente1@correo.com\ncliente2@correo.com\ncliente3@correo.com'}
                    value={clientEmailsText} onChange={(e) => setClientEmailsText(e.target.value)}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Mensaje personalizado (opcional)</label>
                  <textarea className="survey-input" rows={3}
                    placeholder="Tu opinión nos ayuda a mejorar nuestro servicio..."
                    value={customMessage} onChange={(e) => setCustomMessage(e.target.value)}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <Btn type="submit" variant="primary" size="lg" disabled={isSendingEmails} style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={16} /> {isSendingEmails ? 'Enviando correos...' : 'Enviar Encuesta a Clientes'}
                </Btn>
              </form>
            </div>
          </div>
        )}

        {/* TAB: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div style={{ animation: 'slideUp 0.25s ease' }}>
            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Encuesta:</label>
              <select value={analyticsSurveyId} onChange={(e) => setAnalyticsSurveyId(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 260, flex: 1, maxWidth: 400 }}>
                {surveys.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <Btn variant="secondary" size="sm" onClick={() => fetchSurveyStats(analyticsSurveyId)}>
                Actualizar
              </Btn>
            </div>

            {isLoadingStats ? (
              <div style={{ textAlign: 'center', padding: 80 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(56,189,248,0.2)', borderTopColor: '#38bdf8', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Cargando métricas…</span>
              </div>
            ) : !stats || stats.totalResponses === 0 ? (
              <div className="glass-card" style={{ padding: '64px 32px', textAlign: 'center', maxWidth: 580, margin: '0 auto' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(2,132,199,0.08)', border: '1.5px solid rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <BarChart3 size={26} color="#38bdf8" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Sin respuestas todavía</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>
                  Envía la encuesta a tus clientes para ver métricas en tiempo real.
                </p>
                <Btn variant="primary" onClick={() => setActiveTab('send')}>
                  <Send size={14} /> Enviar Encuesta
                </Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 18 }}>
                  <StatCard label="Satisfacción Promedio" value={`${stats.averageRating}/10`} sub="Escala 1 – 10" color="#38bdf8" />
                  <StatCard label="CSAT Score" value={`${stats.csatPercentage}%`} sub="Clientes satisfechos (≥8/10)" color="#10b981" />
                  <StatCard label="NPS Score" value={stats.npsScore > 0 ? `+${stats.npsScore}` : stats.npsScore} sub="Promotores vs Detractores" color={stats.npsScore >= 0 ? '#10b981' : '#f87171'} />
                  <StatCard label="Total Respuestas" value={stats.totalResponses} sub="Encuestas completadas" color="#a78bfa" />
                </div>

                {/* Rating distribution */}
                <div className="glass-card" style={{ padding: '28px 32px' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 22, color: 'var(--text-primary)' }}>Distribución de Satisfacción (Pregunta 1)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => {
                      const count = stats.ratingDistribution[n] || 0;
                      const pct = stats.totalResponses > 0 ? Math.round((count / stats.totalResponses) * 100) : 0;
                      return (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 800, color: n >= 8 ? '#10b981' : n >= 6 ? '#eab308' : '#f87171' }}>{n}</span>
                          <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 5, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 5, width: `${pct}%`, background: n >= 8 ? 'linear-gradient(90deg,#059669,#10b981)' : n >= 6 ? 'linear-gradient(90deg,#d97706,#eab308)' : 'linear-gradient(90deg,#dc2626,#ef4444)', transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ width: 70, textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Question Aggregates */}
                {stats.questionAggregates && Object.keys(stats.questionAggregates).filter(k => k !== 'q1' && k !== '_meta').length > 0 && (
                  <div className="glass-card" style={{ padding: '28px 32px' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>Análisis por Pregunta</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                      {Object.entries(stats.questionAggregates)
                        .filter(([k]) => k !== '_meta' && k !== 'q1')
                        .map(([qid, counts]) => {
                          const total = Object.values(counts).reduce((a, b) => a + b, 0);
                          if (total === 0) return null;
                          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                          return (
                            <div key={qid}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                <span style={{ color: '#38bdf8', marginRight: 6 }}>{qid.toUpperCase()}.</span>
                                {AURA_Q_LABELS[qid] || qid}
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {sorted.slice(0, 6).map(([option, count]) => {
                                  const pct = Math.round((count / total) * 100);
                                  return (
                                    <div key={option} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                                          <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: 'linear-gradient(90deg,#0284c7,#06b6d4)', transition: 'width 0.6s ease' }} />
                                        </div>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 50, textAlign: 'right' }}>{pct}%</span>
                                      </div>
                                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {option}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Individual Responses */}
                <div className="glass-card" style={{ padding: '28px 32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Respuestas Individuales ({stats.totalResponses})
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
                        Detalle de encuestas recibidas con datos personales cifrados de forma segura.
                      </p>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      <ShieldCheck size={14} /> Almacenamiento Seguro (AES-256)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {stats.responses.slice(0, 25).map((r) => {
                      const ansMeta = ((r.answers as Record<string, unknown>)?._meta || {}) as Record<string, string>;
                      const phoneVal = ansMeta.phone || 'No especificado';
                      const vehicleVal = ansMeta.vehicle || 'No especificado';
                      const initial = (r.clientName || 'A').trim().charAt(0).toUpperCase();

                      return (
                        <div key={r.id} style={{ padding: '20px 24px', borderRadius: 16, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {/* Header row: Client name, Security Badge, Rating */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(2,132,199,0.25), rgba(6,182,212,0.25))', border: '1px solid rgba(56,189,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                                {initial}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {r.clientName || 'Cliente Anónimo'}
                                  </span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                                    <Lock size={10} /> Cifrado AES-256
                                  </span>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'block' }}>
                                  Encuesta respondida el {new Date(r.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, color: 'var(--text-secondary)' }}>Satisfacción</span>
                              <span style={{ fontSize: 20, fontWeight: 900, color: r.rating >= 8 ? '#10b981' : r.rating >= 6 ? '#eab308' : '#f87171' }}>
                                {r.rating}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>/10</span>
                              </span>
                            </div>
                          </div>

                          {/* Client Info Bar: Correo, Teléfono, Auto */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Mail size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Correo:</span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clientEmail || 'No registrado'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Phone size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Número:</span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{phoneVal}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Car size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Auto / Vehículo:</span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{vehicleVal}</span>
                            </div>
                          </div>

                          {/* Comments preview */}
                          {(r.answers as Record<string, unknown>)?.q11 && (
                            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #38bdf8', fontSize: 13, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                              &ldquo;{String((r.answers as Record<string, unknown>).q11)}&rdquo;
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {stats.responses.length > 25 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                        Mostrando 25 de {stats.responses.length} respuestas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
