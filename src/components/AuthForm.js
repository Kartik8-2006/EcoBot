import React, { useState, useRef, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function AuthForm({ onAuth }) {
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState('');
  const [success, setSuccess] = useState(false);
  const cardRef = useRef(null);
  const containerRef = useRef(null);

  // 3D parallax on mouse move
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      if (cardRef.current) {
        cardRef.current.style.transform =
          `perspective(900px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) scale3d(1.02,1.02,1.02)`;
      }
    };
    const onLeave = () => {
      if (cardRef.current) cardRef.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) scale3d(1,1,1)';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (mode === 'signup') {
        setSuccess(true);
        setTimeout(() => { setMode('login'); setSuccess(false); setEmail(''); setPassword(''); setLoading(false); }, 1200);
        return;
      }
      onAuth({ userId: data.userId, email });
    } catch {
      setError('Cannot reach server. Is backend running on :8000?');
    }
    setLoading(false);
  }

  return (
    <div style={S.overlay} ref={containerRef}>
      <div className="bg-orbs" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          ...S.particle,
          left: `${10 + i * 15}%`,
          animationDuration: `${4 + i * 1.2}s`,
          animationDelay: `${i * 0.5}s`,
          width: i % 2 === 0 ? 4 : 6, height: i % 2 === 0 ? 4 : 6,
          opacity: 0.3 + i * 0.05,
        }} />
      ))}

      <div ref={cardRef} style={S.card}>
        {/* Glow border top */}
        <div style={S.glowBar} />

        {/* Logo */}
        <div style={S.logoRow}>
          <div style={S.logoOrb}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--green-neon)" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={S.logoText}>Eco<span style={{ color: 'var(--green-neon)', fontStyle: 'italic' }}>Bot</span></span>
        </div>

        <h1 style={S.heading}>
          {mode === 'login' ? 'Welcome back' : 'Join EcoBot'}
        </h1>
        <p style={S.sub}>
          {mode === 'login'
            ? 'Discover sustainable products crafted for the planet.'
            : 'Start your eco-friendly shopping journey today.'}
        </p>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.fieldWrap}>
            <label style={S.label}>Email address</label>
            <div style={S.inputWrap}>
              <svg style={S.inputIcon} viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={S.input}
                onFocus={e => e.target.parentNode.style.borderColor = 'var(--green-neon)'}
                onBlur={e => e.target.parentNode.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>Password</label>
            <div style={S.inputWrap}>
              <svg style={S.inputIcon} viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={S.input}
                onFocus={e => e.target.parentNode.style.borderColor = 'var(--green-neon)'}
                onBlur={e => e.target.parentNode.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {error && (
            <div style={S.error}>
              <span style={{ marginRight: 6 }}>⚠</span>{error}
            </div>
          )}
          {success && (
            <div style={S.successMsg}>✓ Account created! Redirecting to login…</div>
          )}

          <button type="submit" style={S.btn} disabled={!!loading}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(52,211,105,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--glow-sm)'; }}
          >
            {loading
              ? <span style={S.spinner} />
              : (mode === 'login' ? 'Enter EcoBot →' : 'Create Account →')
            }
          </button>
        </form>

        <div style={S.divider}><span style={S.dividerText}>or</span></div>

        <p style={S.switchRow}>
          {mode === 'login' ? 'New here? ' : 'Have an account? '}
          <span style={S.switchLink}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Create account' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse at 30% 40%, rgba(13,92,46,0.18) 0%, var(--bg-void) 60%), var(--bg-void)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  particle: {
    position: 'absolute', borderRadius: '50%',
    background: 'var(--green-neon)',
    animation: 'orbFloat1 4s ease-in-out infinite alternate',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 2,
    background: 'linear-gradient(145deg, rgba(15,31,20,0.95) 0%, rgba(6,13,9,0.98) 100%)',
    border: '1px solid var(--border)',
    borderRadius: 24, padding: '40px 36px 32px',
    width: '100%', maxWidth: 400,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(52,211,105,0.15)',
    transition: 'transform 0.15s ease-out',
    transformStyle: 'preserve-3d',
  },
  glowBar: {
    position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
    background: 'linear-gradient(90deg, transparent, var(--green-neon), transparent)',
    borderRadius: 1,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  logoOrb: {
    width: 38, height: 38, borderRadius: 12,
    background: 'linear-gradient(135deg, var(--green-muted), var(--bg-card))',
    border: '1px solid var(--border-bright)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--glow-sm)',
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300,
    color: 'var(--text-primary)', letterSpacing: '-0.5px',
  },
  heading: {
    fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300,
    color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.5px',
  },
  sub: {
    fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 11, fontWeight: 500, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text-muted)',
  },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: 10, padding: '0 12px',
    background: 'var(--bg-input)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputIcon: { flexShrink: 0, marginRight: 8 },
  input: {
    flex: 1, border: 'none', background: 'transparent',
    padding: '11px 0', fontSize: 14, color: 'var(--text-primary)',
    outline: 'none',
  },
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171', borderRadius: 8, padding: '9px 12px', fontSize: 13,
  },
  successMsg: {
    background: 'rgba(52,211,105,0.1)', border: '1px solid var(--border-bright)',
    color: 'var(--green-neon)', borderRadius: 8, padding: '9px 12px', fontSize: 13,
  },
  btn: {
    marginTop: 4, padding: '13px',
    background: 'linear-gradient(135deg, var(--green-mid), var(--green-deep))',
    color: '#fff', border: '1px solid var(--green-mid)',
    borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s var(--ease-spring)',
    boxShadow: 'var(--glow-sm)', letterSpacing: '0.02em',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: 16, height: 16, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px',
  },
  dividerText: {
    fontSize: 11, color: 'var(--text-dim)',
    background: 'var(--bg-card)', padding: '0 8px',
    position: 'relative',
  },
  switchRow: {
    fontSize: 13, color: 'var(--text-muted)', textAlign: 'center',
  },
  switchLink: {
    color: 'var(--green-neon)', cursor: 'pointer', fontWeight: 500,
    textDecoration: 'underline', textDecorationStyle: 'dotted',
  },
};

// inject spinner keyframe
if (!document.getElementById('auth-spinner-style')) {
  const s = document.createElement('style');
  s.id = 'auth-spinner-style';
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}
