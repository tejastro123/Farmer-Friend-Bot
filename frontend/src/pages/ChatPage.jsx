import React, { useState, useRef, useEffect } from 'react';
import {
    Send, MapPin, Globe, Info, Camera,
    Volume2, X, AlertCircle, History, Plus, MessageSquare,
    User, Trash2, Edit3, Download, FileText,
    ThumbsUp, ThumbsDown, CheckCircle2,
    ChevronLeft, ChevronRight, Paperclip
} from 'lucide-react';
import { marked } from 'marked';
import { authService, chatService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import './ChatPage.css';

// Wheat grain SVG for agent avatar
const WheatGrainIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M12 6c-2-2-4-1-4 2s2 4 4 4M12 6c2-2 4-1 4 2s-2 4-4 4" />
        <path d="M12 12c-3-2-5-1-5 3s3 5 5 5M12 12c3-2 5-1 5 3s-3 5-5 5" />
    </svg>
);

// Wheat wave typing animation
const WheatWaveTyping = () => (
    <div className="wheat-wave-typing">
        <div className="wheat-dot" />
        <div className="wheat-dot" />
        <div className="wheat-dot" />
    </div>
);

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [language, setLanguage] = useState('en');
    const [attachments, setAttachments] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [profile, setProfile] = useState(null);

    // Session State
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(null);
    const [editValue, setEditValue] = useState('');

    const suggestedActions = [
        { label: "Regional Weather", icon: "🌦", query: "What is the detailed weather forecast for my region?" },
        { label: "Market Trends", icon: "📈", query: "Show me the latest mandi price trends for my crop." },
        { label: "Pest Alert", icon: "🐛", query: "Are there any pest outbreaks reported?" },
        { label: "Fertilizer Guide", icon: "🌿", query: "What is the recommended fertilizer schedule for my current growth stage?" }
    ];

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const profileRes = await authService.getProfile();
                    setProfile(profileRes.data);
                }
                await loadSessions();
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 404) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                    }
                } else {
                    console.error("Initialization Error:", err);
                }
                startNewChat();
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-expand textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const loadSessions = async () => {
        try {
            const res = await chatService.getSessions();
            setSessions(res.data);
            if (res.data.length > 0 && !currentSessionId) {
                loadSession(res.data[0].id);
            } else if (res.data.length === 0) {
                startNewChat();
            }
        } catch (err) {
            console.error("Load Sessions Error:", err);
        }
    };

    const [deletingSessionId, setDeletingSessionId] = useState(null);

    const loadSession = async (sessionId) => {
        if (deletingSessionId) return;
        setCurrentSessionId(sessionId);
        setIsTyping(true);
        try {
            const res = await chatService.getSessionMessages(sessionId);
            const messagePairs = [];
            res.data.forEach(m => {
                messagePairs.push({ role: 'agent', ...m });
            });
            setMessages(messagePairs);
        } catch (err) {
            console.error("Load Session Error:", err);
        } finally {
            setIsTyping(false);
        }
    };

    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages([{
            role: 'agent',
            answer: "Namaste! 🙏 I am KrishiMitra, your specialized agricultural intelligence agent. How can I assist your farm today?",
            sources: [],
            agents_used: ["Orchestrator"],
            confidence: 100
        }]);
    };

    const confirmDelete = async (id) => {
        try {
            await chatService.deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (currentSessionId === id) startNewChat();
            setDeletingSessionId(null);
        } catch (err) {
            console.error("Delete Error:", err);
            setDeletingSessionId(null);
        }
    };

    const deleteSession = (e, id) => {
        e.stopPropagation();
        setDeletingSessionId(id);
    };

    const handleFileSelect = (files) => {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const isImage = file.type.startsWith('image/');
                const newAttachment = {
                    id: Math.random().toString(36).substr(2, 9),
                    data: reader.result,
                    name: file.name,
                    type: file.type,
                    preview: isImage ? reader.result : null
                };
                setAttachments(prev => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files);
    };

    const renameSession = async (e, id) => {
        e.stopPropagation();
        if (isEditingTitle === id) {
            try {
                await chatService.renameSession(id, editValue);
                setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editValue } : s));
                setIsEditingTitle(null);
            } catch (err) {
                console.error("Rename Error:", err);
            }
        } else {
            const session = sessions.find(s => s.id === id);
            setIsEditingTitle(id);
            setEditValue(session.title);
        }
    };

    const downloadChat = () => {
        const content = messages.map(m => `[${m.role.toUpperCase()}]\n${m.answer || m.text}\n`).join('\n---\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KrishiMitra_Consultation_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() && attachments.length === 0) return;

        const userMsg = {
            role: 'user',
            text: input,
            attachments: [...attachments],
            answer: input
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        setIsTyping(true);

        try {
            const res = await chatService.sendMessage({
                query: userMsg.text,
                session_id: currentSessionId,
                images: userMsg.attachments.map(a => a.data),
                preferred_language: language,
                location: profile?.location_name
            });

            const agentMsg = {
                role: 'agent',
                id: res.data.id,
                answer: res.data.answer,
                explanation: res.data.explanation,
                confidence: (res.data.confidence_score * 100).toFixed(0),
                sources: res.data.sources,
                citations: res.data.citations,
                agents_used: res.data.agents_used,
                session_id: res.data.session_id
            };

            setMessages(prev => [...prev, agentMsg]);

            if (!currentSessionId && res.data.session_id) {
                setCurrentSessionId(res.data.session_id);
                loadSessions();
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, { role: 'agent', answer: "Connection error. Please verify the backend is running." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFeedback = async (msgId, isHelpful, index) => {
        if (!msgId) return;
        try {
            await chatService.submitFeedback(msgId, { is_helpful: isHelpful });
            setMessages(prev => prev.map((m, i) => i === index ? { ...m, is_helpful: isHelpful } : m));
        } catch (err) {
            console.error("Feedback error:", err);
        }
    };

    const [correctionIndex, setCorrectionIndex] = useState(null);
    const [correctionText, setCorrectionText] = useState('');

    const submitCorrection = async () => {
        const msg = messages[correctionIndex];
        try {
            await chatService.submitFeedback(msg.id, { is_helpful: -1, feedback_text: correctionText });
            setMessages(prev => prev.map((m, i) => i === correctionIndex ? { ...m, is_helpful: -1, feedback_text: correctionText } : m));
            setCorrectionIndex(null);
            setCorrectionText('');
        } catch (err) {
            console.error("Correction error:", err);
        }
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ''));
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        window.speechSynthesis.speak(utterance);
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FA';

    return (
        <div className="chat-interface-v2">
            {/* Sidebar */}
            <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <button className="new-consultation-btn btn btn-ghost" onClick={startNewChat}>
                    <Plus size={16} /> New Consultation
                </button>

                <div className="sidebar-divider" />

                <div className="session-groups">
                    <label className="session-group-label">Past Consultations</label>
                    <div className="session-list">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                                onClick={() => loadSession(session.id)}
                            >
                                <WheatGrainIcon className="session-icon" />
                                {isEditingTitle === session.id ? (
                                    <input
                                        autoFocus
                                        className="session-edit-input"
                                        value={editValue}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={(e) => renameSession(e, session.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && renameSession(e, session.id)}
                                    />
                                ) : (
                                    <span className="session-title">{session.title}</span>
                                )}
                                <div className="session-actions" onClick={(e) => e.stopPropagation()}>
                                    {deletingSessionId === session.id ? (
                                        <div className="confirm-delete-group">
                                            <button className="confirm-btn" onClick={() => confirmDelete(session.id)}>
                                                <X size={12} />
                                            </button>
                                            <button className="cancel-btn" onClick={() => setDeletingSessionId(null)}>
                                                <CheckCircle2 size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={(e) => renameSession(e, session.id)}>
                                                <Edit3 size={12} />
                                            </button>
                                            <button onClick={(e) => deleteSession(e, session.id)}>
                                                <Trash2 size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <div className="footer-user">
                        <div className="footer-avatar">{initials}</div>
                        <span className="footer-name">{profile?.full_name || 'Farmer Account'}</span>
                    </div>
                    <button className="export-link" onClick={downloadChat}>
                        <Download size={14} /> Export Chat
                    </button>
                </div>
            </aside>

            {/* Main Viewport */}
            <main className="chat-viewport-v2">
                <header className="viewport-header">
                    <button className="toggle-sidebar-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div className="model-badge surface">
                        <span>KrishiMitra Advisor — Gemini Flash</span>
                    </div>
                    <div className="language-selector">
                        <Globe size={14} />
                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="en">EN</option>
                            <option value="hi">HI</option>
                        </select>
                    </div>
                </header>

                <div className="messages-area">
                    <div className="messages-inner">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <Motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className={`message message-${msg.role}`}
                                >
                                    {msg.role === 'agent' && (
                                        <div className="message-avatar agent-avatar">
                                            <WheatGrainIcon />
                                        </div>
                                    )}
                                    <div className="message-body">
                                        {msg.role === 'agent' && msg.agents_used?.length > 0 && (
                                            <div className="workflow-row">
                                                {msg.agents_used.map(ag => (
                                                    <span key={ag} className="agent-pill">
                                                        {ag === 'Weather' ? '🌤' : ag === 'Market' ? '📊' : ag === 'Crop' ? '🌱' : '⚡'} {ag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {msg.role === 'agent' && msg.confidence && msg.confidence < 70 && (
                                            <div className="confidence-warning label">
                                                <AlertCircle size={12} />
                                                Confidence: {msg.confidence}%
                                            </div>
                                        )}
                                        <div
                                            className="message-text markdown-body"
                                            dangerouslySetInnerHTML={{ __html: marked(msg.answer || msg.text || '') }}
                                        />
                                        {msg.role === 'user' && (
                                            <div className="message-timestamp">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === 'agent' && (
                                        <div className="message-feedback">
                                            <button
                                                className={`feedback-btn ${msg.is_helpful === 1 ? 'active' : ''}`}
                                                onClick={() => handleFeedback(msg.id, 1, i)}
                                            >
                                                <ThumbsUp size={14} />
                                            </button>
                                            <button
                                                className={`feedback-btn ${msg.is_helpful === -1 ? 'active' : ''}`}
                                                onClick={() => setCorrectionIndex(i)}
                                            >
                                                <ThumbsDown size={14} />
                                            </button>
                                        </div>
                                    )}
                                </Motion.div>
                            ))}
                        </AnimatePresence>

                        {isTyping && (
                            <Motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="message message-agent typing"
                            >
                                <div className="message-avatar agent-avatar">
                                    <WheatGrainIcon />
                                </div>
                                <WheatWaveTyping />
                            </Motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="input-area">
                    <div className="suggested-chips">
                        {suggestedActions.map((action, idx) => (
                            <button
                                key={idx}
                                className="suggestion-chip"
                                onClick={() => setInput(action.query)}
                            >
                                <span>{action.icon}</span>
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="input-box surface">
                        {attachments.length > 0 && (
                            <div className="attachment-thumbs">
                                {attachments.map(att => (
                                    <div key={att.id} className="attachment-thumb">
                                        {att.preview ? (
                                            <img src={att.preview} alt="preview" />
                                        ) : (
                                            <FileText size={20} />
                                        )}
                                        <button onClick={() => removeAttachment(att.id)}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="input-row-v2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={(e) => handleFileSelect(e.target.files)}
                            />
                            <button className="attach-btn" onClick={() => fileInputRef.current.click()}>
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Consult KrishiMitra..."
                                rows={1}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            />
                            <button className="send-button" onClick={handleSend} disabled={isTyping || (!input.trim() && attachments.length === 0)}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                    <p className="input-disclaimer">
                        KrishiMitra AI may make mistakes. Verify important advice with your local Krishi Kendra.
                    </p>
                </footer>

                {correctionIndex !== null && (
                    <Motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="correction-overlay"
                        onClick={() => setCorrectionIndex(null)}
                    >
                        <div className="correction-panel surface" onClick={(e) => e.stopPropagation()}>
                            <p className="correction-label">How can I improve this answer?</p>
                            <textarea
                                value={correctionText}
                                onChange={(e) => setCorrectionText(e.target.value)}
                                placeholder="Provide the correct information or outcome..."
                                rows={3}
                            />
                            <div className="correction-buttons">
                                <button className="btn btn-secondary" onClick={() => setCorrectionIndex(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={submitCorrection}>Submit Correction</button>
                            </div>
                        </div>
                    </Motion.div>
                )}
            </main>
        </div>
    );
};

export default ChatPage;
