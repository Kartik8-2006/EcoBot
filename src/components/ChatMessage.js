import React from 'react';
import ProductCard from './ProductCard';

export default function ChatMessage({ role, text, products, userName }) {
  const isUser = role === 'user';

  return (
    <div style={{ ...S.row, ...(isUser ? S.rowUser : {}), animation: 'msgIn 0.35s var(--ease-out-expo)' }}>
      <div style={{ ...S.avatar, ...(isUser ? S.avatarUser : S.avatarBot) }}>
        {isUser
          ? (userName?.[0] || 'U').toUpperCase()
          : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--green-neon)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        }
      </div>

      <div style={S.content}>
        <div style={{ ...S.nameRow, ...(isUser ? S.nameRowUser : {}) }}>
          <span style={{ ...S.name, ...(isUser ? {} : S.nameBot) }}>
            {isUser ? (userName || 'You') : 'EcoBot'}
          </span>
        </div>

        <div style={{ ...S.bubble, ...(isUser ? S.bubbleUser : S.bubbleBot) }}>
          {text.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}

          {products && products.length > 0 && (
            <div style={S.productsGrid}>
              {products.map((p, i) => <ProductCard key={i} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div style={{ ...S.row, animation: 'msgIn 0.3s var(--ease-out-expo)' }}>
      <div style={{ ...S.avatar, ...S.avatarBot }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--green-neon)" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div style={S.content}>
        <span style={{ ...S.name, ...S.nameBot }}>EcoBot</span>
        <div style={S.typingBubble}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <span key={i} style={{
              ...S.dot,
              animationDelay: `${delay}s`,
              animation: `ecoBotDot 1.2s ${delay}s infinite ease-in-out`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  row: {
    display: 'flex', gap: 11,
    maxWidth: 820, alignItems: 'flex-start',
  },
  rowUser: {
    flexDirection: 'row-reverse', marginLeft: 'auto',
  },
  avatar: {
    width: 30, height: 30, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2,
  },
  avatarBot: {
    background: 'linear-gradient(135deg, var(--green-muted), var(--bg-card))',
    border: '1px solid var(--border-bright)',
    boxShadow: 'var(--glow-sm)',
  },
  avatarUser: {
    background: 'linear-gradient(135deg, var(--green-mid), var(--green-deep))',
    border: '1px solid var(--green-mid)',
    color: '#fff',
  },
  content: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', marginBottom: 5 },
  nameRowUser: { justifyContent: 'flex-end' },
  name: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--text-muted)',
  },
  nameBot: { color: 'var(--green-neon)', opacity: 0.8 },
  bubble: {
    padding: '12px 15px', fontSize: 13.5, lineHeight: 1.7,
    wordBreak: 'break-word',
  },
  bubbleBot: {
    background: 'linear-gradient(135deg, rgba(15,31,20,0.9), rgba(10,21,16,0.95))',
    border: '1px solid var(--border)',
    borderRadius: '4px 14px 14px 14px',
    color: 'var(--text-secondary)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  },
  bubbleUser: {
    background: 'linear-gradient(135deg, var(--green-mid), var(--green-deep))',
    borderRadius: '14px 4px 14px 14px',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(22,163,74,0.25)',
    marginLeft: 'auto',
    maxWidth: '400px',
    width: 'fit-content',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10, marginTop: 14,
  },
  typingBubble: {
    display: 'flex', gap: 5, padding: '12px 15px',
    background: 'linear-gradient(135deg, rgba(15,31,20,0.9), rgba(10,21,16,0.95))',
    border: '1px solid var(--border)',
    borderRadius: '4px 14px 14px 14px',
    width: 'fit-content',
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--green-neon)',
    display: 'inline-block',
    boxShadow: '0 0 6px var(--green-neon)',
  },
};
