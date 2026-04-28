import React, { useState, useRef } from 'react';

export default function ProductCard({ product }) {
  const [imgErr, setImgErr] = useState(false);
  const [tilt, setTilt]     = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  const stars = product.rating ? parseFloat(product.rating) : null;

  function onMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({
      x: ((e.clientY - cy) / (rect.height / 2)) * -10,
      y: ((e.clientX - cx) / (rect.width  / 2)) * 10,
    });
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }

  return (
    <a
      ref={cardRef}
      href={product.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        ...S.card,
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? 'translateZ(8px)' : 'translateZ(0)'}`,
        borderColor: hovered ? 'rgba(52,211,105,0.35)' : 'var(--border)',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(52,211,105,0.15)' : '0 4px 20px rgba(0,0,0,0.3)',
      }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
    >
      {/* Shimmer on hover */}
      {hovered && <div style={S.shimmer} />}

      {/* Image */}
      <div style={S.imgWrap}>
        {product.image && !imgErr ? (
          <img
            src={product.image} alt={product.title}
            style={S.img}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={S.imgFallback}>🌿</div>
        )}
        <div style={S.imgOverlay} />
      </div>

      {/* Content */}
      <div style={S.content}>
        <div style={S.title}>{product.title || 'Eco Product'}</div>

        <div style={S.meta}>
          {stars && (
            <div style={S.stars}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: i < Math.round(stars) ? '#d4a853' : 'var(--text-dim)', fontSize: 10 }}>★</span>
              ))}
              <span style={S.ratingNum}>{stars.toFixed(1)}</span>
            </div>
          )}
          {product.price && <span style={S.price}>{product.price}</span>}
        </div>

        <div style={S.badge}>
          <span style={{ fontSize: 9 }}>♻</span> Eco-Friendly
        </div>
      </div>
    </a>
  );
}

const S = {
  card: {
    background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-deep) 100%)',
    border: '1px solid var(--border)',
    borderRadius: 14, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    cursor: 'pointer',
    transition: 'transform 0.15s ease-out, box-shadow 0.2s, border-color 0.2s',
    textDecoration: 'none',
    position: 'relative',
    transformStyle: 'preserve-3d',
  },
  shimmer: {
    position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', borderRadius: 14,
    background: 'linear-gradient(105deg, transparent 40%, rgba(52,211,105,0.06) 50%, transparent 60%)',
  },
  imgWrap: {
    position: 'relative', height: 100, overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(13,92,46,0.3), rgba(6,13,9,0.8))',
  },
  img: {
    width: '100%', height: '100%', objectFit: 'contain',
    padding: 8,
  },
  imgFallback: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 32, opacity: 0.5,
  },
  imgOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 20,
    background: 'linear-gradient(transparent, var(--bg-card))',
  },
  content: {
    padding: '8px 10px 10px',
    display: 'flex', flexDirection: 'column', gap: 5,
  },
  title: {
    fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  meta: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  stars: {
    display: 'flex', alignItems: 'center', gap: 1,
  },
  ratingNum: {
    fontSize: 10, color: 'var(--text-muted)', marginLeft: 4,
  },
  price: {
    fontSize: 12, fontWeight: 700, color: 'var(--green-neon)',
    fontFamily: 'var(--font-display)',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'rgba(52,211,105,0.08)',
    border: '1px solid rgba(52,211,105,0.15)',
    color: 'var(--green-neon)', fontSize: 10, fontWeight: 600,
    padding: '2px 8px', borderRadius: 20, width: 'fit-content',
    letterSpacing: '0.04em',
  },
};
