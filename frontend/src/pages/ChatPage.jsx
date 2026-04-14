import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, MapPin, Globe, Loader2, Info, Camera, Mic, MicOff, 
    Volume2, X, AlertCircle, History, Plus, MessageSquare, 
    User, Bot, ArrowRight, Table, Zap, TrendingUp, 
    Sprout, Activity, Trash2, Edit3, Download, Share2, FileText
} from 'lucide-react';
import { marked } from 'marked';
import { authService, chatService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [language, setLanguage] = useState('en');
    const [attachments, setAttachments] = useState([]); // Array of { id, data, type, name, preview }
    const [dragActive, setDragActive] = useState(false);
    const [profile, setProfile] = useState(null);
    
    // Auto-expand textarea
    const textareaRef = useRef(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);
    
    // Session State
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(null); // sessionId
    const [editValue, setEditValue] = useState('');

    const suggestedActions = [
        { label: "Regional Weather", icon: <Globe size={14} />, query: "What is the detailed weather forecast for my region?" },
        { label: "Market Trends", icon: <TrendingUp size={14} />, query: "Show me the latest mandi price trends for my crop." },
        { label: "Pest Alert", icon: <AlertCircle size={14} />, query: "Are there any pest outbreaks reported?" },
        { label: "Fertilizer Schedule", icon: <Activity size={14} />, query: "What is the recommended fertilizer schedule for my current growth stage?" }
    ];

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            try {
                const profileRes = await authService.getProfile();
                setProfile(profileRes.data);
                
                await loadSessions();
            } catch (err) {
                console.error("Initialization Error:", err);
                startNewChat();
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            // Re-fetch all history interleaved from backend
            const messagePairs = [];
            res.data.forEach(m => {
                // If we had user queries, we'd interleave them here
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
        a.download = `KrishiMitra_Consultation_${new Date().toISOString().slice(0,10)}.txt`;
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
                images: userMsg.attachments.map(a => a.data), // Send all previews/data
                preferred_language: language,
                location: profile?.location_name
            });
            
            const agentMsg = {
                role: 'agent',
                answer: res.data.answer,
                sources: res.data.sources,
                agents_used: res.data.agents_used,
                confidence: Math.floor(Math.random() * 15) + 85
            };

            setMessages(prev => [...prev, agentMsg]);
            
            // Update current session or load new one
            if (!currentSessionId && res.data.session_id) {
                setCurrentSessionId(res.data.session_id);
                loadSessions(); // Refresh sidebar to show new session
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, { role: 'agent', answer: "Connection error. Please verify the backend is running." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ''));
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="chat-interface">
            <aside className={`chat-history-sidebar glass ${isSidebarOpen ? '' : 'collapsed'}`}>
                <button className="new-chat-btn" onClick={startNewChat}>
                    <Plus size={18} /> New Consultation
                </button>
                
                <div className="history-groups">
                    <div className="history-group">
                        <label>Your Past Consultations</label>
                        <div className="session-list">
                            {sessions.map(session => (
                                <div 
                                    key={session.id} 
                                    className={`history-item ${currentSessionId === session.id ? 'active' : ''}`}
                                    onClick={() => loadSession(session.id)}
                                >
                                    <MessageSquare size={14} className="flex-shrink-0" />
                                    {isEditingTitle === session.id ? (
                                        <input 
                                            autoFocus
                                            className="edit-session-input"
                                            value={editValue}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={e => setEditValue(e.target.value)}
                                            onBlur={e => renameSession(e, session.id)}
                                            onKeyDown={e => e.key === 'Enter' && renameSession(e, session.id)}
                                        />
                                    ) : (
                                        <span className="session-title">{session.title}</span>
                                    )}
                                    <div className="session-actions" onClick={(e) => e.stopPropagation()}>
                                        {deletingSessionId === session.id ? (
                                            <div className="confirm-delete-group">
                                                <button className="confirm-btn" onClick={() => confirmDelete(session.id)} title="Confirm Delete">
                                                    <Trash2 size={12} color="var(--error)" /> 
                                                </button>
                                                <button className="cancel-btn" onClick={() => setDeletingSessionId(null)} title="Cancel">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={(e) => renameSession(e, session.id)} title="Rename"><Edit3 size={12} /></button>
                                                <button onClick={(e) => deleteSession(e, session.id)} title="Delete"><Trash2 size={12} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button className="download-all-btn glass-dark" onClick={downloadChat}>
                        <Download size={14} /> Export Current Chat
                    </button>
                    <div className="user-profile-mini">
                        <User size={18} />
                        <span>{profile?.full_name || 'Farmer Account'}</span>
                    </div>
                </div>
            </aside>

            <main 
                className={`chat-viewport ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
            >
                <header className="chat-viewport-header glass">
                    <button className="toggle-sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <History size={20} />
                    </button>
                    <div className="model-selector glass-dark">
                        <Zap size={16} color="var(--secondary)" />
                        <span>KrishiMitra Agentic v2.5</span>
                    </div>
                    <div className="header-actions">
                        <Globe size={18} />
                        <select className="glass-input" style={{ width: 'auto' }} value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </div>
                </header>

                <div className="chat-messages-container">
                    <div className="messages-wrapper">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <Motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`chat-message-row ${msg.role}`}
                                >
                                    <div className="message-content-wrapper">
                                        <div className="message-icon">
                                            {msg.role === 'agent' ? <Bot size={20} /> : <User size={20} />}
                                        </div>
                                        <div className="message-content">
                                            {msg.role === 'agent' && msg.agents_used?.length > 0 && (
                                                <div className="agent-workflow">
                                                    {msg.agents_used.map(ag => (
                                                        <span key={ag} className="workflow-badge">
                                                            <Zap size={10} /> {ag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div 
                                                className="markdown-body" 
                                                dangerouslySetInnerHTML={{ __html: marked(msg.answer || msg.text || '') }} 
                                            />
                                            {msg.sources?.length > 0 && (
                                                <div className="message-sources-list">
                                                    <p><Info size={12} /> Sources:</p>
                                                    <div className="sources-chips">
                                                        {msg.sources.map((s, si) => <span key={si}>{s.source}</span>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {msg.role === 'agent' && (
                                            <div className="message-actions">
                                                <button onClick={() => speak(msg.answer)} title="Listen"><Volume2 size={16}/></button>
                                                <button onClick={() => navigator.clipboard.writeText(msg.answer)} title="Copy"><ArrowRight size={16} className="rotate-90"/></button>
                                            </div>
                                        )}
                                    </div>
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                        {isTyping && (
                            <div className="chat-message-row agent">
                                <div className="message-content-wrapper">
                                    <div className="message-icon"><Bot size={20} /></div>
                                    <div className="typing-bubble">
                                        <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="chat-input-viewport">
                    <div className="suggested-actions">
                        {suggestedActions.map(action => (
                            <button key={action.label} className="action-chip" onClick={() => setInput(action.query)}>
                                {action.icon} {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="input-box-container glass">
                        {attachments.length > 0 && (
                            <div className="attachments-preview-bar">
                                {attachments.map(att => (
                                    <div key={att.id} className="attachment-thumbnail">
                                        {att.preview ? (
                                            <img src={att.preview} alt="preview" />
                                        ) : (
                                            <div className="file-icon">
                                                <FileText size={24} />
                                            </div>
                                        )}
                                        <button className="remove-btn" onClick={() => removeAttachment(att.id)}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="input-row">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple
                                onChange={e => handleFileSelect(e.target.files)}
                            />
                            <button className="input-action" onClick={() => fileInputRef.current.click()} title="Add Attachments (Images/PDFs)">
                                <Plus size={22} />
                            </button>
                            <textarea 
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Consult KrishiMitra..."
                                rows={1}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            />
                            <button className="send-btn" onClick={handleSend} disabled={isTyping || (!input.trim() && attachments.length === 0)}>
                                {isTyping ? <Loader2 size={18} className="lucide-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default ChatPage;
