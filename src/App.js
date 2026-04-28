import React, { useState, useEffect, useRef } from 'react';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function App() {
  const [user, setUser]           = useState(null);
  const [history, setHistory]     = useState([]);
  const [activeChat, setActiveChat] = useState(null); // full chat object being viewed
  const [chatKey, setChatKey]     = useState(0);      // forces ChatArea remount on New Chat
  const loadChatFnRef             = useRef(null);

  // ── Restore session ──────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('ecobotUser');
    if (saved) {
      try { setUser(JSON.parse(saved)); }
      catch { localStorage.removeItem('ecobotUser'); }
    }
  }, []);

  // ── Fetch full history whenever user is set ───────
  useEffect(() => {
    if (user?.userId) fetchHistory(user.userId);
  }, [user]);

  async function fetchHistory(userId) {
    try {
      const res  = await fetch(`${API}/history/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data); // already sorted newest-first by backend
    } catch (e) {
      console.warn('History fetch failed:', e);
    }
  }

  // ── Auth ─────────────────────────────────────────
  function handleAuth(authData) {
    const u = { userId: authData.userId, email: authData.email };
    setUser(u);
    localStorage.setItem('ecobotUser', JSON.stringify(u));
  }

  function handleLogout() {
    setUser(null);
    setHistory([]);
    setActiveChat(null);
    localStorage.removeItem('ecobotUser');
  }

  // ── New chat ──────────────────────────────────────
  function handleNewChat() {
    setActiveChat(null);
    setChatKey(k => k + 1); // remount ChatArea → blank welcome screen
  }

  // ── Select chat from sidebar ──────────────────────
  function handleSelectChat(item) {
    setActiveChat(item);
    if (loadChatFnRef.current) loadChatFnRef.current(item);
  }

  // ── Delete chat ───────────────────────────────────
  async function handleDeleteChat(chatId) {
    try {
      await fetch(`${API}/chat/${chatId}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h._id !== chatId));
      if (activeChat?._id === chatId) {
        setActiveChat(null);
        setChatKey(k => k + 1);
      }
    } catch (e) {
      console.warn('Delete failed:', e);
    }
  }

  // ── Bridge passed to ChatArea ─────────────────────
  // ChatArea calls bridge.refresh() after each new message
  // ChatArea calls bridge.setLoadChat(fn) to register its load function
  const bridge = useRef({});
  bridge.current.refresh      = () => user?.userId && fetchHistory(user.userId);
  bridge.current.setLoadChat  = fn  => { loadChatFnRef.current = fn; };

  return (
    <div style={styles.app}>
      {!user && <AuthForm onAuth={handleAuth} />}
      <Sidebar
        history={history}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        activeChatId={activeChat?._id}
        user={user}
        onLogout={handleLogout}
      />
      <ChatArea
        key={chatKey}
        user={user}
        bridge={bridge.current}
        initialChat={activeChat}
      />
    </div>
  );
}

const styles = {
  app: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg-void)',
  },
};
