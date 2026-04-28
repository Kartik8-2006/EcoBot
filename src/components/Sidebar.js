import React, { useState } from 'react';

export default function Sidebar({ history, onNewChat, onSelectChat, onDeleteChat, activeChatId, user, onLogout }) {
  const [hoveredId, setHoveredId]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const initials    = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';
  const displayName = user?.email?.split('@')[0] || 'Guest';

  const now      = new Date();
  const todayStr = now.toDateString();
  const weekAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const todayItems = history.filter(h => h.createdAt && new Date(h.createdAt).toDateString() === todayStr);
  const weekItems  = history.filter(h => {
    if (!h.createdAt) return false;
    const d = new Date(h.createdAt);
    return d.toDateString() !== todayStr && d >= weekAgo;
  });
  const olderItems = history.filter(h => {
    if (!h.createdAt) return true;
    return new Date(h.createdAt) < weekAgo;
  });

  function handleDelete(e, id) {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDeleteChat(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(c => c === id ? null : c), 2500);
    }
  }

  function renderGroup(label, items) {
    if (!items.length) return null;
    return (
      <div key={label} style={{ marginBottom: 6 }}>
        <div style={S.groupLabel}>{label}</div>
        {items.map(item => (
          <HistoryItem
            key={item._id}
            item={item}
            active={activeChatId === item._id}
            hovered={hoveredId === item._id}
            confirmingDelete={confirmDelete === item._id}
            onHover={v => setHoveredId(v ? item._id : null)}
            onClick={() => onSelectChat(item)}
            onDelete={e => handleDelete(e, item._id)}
          />
        ))}
      </div>
    );
  }

  return (
    <aside style={S.sidebar}>
      <div style={S.accentLine} />

      {/* Header */}
      <div style={S.header}>
        <div style={S.logoRow}>
          <div style={S.logoOrb}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--green-neon)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={S.logoText}>Eco<span style={{ color: 'var(--green-neon)', fontStyle: 'italic' }}>Bot</span></div>
            <div style={S.tagline}>Green AI Shopping</div>
          </div>
        </div>
        <button style={S.newBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,105,0.12)'; e.currentTarget.style.borderColor = 'var(--green-neon)'; e.currentTarget.style.boxShadow = 'var(--glow-sm)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          onClick={onNewChat}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--green-neon)" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New chat
        </button>
      </div>

      {/* History */}
      <div style={S.scroll}>
        {history.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 28, opacity: 0.4, marginBottom: 10 }}>🌱</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>No conversations yet</p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.6, textAlign: 'center' }}>Start chatting to see your history here</p>
          </div>
        ) : (
          <>
            {renderGroup('Today', todayItems)}
            {renderGroup('This Week', weekItems)}
            {renderGroup('Earlier', olderItems)}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <div style={S.userRow}>
          <div style={S.avatar}>{initials}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={S.userName}>{displayName}</div>
            <div style={S.userEmail}>{user?.email || ''}</div>
          </div>
          <button style={S.logoutBtn} title="Logout" onClick={onLogout}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function HistoryItem({ item, active, hovered, confirmingDelete, onHover, onClick, onDelete }) {
  const text = item.message || 'Untitled';
  const time = item.createdAt
    ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <div
      style={{ ...S.histItem, ...(active ? S.histActive : hovered ? S.histHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {active && <div style={S.activeBar} />}
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8"
        style={{ flexShrink: 0, opacity: active ? 0.9 : 0.3, color: active ? 'var(--green-neon)' : 'inherit' }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <div style={S.histContent}>
        <span style={{ ...S.histText, color: active ? 'var(--green-neon)' : 'var(--text-secondary)' }}>
          {text.length > 26 ? text.slice(0, 26) + '…' : text}
        </span>
        {time && <span style={S.histTime}>{time}</span>}
      </div>
      {(hovered || active || confirmingDelete) && (
        <button
          style={{ ...S.deleteBtn, ...(confirmingDelete ? S.deleteBtnConfirm : {}) }}
          title={confirmingDelete ? 'Confirm delete' : 'Delete'}
          onClick={onDelete}
        >
          {confirmingDelete
            ? <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          }
        </button>
      )}
    </div>
  );
}

const S = {
  sidebar: {
    width: 260, minWidth: 260,
    background: 'linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-void) 100%)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    height: '100vh', overflow: 'hidden',
    position: 'relative', zIndex: 1,
  },
  accentLine: {
    position: 'absolute', top: 0, right: 0, width: 1, height: '100%',
    background: 'linear-gradient(180deg, var(--green-neon), transparent 40%, transparent 70%, var(--green-mid))',
    opacity: 0.2, pointerEvents: 'none',
  },
  header: { padding: '20px 14px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  logoOrb: {
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, var(--green-muted), var(--bg-card))',
    border: '1px solid var(--border-bright)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--glow-sm)',
  },
  logoText: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 },
  tagline: { fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 },
  newBtn: {
    width: '100%', padding: '9px 13px', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: 9,
    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '10px 6px 6px' },
  groupLabel: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--text-dim)',
    padding: '6px 10px 3px',
  },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' },
  histItem: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '7px 8px', borderRadius: 8,
    cursor: 'pointer', marginBottom: 1,
    transition: 'all 0.15s', position: 'relative', overflow: 'hidden', minHeight: 36,
    border: '1px solid transparent',
  },
  histHover: { background: 'rgba(52,211,105,0.05)' },
  histActive: { background: 'rgba(52,211,105,0.08)', borderColor: 'rgba(52,211,105,0.14)' },
  activeBar: {
    position: 'absolute', left: 0, top: '20%', bottom: '20%',
    width: 2, background: 'var(--green-neon)', borderRadius: 1, boxShadow: '0 0 8px var(--green-neon)',
  },
  histContent: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 1 },
  histText: { fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  histTime: { fontSize: 10, color: 'var(--text-dim)' },
  deleteBtn: {
    flexShrink: 0, width: 22, height: 22,
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 5, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#f87171', transition: 'all 0.15s',
  },
  deleteBtnConfirm: { background: 'rgba(239,68,68,0.2)', borderColor: '#f87171', boxShadow: '0 0 8px rgba(239,68,68,0.25)' },
  footer: { padding: '10px 8px 12px', borderTop: '1px solid var(--border)', background: 'rgba(6,13,9,0.85)', flexShrink: 0 },
  userRow: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: 'linear-gradient(135deg, var(--green-mid), var(--green-deep))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#fff',
    border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-sm)',
  },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: 5, borderRadius: 6,
    display: 'flex', alignItems: 'center', transition: 'all 0.2s', flexShrink: 0,
  },
};
