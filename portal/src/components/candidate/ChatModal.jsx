import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import {
  FiX, FiSearch, FiMessageSquare, FiSend, FiSmile, FiPaperclip,
  FiStar, FiChevronLeft, FiMoreVertical, FiClock,
} from 'react-icons/fi';
import { useAuth } from '../../AuthContext';
import authService from '../../services/authService';
import { useCandidateChats } from '../../hooks/useCandidateQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/queryKeys';

const getSocketUrl = () => (
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/api\/v\d+$/, "");

const getInitials = (name = "C") =>
  String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "C";

const normalizeThread = (thread = {}, index = 0) => {
  const companyName = thread.companyName || (thread.jobTitle?.includes(" - ") ? thread.jobTitle.split(" - ")[0].trim() : "Company");
  const role = thread.jobTitle?.includes(" - ")
    ? thread.jobTitle.split(" - ").slice(1).join(" - ").trim()
    : thread.jobTitle || "Recruiter conversation";
  return {
    ...thread,
    id: String(thread.id || thread._id || `thread-${index}`),
    companyName,
    companyLogo: thread.companyLogo || "",
    avatar: getInitials(companyName),
    role,
    preview: thread.lastMessageText || "No messages yet",
    time: thread.lastUpdated || thread.time || "Just now",
    unread: Number(thread.unreadCount || 0) > 0 || thread.lastSenderRole === "COMPANY",
    messages: Array.isArray(thread.messages) ? thread.messages : [],
  };
};

export default function ChatModal({ isOpen, onClose, followedCompanyIds = [] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: initialThreads = [] } = useCandidateChats(!!user && isOpen);

  const [threads, setThreads] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const threadsRef = useRef([]);
  const activeThreadIdRef = useRef("");

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  useEffect(() => {
    activeThreadIdRef.current = activeConv?.id || "";
  }, [activeConv?.id]);

  useEffect(() => {
    if (!initialThreads.length) return;
    const normalized = initialThreads.map(normalizeThread)
      .filter(t => followedCompanyIds.length === 0 || followedCompanyIds.includes(t.companyId));
    setThreads(normalized);
    setLoadingThreads(false);
    if (!activeConv && normalized.length > 0) {
      setActiveConv(normalized[0]);
    }
  }, [initialThreads, followedCompanyIds]);

  useEffect(() => {
    if (!isOpen || !user) return;
    setThreads([]);
    setActiveConv(null);
    setSearchQuery('');
    setShowMobileList(true);
    setLoadingThreads(true);
    setLoadingMessages(false);
    queryClient.invalidateQueries({ queryKey: queryKeys.candidate.chats(user._id) });
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages?.length]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!user || !isOpen) return;
    const token = localStorage.getItem("candidateToken") || localStorage.getItem("token");
    if (!token || socketRef.current) return;

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      threadsRef.current.forEach((t) => { if (t.id) socket.emit("thread:join", { threadId: t.id }); });
      if (activeThreadIdRef.current) socket.emit("thread:join", { threadId: activeThreadIdRef.current });
    });

    socket.on("chat:message", ({ threadId, message, thread }) => {
      setThreads((current) => current.map((conversation, index) => {
        if (String(conversation.id) !== String(threadId)) return conversation;
        const nextMessages = Array.isArray(conversation.messages) ? [...conversation.messages] : [];
        const isFromMe = message.senderRole === "CANDIDATE";

        if (isFromMe) {
          const lastMsg = nextMessages[nextMessages.length - 1];
          if (lastMsg && lastMsg.from === "me" && lastMsg.text === message.text && lastMsg.time === "Just now") {
            nextMessages[nextMessages.length - 1] = { from: "me", text: message.text || "", time: message.lastUpdated || "Just now" };
            return normalizeThread({ ...conversation, ...thread, messages: nextMessages, lastMessageText: message.text || conversation.preview, unreadCount: 0 }, index);
          }
        }

        return normalizeThread({
          ...conversation, ...thread,
          messages: [...nextMessages, { from: isFromMe ? "me" : "them", text: message.text || "", time: message.lastUpdated || "Just now" }],
          lastMessageText: message.text || conversation.preview,
          unreadCount: !isFromMe ? 1 : 0,
        }, index);
      }));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeConv?.id || !socketRef.current?.connected) return;
    socketRef.current.emit("thread:join", { threadId: activeConv.id });
  }, [activeConv?.id, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeConv?.id) return;
    const load = async () => {
      setLoadingMessages(true);
      try {
        const res = await authService.getCandidateChatMessages(activeConv.id);
        const threadMessages = res?.data?.messages || [];
        setThreads((current) => current.map((t, idx) => {
          if (String(t.id) !== String(activeConv.id)) return t;
          return normalizeThread({
            ...t, ...res?.data?.thread,
            messages: threadMessages.map((m) => ({ from: m.senderRole === "CANDIDATE" ? "me" : "them", text: m.text || "", time: m.lastUpdated || "Just now" })),
            unreadCount: 0,
          }, idx);
        }));
        await authService.markCandidateChatRead(activeConv.id);
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    load();
  }, [activeConv?.id, isOpen]);

  useEffect(() => {
    setThreads((current) => current.map((t) => {
      if (String(t.id) === String(activeConv?.id)) return { ...t, unread: false };
      return t;
    }));
  }, [activeConv?.id]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv?.id) return;
    const text = input.trim();
    setInput("");
    setThreads((current) => current.map((t, idx) =>
      String(t.id) === String(activeConv.id)
        ? normalizeThread({ ...t, lastMessageText: text, messages: [...(t.messages || []), { from: "me", text, time: "Just now" }], unreadCount: 0 }, idx)
        : t
    ));
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    try { await authService.sendCandidateChatMessage(activeConv.id, { text }); }
    catch (err) { console.error("Send failed", err); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filteredThreads = threads.filter((t) =>
    t.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Chat with recruiters"
    >
      <div
        style={{
          width: 'min(900px, 100%)', height: 'min(560px, 90vh)',
          background: '#fff', borderRadius: 20, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.25s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0,
        }}>
          {!showMobileList && activeConv && (
            <button
              onClick={() => setShowMobileList(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'none' }}
              className="chat-modal-back-btn"
            >
              <FiChevronLeft size={20} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiMessageSquare size={16} style={{ color: '#2563EB' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Elite Recruiter Chat</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>
                {threads.length > 0 ? `${threads.length} conversation${threads.length !== 1 ? 's' : ''}` : 'Direct conversations with recruiters'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close chat"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#94A3B8' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel */}
          <div style={{ width: 300, minWidth: 300, borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', background: '#FAFBFC' }} className="chat-modal-left">
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '6px 12px' }}>
                <FiSearch size={14} style={{ color: '#94A3B8' }} />
                <input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 12, background: 'transparent' }}
                  aria-label="Search conversations"
                />
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
              {loadingThreads ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Loading...</div>
              ) : filteredThreads.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </div>
              ) : (
                filteredThreads.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveConv(c); setShowMobileList(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', border: 'none', borderRadius: 10,
                      background: activeConv?.id === c.id ? '#EEF2FF' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {c.companyLogo ? (
                        <img src={c.companyLogo} alt={c.companyName}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#F1F5F9',
                        display: c.companyLogo ? 'none' : 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#64748B',
                      }}>
                        {c.companyName ? getInitials(c.companyName) : '?'}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{c.companyName}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.preview}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>{c.time}</span>
                      {c.unread && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#2563EB', borderRadius: 10, padding: '1px 6px', display: 'inline-block', marginTop: 2 }}>1</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {activeConv ? (
              <>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {activeConv.companyLogo ? (
                        <img src={activeConv.companyLogo} alt={activeConv.companyName}
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF', display: activeConv.companyLogo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#4338CA' }}>
                        {getInitials(activeConv.companyName)}
                      </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{activeConv.companyName}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{activeConv.role}</p>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, padding: 20 }}>Loading messages...</div>
                  ) : (() => {
                    const active = threads.find((t) => t.id === activeConv.id);
                    const msgs = active?.messages || [];
                    return msgs.length > 0 ? msgs.map((m, idx) => (
                      <div key={m.id || idx} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '75%', padding: '10px 14px',
                          borderRadius: m.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: m.from === 'me' ? '#2563EB' : '#F1F5F9',
                          color: m.from === 'me' ? '#fff' : '#0F172A',
                          fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                        }}>
                          {m.text}
                          <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 8, color: m.from === 'me' ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>{m.time}</span>
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, padding: 20 }}>No messages yet. Start the conversation!</div>
                    );
                  })()}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '12px 18px', borderTop: '1px solid #F1F5F9', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button tabIndex={-1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiPaperclip size={16} /></button>
                  <button tabIndex={-1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiSmile size={16} /></button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: '6px 12px' }}>
                    <input
                      placeholder="Type a message..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ border: 'none', outline: 'none', flex: 1, fontSize: 12, background: 'transparent' }}
                      aria-label="Type a message"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      style={{
                        background: input.trim() ? '#2563EB' : '#E2E8F0',
                        border: 'none', borderRadius: 8, padding: '6px 8px',
                        color: input.trim() ? '#fff' : '#94A3B8',
                        cursor: input.trim() ? 'pointer' : 'default',
                        display: 'flex', transition: 'all 0.15s',
                      }}
                      aria-label="Send message"
                    >
                      <FiSend size={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <FiMessageSquare size={28} style={{ color: '#2563EB' }} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Select a conversation</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B', maxWidth: 240 }}>
                  Choose a conversation from the left panel to start chatting with recruiters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
