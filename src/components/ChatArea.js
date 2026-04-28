import React, { useState, useRef, useEffect } from 'react';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import WelcomeScreen from './WelcomeScreen';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function ChatArea({ user, bridge, initialChat }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [chatTitle, setChatTitle] = useState('EcoBot');
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef            = useRef(null);
  const textareaRef               = useRef(null);

  // Generate new session on mount
  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Register loadChat function with App so sidebar clicks work
  useEffect(() => {
    if (bridge?.setLoadChat) {
      bridge.setLoadChat((item) => {
        // Load chat and set its sessionId from the DB record
        let reconstructedMessages = [];
        
        if (item.messages && item.messages.length > 0) {
          // Interleave user messages and bot responses in proper order
          const messages = item.messages || [];
          const responses = item.responses || [];
          
          for (let i = 0; i < Math.max(messages.length, responses.length); i++) {
            if (messages[i]) {
              reconstructedMessages.push({ role: 'user', text: messages[i].text });
            }
            if (responses[i]) {
              reconstructedMessages.push({ role: 'bot', text: responses[i].text, products: responses[i].products || [] });
            }
          }
        } else {
          // Fallback for old format
          reconstructedMessages = [
            { role: 'user', text: item.lastMessage || item.message },
            { role: 'bot',  text: item.lastResponse || item.response, products: item.lastProducts || item.products || [] },
          ];
        }
        
        setMessages(reconstructedMessages);
        setChatTitle((item.message || item.lastMessage || '').length > 40 ? (item.message || item.lastMessage || '').slice(0, 40) + '…' : (item.message || item.lastMessage || ''));
        setSessionId(item._id);  // Set the session to this chat's ID
        setError('');
      });
    }
  }, [bridge]);

  // Load initialChat if provided on mount
  useEffect(() => {
    if (initialChat) {
      setMessages([
        { role: 'user', text: initialChat.lastMessage || initialChat.message },
        { role: 'bot',  text: initialChat.lastResponse || initialChat.response, products: initialChat.lastProducts || initialChat.products || [] },
      ]);
      setChatTitle((initialChat.message || initialChat.lastMessage || '').length > 40 ? (initialChat.message || initialChat.lastMessage || '').slice(0, 40) + '…' : (initialChat.message || initialChat.lastMessage || ''));
      setSessionId(initialChat._id);
    }
    // eslint-disable-next-line
  }, []);

  async function sendMessage(msg) {
    const text = (msg || input).trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages(prev => [...prev, { role: 'user', text }]);
    if (messages.length === 0) {
      setChatTitle(text.length > 40 ? text.slice(0, 40) + '…' : text);
    }
    setLoading(true);

    try {
      const res  = await fetch(`${API}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, userId: user?.userId || 'guest', sessionId: sessionId }),
      });
      const data = await res.json();

      if (data.detail) {
        setError(data.detail);
      } else {
        // Update sessionId if it's new (first message)
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
        setMessages(prev => [...prev, { role: 'bot', text: data.reply, products: data.products || [] }]);
        if (bridge?.refresh) bridge.refresh();
      }
    } catch {
      setError('Could not reach EcoBot backend. Make sure the server is running at ' + API);
    }

    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  }

  const userName = user?.email?.split('@')[0] || 'You';
  const isEmpty  = messages.length === 0;

  return (
    <div style={S.area}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <div style={S.topDot} />
          <span style={S.topTitle}>{chatTitle}</span>
        </div>
        <div style={S.topRight}>
          <div style={S.statusBadge}>
            <span style={S.statusDot} />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={S.messages}>
        {isEmpty ? (
          <WelcomeScreen onSuggestion={sendMessage} userName={userName} />
        ) : (
          <div style={S.msgList}>
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} text={m.text} products={m.products} userName={userName} />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div style={S.errorBox}>
                <span style={{ marginRight: 7 }}>⚠</span>{error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={S.inputArea}>
        <div style={S.inputBox}
          onFocus={() => {}} // handled inline
        >
          {/* Leaf icon */}
          <div style={S.inputLeaf}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--green-neon)" strokeWidth="1.8" opacity="0.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            onFocus={e => e.target.closest('[data-inputbox]') && (e.target.closest('[data-inputbox]').style.borderColor = 'var(--green-neon)')}
            placeholder="Ask about eco-friendly products…"
            rows={1}
            style={S.textarea}
            data-input
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ ...S.sendBtn, ...(loading || !input.trim() ? S.sendBtnOff : S.sendBtnOn) }}
            onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading
              ? <span style={S.sendSpinner} />
              : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff" stroke="none"/>
                </svg>
            }
          </button>
        </div>
        <p style={S.hint}>
          EcoBot focuses on sustainable & eco-friendly products · Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

const S = {
  area: {
    flex: 1, display: 'flex', flexDirection: 'column',
    height: '100vh', overflow: 'hidden',
    background: 'linear-gradient(180deg, var(--bg-void) 0%, var(--bg-deep) 100%)',
    position: 'relative',
  },
  topbar: {
    padding: '12px 22px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0, backdropFilter: 'blur(10px)',
    background: 'rgba(6,13,9,0.7)',
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  topDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green-neon)', boxShadow: '0 0 8px var(--green-neon)' },
  topTitle: { fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 300, color: 'var(--text-secondary)', letterSpacing: '-0.2px' },
  topRight: {},
  statusBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, color: 'var(--text-muted)',
    background: 'rgba(52,211,105,0.06)',
    border: '1px solid var(--border)',
    padding: '3px 10px', borderRadius: 20,
  },
  statusDot: {
    width: 5, height: 5, borderRadius: '50%',
    background: 'var(--green-neon)',
    boxShadow: '0 0 5px var(--green-neon)',
    animation: 'glowPulse 2s ease-in-out infinite',
  },
  messages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  msgList: { display: 'flex', flexDirection: 'column', gap: 22, padding: '24px 28px' },
  errorBox: {
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    color: '#f87171', borderRadius: 10, padding: '10px 14px', fontSize: 13,
  },
  inputArea: { padding: '12px 20px 14px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'rgba(6,13,9,0.6)', backdropFilter: 'blur(10px)' },
  inputBox: {
    display: 'flex', alignItems: 'flex-end', gap: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1.5px solid var(--border)',
    borderRadius: 14, padding: '10px 12px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputLeaf: { flexShrink: 0, marginBottom: 3 },
  textarea: {
    flex: 1, border: 'none', background: 'transparent',
    fontSize: 14, color: 'var(--text-primary)',
    resize: 'none', outline: 'none',
    maxHeight: 120, minHeight: 22, lineHeight: 1.55,
    fontFamily: 'var(--font-body)',
  },
  sendBtn: {
    width: 36, height: 36, border: 'none', borderRadius: 10,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.2s var(--ease-spring)',
  },
  sendBtnOn: { background: 'linear-gradient(135deg, var(--green-mid), var(--green-deep))', boxShadow: 'var(--glow-sm)' },
  sendBtnOff: { background: 'rgba(255,255,255,0.04)', cursor: 'default' },
  sendSpinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.15)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  hint: { fontSize: 10.5, color: 'var(--text-dim)', textAlign: 'center', marginTop: 7, lineHeight: 1.5 },
};

if (!document.getElementById('chatarea-spin')) {
  const s = document.createElement('style');
  s.id = 'chatarea-spin';
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}
