'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { safeFetch } from '../../../lib/api-config';

type Question = {
  id: string;
  type: 'scale_10' | 'single_choice' | 'multi_choice' | 'textarea' | 'rating';
  label: string;
  required: boolean;
  options?: string[];
};

type Survey = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  isActive: boolean;
};

function AuraLogo({ size = 36 }: { size?: number }) {
  const inner = size * 0.42;
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `${Math.max(2, size * 0.06)}px solid #0284c7`,
        boxShadow: `0 0 ${size * 0.45}px rgba(2,132,199,0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: inner, height: inner, borderRadius: '50%',
          border: `${Math.max(2, size * 0.06)}px solid #0284c7`,
        }} />
      </div>
      <span style={{
        fontSize: size * 0.30, fontWeight: 700, letterSpacing: size * 0.14,
        color: '#0f172a', fontFamily: 'Outfit, sans-serif',
      }}>AURA</span>
    </div>
  );
}

function ScaleSelector({ value, onChange, max = 10 }: { value: number | null; onChange: (v: number) => void; max?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const isSelected = value === n;
        const isHovered = hover !== null ? n <= hover : false;
        const isActive = value !== null ? n <= value : false;
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(n)}
            style={{
              width: 44, height: 44, borderRadius: 10,
              border: isSelected ? '2px solid #0284c7' : isHovered ? '2px solid rgba(2,132,199,0.4)' : '2px solid #e2e8f0',
              background: isActive
                ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                : isHovered ? 'rgba(2,132,199,0.07)' : '#fff',
              color: isActive ? '#fff' : isHovered ? '#0284c7' : '#64748b',
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              transition: 'all 0.15s ease',
              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isSelected ? '0 4px 16px rgba(2,132,199,0.3)' : isHovered ? '0 2px 8px rgba(2,132,199,0.15)' : 'none',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function SingleChoice({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '13px 18px', borderRadius: 12, textAlign: 'left',
              border: sel ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
              background: sel ? 'rgba(2,132,199,0.07)' : '#fff',
              color: sel ? '#0284c7' : '#374151',
              fontSize: 14, fontWeight: sel ? 700 : 500, cursor: 'pointer',
              transition: 'all 0.16s ease',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: sel ? '0 2px 12px rgba(2,132,199,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              border: sel ? '5px solid #0284c7' : '2px solid #cbd5e1',
              transition: 'all 0.16s ease',
            }} />
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiChoice({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginTop: 12 }}>
      {options.map((opt) => {
        const sel = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '11px 14px', borderRadius: 10, textAlign: 'left',
              border: sel ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
              background: sel ? 'rgba(2,132,199,0.07)' : '#fff',
              color: sel ? '#0284c7' : '#374151',
              fontSize: 13, fontWeight: sel ? 700 : 500, cursor: 'pointer',
              transition: 'all 0.16s ease',
              display: 'flex', alignItems: 'center', gap: 9,
              boxShadow: sel ? '0 2px 10px rgba(2,132,199,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: sel ? 'none' : '1.5px solid #cbd5e1',
              background: sel ? '#0284c7' : 'transparent',
              transition: 'all 0.16s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PublicSurveyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const surveyId = params?.id as string;
  const initialEmail = searchParams?.get('email') || '';

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState(initialEmail);
  const [clientPhone, setClientPhone] = useState('');
  const [clientVehicle, setClientVehicle] = useState('');

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentStep, setCurrentStep] = useState<'info' | 'survey' | 'done'>('info');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!surveyId) return;
    const fetchSurvey = async () => {
      const { ok, data, error: errMessage } = await safeFetch<Survey>(`/surveys/${surveyId}`);
      if (ok && data) {
        if (!data.isActive) setError('Esta encuesta ya no se encuentra activa.');
        else setSurvey(data);
      } else {
        setError(errMessage || 'Encuesta no encontrada o enlace inválido.');
      }
      setIsLoading(false);
    };
    fetchSurvey();
  }, [surveyId]);

  const setAnswer = (id: string, val: unknown) => setAnswers((prev) => ({ ...prev, [id]: val }));

  const questions = survey?.questions || [];
  const totalQ = questions.length;
  const currentQ = questions[currentQuestion];
  const progress = totalQ > 0 ? (currentQuestion / totalQ) * 100 : 0;

  const goNext = () => {
    if (currentQuestion < totalQ - 1) {
      setCurrentQuestion((p) => p + 1);
      setTimeout(() => questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  };
  const goPrev = () => { if (currentQuestion > 0) setCurrentQuestion((p) => p - 1); };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;
    setCurrentStep('survey');
    setCurrentQuestion(0);
  };

  const handleSubmit = async () => {
    if (!survey) return;
    const mainRating = Number(answers['q1']) || 1;
    setIsSubmitting(true);
    await safeFetch<{ message?: string }>(`/surveys/${surveyId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        rating: mainRating,
        answers: { ...answers, _meta: { phone: clientPhone, vehicle: clientVehicle } },
      }),
    });
    setIsSubmitting(false);
    setCurrentStep('done');
  };

  const pageBg = '#f8fafc';
  const cardBg = '#ffffff';
  const borderColor = '#e2e8f0';
  const textPrimary = '#0f172a';
  const textSecondary = '#64748b';

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#fff', border: '1.5px solid #e2e8f0',
    color: textPrimary, borderRadius: 12, padding: '13px 16px',
    fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: 1,
    textTransform: 'uppercase', color: textSecondary, marginBottom: 7,
  };

  // LOADING
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: textSecondary, fontSize: 14 }}>Cargando encuesta…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: 'center', background: cardBg, border: `1px solid #fca5a5`, borderRadius: 24, padding: '48px 36px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#dc2626', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Encuesta no disponible</h2>
          <p style={{ color: textSecondary, fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  // DONE
  if (currentStep === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');`}</style>
        <div style={{ maxWidth: 500, width: '100%', textAlign: 'center', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 28, padding: '56px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 28 }}><AuraLogo size={48} /></div>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28, color: '#059669' }}>✓</div>
          <h1 style={{ color: textPrimary, fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
            ¡Gracias, {clientName.split(' ')[0]}!
          </h1>
          <p style={{ color: textSecondary, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Tu respuesta ha sido registrada. Tu opinión nos ayuda a construir un mejor servicio automotriz.
          </p>
          <div style={{ background: 'rgba(2,132,199,0.06)', border: '1px solid rgba(2,132,199,0.15)', borderRadius: 14, padding: '16px 22px' }}>
            <p style={{ color: '#0284c7', fontSize: 13, margin: 0, fontWeight: 600 }}>
              Ecosistema Aura · Cuidamos tu vehículo, hoy y siempre.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // INFO FORM
  if (currentStep === 'info') {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', padding: 24 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          .survey-input:focus { border-color: #0284c7 !important; box-shadow: 0 0 0 3px rgba(2,132,199,0.12) !important; }
        `}</style>
        <div style={{ maxWidth: 540, width: '100%', background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 28, padding: '48px 40px', boxShadow: '0 16px 56px rgba(0,0,0,0.07)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <AuraLogo size={42} />
          </div>

          <h1 style={{ color: textPrimary, fontSize: 21, fontWeight: 800, margin: '0 0 8px', textAlign: 'center' }}>
            {survey?.title}
          </h1>
          <p style={{ color: textSecondary, fontSize: 14, lineHeight: 1.7, textAlign: 'center', marginBottom: 32 }}>
            {survey?.description}
          </p>

          <form onSubmit={handleInfoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input className="survey-input" style={inputStyle} placeholder="Ej. Juan García" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Correo electrónico *</label>
              <input className="survey-input" style={inputStyle} type="email" placeholder="tu@correo.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input className="survey-input" style={inputStyle} placeholder="Ej. 55 1234 5678" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Vehículo</label>
                <input className="survey-input" style={inputStyle} placeholder="Ej. Honda Civic 2020" value={clientVehicle} onChange={(e) => setClientVehicle(e.target.value)} />
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: 10, padding: '15px 32px', borderRadius: 14,
                background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 800, letterSpacing: 0.3,
                boxShadow: '0 4px 20px rgba(2,132,199,0.3)',
                transition: 'all 0.2s ease', fontFamily: 'Outfit, sans-serif',
              }}
              onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(2,132,199,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(2,132,199,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Comenzar Encuesta →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SURVEY QUESTIONS
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: 'Outfit, sans-serif', padding: '32px 16px 64px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .survey-textarea { background: #fff !important; border: 1.5px solid #e2e8f0 !important; color: #0f172a !important; border-radius: 12px !important; padding: 13px 16px !important; font-size: 14px !important; font-family: Outfit, sans-serif !important; width: 100%; box-sizing: border-box; outline: none; resize: vertical; min-height: 120px; transition: all 0.2s ease !important; }
        .survey-textarea:focus { border-color: #0284c7 !important; box-shadow: 0 0 0 3px rgba(2,132,199,0.12) !important; }
        .survey-textarea::placeholder { color: #94a3b8 !important; }
      `}</style>

      {/* Logo header */}
      <div style={{ maxWidth: 660, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AuraLogo size={32} />
      </div>

      {/* Progress */}
      <div style={{ maxWidth: 660, margin: '0 auto 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: textSecondary, fontSize: 12, fontWeight: 600 }}>
            Pregunta {currentQuestion + 1} de {totalQ}
          </span>
          <span style={{ color: '#0284c7', fontSize: 12, fontWeight: 700 }}>
            {Math.round(progress)}% completado
          </span>
        </div>
        <div style={{ height: 5, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 5,
            background: 'linear-gradient(90deg, #0284c7, #06b6d4)',
            width: `${progress}%`,
            transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      </div>

      {/* Question card */}
      <div
        ref={questionRef}
        style={{
          maxWidth: 660, margin: '0 auto',
          background: cardBg, border: `1px solid ${borderColor}`,
          borderRadius: 24, padding: '36px 36px 28px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.07)',
        }}
      >
        {currentQ && (
          <>
            <div style={{ marginBottom: 22 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(2,132,199,0.1)', color: '#0284c7',
                fontSize: 12, fontWeight: 800, marginBottom: 14,
              }}>
                {currentQuestion + 1}
              </span>
              <h2 style={{ color: textPrimary, fontSize: 17, fontWeight: 800, lineHeight: 1.5, margin: 0 }}>
                {currentQ.label}
                {currentQ.required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
              </h2>
            </div>

            {(currentQ.type === 'scale_10' || currentQ.type === 'rating') && (
              <div>
                <ScaleSelector value={(answers[currentQ.id] as number | null) ?? null} onChange={(v) => setAnswer(currentQ.id, v)} max={10} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                    {currentQ.id === 'q10' ? 'No lo haría' : 'Muy insatisfecho'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                    {currentQ.id === 'q10' ? 'Definitivamente sí' : 'Muy satisfecho'}
                  </span>
                </div>
              </div>
            )}

            {currentQ.type === 'single_choice' && currentQ.options && (
              <SingleChoice options={currentQ.options} value={(answers[currentQ.id] as string | null) ?? null} onChange={(v) => setAnswer(currentQ.id, v)} />
            )}

            {currentQ.type === 'multi_choice' && currentQ.options && (
              <MultiChoice options={currentQ.options} value={(answers[currentQ.id] as string[]) ?? []} onChange={(v) => setAnswer(currentQ.id, v)} />
            )}

            {currentQ.type === 'textarea' && (
              <textarea
                className="survey-textarea"
                placeholder="Escribe tu respuesta aquí..."
                value={(answers[currentQ.id] as string) || ''}
                onChange={(e) => setAnswer(currentQ.id, e.target.value)}
              />
            )}
          </>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 22, borderTop: `1px solid ${borderColor}` }}>
          <button
            type="button"
            onClick={goPrev}
            disabled={currentQuestion === 0}
            style={{
              padding: '11px 22px', borderRadius: 12,
              background: '#fff', border: '1.5px solid #e2e8f0',
              color: textSecondary, fontSize: 13, fontWeight: 700,
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestion === 0 ? 0.4 : 1,
              transition: 'all 0.2s ease', fontFamily: 'Outfit, sans-serif',
            }}
          >← Anterior</button>

          {currentQuestion < totalQ - 1 ? (
            <button
              type="button"
              onClick={goNext}
              style={{
                padding: '11px 26px', borderRadius: 12,
                background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2,132,199,0.28)',
                transition: 'all 0.2s ease', fontFamily: 'Outfit, sans-serif',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(2,132,199,0.38)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(2,132,199,0.28)'; }}
            >Siguiente →</button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: '11px 26px', borderRadius: 12,
                background: isSubmitting ? '#d1fae5' : 'linear-gradient(135deg, #059669, #10b981)',
                border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(5,150,105,0.28)',
                transition: 'all 0.2s ease', fontFamily: 'Outfit, sans-serif',
              }}
            >
              {isSubmitting ? 'Enviando...' : '✓ Enviar Respuestas'}
            </button>
          )}
        </div>
      </div>

      {/* Dot navigation */}
      <div style={{ maxWidth: 660, margin: '20px auto 0', display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentQuestion(i)}
            style={{
              width: i === currentQuestion ? 22 : 7, height: 7, borderRadius: 4,
              background: i === currentQuestion ? '#0284c7' : i < currentQuestion ? 'rgba(2,132,199,0.35)' : '#e2e8f0',
              border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SurveyPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0284c7' }} />
      </div>
    }>
      <PublicSurveyPage />
    </Suspense>
  );
}
