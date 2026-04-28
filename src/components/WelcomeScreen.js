import React, { useEffect, useRef } from 'react';

const SUGGESTIONS = [
  { icon: '🧴', text: 'Eco-friendly shampoo' },
  { icon: '🍶', text: 'Reusable water bottles' },
  { icon: '🧹', text: 'Natural cleaning products' },
  { icon: '👗', text: 'Sustainable clothing' },
  { icon: '☀️', text: 'Solar-powered gadgets' },
  { icon: '🌿', text: 'Zero waste kitchen' },
];

const STATS = [
  { value: '10K+', label: 'Eco Products' },
  { value: '100%', label: 'Green Focus' },
  { value: 'AI', label: 'Powered' },
];

export default function WelcomeScreen({ onSuggestion, userName }) {
  const orbRef = useRef(null);

  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div style={S.wrap}>
      {/* Parallax background orb */}
      <div ref={orbRef} style={S.bgOrb} />

      {/* Grid pattern overlay */}
      <div style={S.grid} />

      <div style={S.inner}>
        {/* Icon */}
        <div style={S.iconRing}>
          <div style={S.iconInner}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--green-neon)" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 style={S.heading}>
          Hello{userName ? `, ${userName}` : ''}!<br />
          <span style={S.headingAccent}>I'm EcoBot</span>
        </h1>

        <p style={S.sub}>
          Your AI-powered eco-friendly shopping assistant.<br />
          Discover sustainable products that love the planet.
        </p>

        {/* Stats row */}
        <div style={S.stats}>
          {STATS.map((s, i) => (
            <div key={i} style={S.statItem}>
              <span style={S.statVal}>{s.value}</span>
              <span style={S.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Suggestion chips */}
        <p style={S.tryLabel}>Try asking about:</p>
        <div style={S.chips}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} style={S.chip}
              onClick={() => onSuggestion(s.text)}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(52,211,105,0.12)';
                e.currentTarget.style.borderColor = 'var(--green-neon)';
                e.currentTarget.style.color = 'var(--green-neon)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--glow-sm)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>{s.icon}</span> {s.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    background: 'radial-gradient(ellipse at 50% 40%, rgba(13,92,46,0.12) 0%, transparent 65%)',
  },
  bgOrb: {
    position: 'absolute', width: 500, height: 500,
    background: 'radial-gradient(circle, rgba(52,211,105,0.07) 0%, transparent 70%)',
    borderRadius: '50%', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'transform 0.3s ease-out',
    pointerEvents: 'none',
  },
  grid: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(52,211,105,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,105,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
  },
  inner: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '0 24px', maxWidth: 560,
  },
  iconRing: {
    width: 80, height: 80, borderRadius: '50%',
    border: '1px solid var(--border-bright)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, position: 'relative',
    boxShadow: 'var(--glow-md), inset 0 0 30px rgba(52,211,105,0.05)',
    animation: 'glowPulse 3s ease-in-out infinite',
  },
  iconInner: {
    width: 58, height: 58, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--green-muted), var(--bg-card))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  heading: {
    fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 300,
    color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.2,
    letterSpacing: '-1px',
  },
  headingAccent: {
    fontStyle: 'italic', color: 'var(--green-neon)',
    textShadow: '0 0 30px rgba(52,211,105,0.4)',
  },
  sub: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
    marginBottom: 28, maxWidth: 360,
  },
  stats: {
    display: 'flex', gap: 32, marginBottom: 32,
    padding: '14px 32px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)',
    borderRadius: 14,
  },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statVal: {
    fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400,
    color: 'var(--green-neon)', letterSpacing: '-0.5px',
  },
  statLabel: { fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  tryLabel: { fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    padding: '8px 15px', border: '1px solid var(--border)',
    borderRadius: 24, fontSize: 13, color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
    transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 6,
  },
};
