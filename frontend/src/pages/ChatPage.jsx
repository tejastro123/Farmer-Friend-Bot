import React, { useState, useRef, useEffect } from 'react';
import {
    Send, MapPin, Globe, Info, Camera,
    Volume2, VolumeX, X, AlertCircle, History, Plus, MessageSquare,
    User, Trash2, Edit3, Download, FileText, Copy, Check,
    ThumbsUp, ThumbsDown, CheckCircle2, ChevronLeft, ChevronRight, 
    Paperclip, Sparkles, Bot, Wifi, WifiOff, Settings, Cpu
} from 'lucide-react';
import { marked } from 'marked';
import { authService, chatService } from '../services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import './ChatPage.css';

const MODELS = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', desc: 'Latest, fastest, vision capable' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', desc: 'Latest, Reliable, good performance' },
    { id: 'gemini-pro', name: 'Gemini Pro', desc: 'Most capable, complex tasks' }
];

const WheatGrainIcon = ({ className, size = 20 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M12 6c-2-2-4-1-4 2s2 4 4 4M12 6c2-2 4-1 4 2s-2 4-4 4" />
        <path d="M12 12c-3-2-5-1-5 3s3 5 5 5M12 12c3-2 5-1 5 3s-3 5-5 5" />
    </svg>
);

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
    const [profile, setProfile] = useState(null);

    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showSources, setShowSources] = useState(null);
    const [connectionError, setConnectionError] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const [copiedMsgId, setCopiedMsgId] = useState(null);

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
                }
                startNewChat();
            }
        };
        init();
    }, []);

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
            answer: "Namaste! 🙏 I'm KrishiMitra, your agricultural AI advisor. Ask me about crops, weather, market prices, pests, or government schemes.",
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
        setConnectionError(false);

        try {
            const res = await chatService.sendMessage({
                query: userMsg.text,
                session_id: currentSessionId,
                images: userMsg.attachments.map(a => a.data),
                preferred_language: language,
                location: profile?.location_name,
                model: selectedModel
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
            setConnectionError(true);
            setMessages(prev => [...prev, { 
                role: 'agent', 
                answer: "Sorry, I couldn't connect to the server. Please check your connection and try again." 
            }]);
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
        if (!msg?.id) {
            setCorrectionIndex(null);
            setCorrectionText('');
            return;
        }
        try {
            await chatService.submitFeedback(msg.id, { is_helpful: -1, feedback_text: correctionText });
            setMessages(prev => prev.map((m, i) => i === correctionIndex ? { ...m, is_helpful: -1, feedback_text: correctionText } : m));
            setCorrectionIndex(null);
            setCorrectionText('');
        } catch (err) {
            console.error("Correction error:", err);
        }
    };

    const handleSpeak = (msg) => {
        if (speakingMsgId === msg.id) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
        } else {
            window.speechSynthesis.cancel();
            const text = msg.answer?.replace(/[*#_]/g, '') || '';
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
            utterance.onend = () => setSpeakingMsgId(null);
            setSpeakingMsgId(msg.id);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleCopy = (msg) => {
        const text = msg.answer || msg.text || '';
        navigator.clipboard.writeText(text);
        setCopiedMsgId(msg.id);
        setTimeout(() => setCopiedMsgId(null), 2000);
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'FA';

    return (
        <div className="chat-page-container">
            <aside className={`chat-sidebar-v2 ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header-v2">
                    <button className="new-chat-btn-v2" onClick={startNewChat}>
                        <Plus size={18} />
                        New Consultation
                    </button>
                </div>

                <div className="sessions-section-v2">
                    <div className="section-label">
                        <History size={14} />
                        Past Consultations
                    </div>
                    <div className="sessions-list-v2">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className={`session-item-v2 ${currentSessionId === session.id ? 'active' : ''}`}
                                onClick={() => loadSession(session.id)}
                            >
                                <WheatGrainIcon className="session-icon-v2" size={16} />
                                {isEditingTitle === session.id ? (
                                    <input
                                        autoFocus
                                        className="session-edit-v2"
                                        value={editValue}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={(e) => renameSession(e, session.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && renameSession(e, session.id)}
                                    />
                                ) : (
                                    <span className="session-title-v2">{session.title}</span>
                                )}
                                <div className="session-actions-v2" onClick={(e) => e.stopPropagation()}>
                                    {deletingSessionId === session.id ? (
                                        <div className="delete-confirm-v2">
                                            <button onClick={() => confirmDelete(session.id)}><CheckCircle2 size={14} /></button>
                                            <button onClick={() => setDeletingSessionId(null)}><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={(e) => renameSession(e, session.id)}><Edit3 size={14} /></button>
                                            <button onClick={(e) => deleteSession(e, session.id)}><Trash2 size={14} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-footer-v2">
                    <div className="user-profile-v2">
                        <div className="user-avatar-v2">{initials}</div>
                        <div className="user-info-v2">
                            <span className="user-name-v2">{profile?.full_name || 'Farmer'}</span>
                            <span className="user-location-v2">{profile?.location_name || 'Not set'}</span>
                        </div>
                    </div>
                    <button className="export-btn-v2" onClick={downloadChat}>
                        <Download size={14} />
                        Export
                    </button>
                </div>
            </aside>

            <main className="chat-main-v2">
                <header className="chat-header-v2">
                    <button className="toggle-btn-v2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div className="model-info-v2">
                        <Bot size={18} className="model-icon-v2" />
                        <div className="model-text-v2">
                            <span className="model-name-v2">KrishiMitra Advisor</span>
                            <button className="model-type-v2" onClick={() => setShowModelSelector(!showModelSelector)}>
                                <Cpu size={12} />
                                {MODELS.find(m => m.id === selectedModel)?.name || 'Select Model'}
                            </button>
                        </div>
                        {showModelSelector && (
                            <div className="model-selector-dropdown">
                                {MODELS.map(m => (
                                    <button
                                        key={m.id}
                                        className={`model-option ${selectedModel === m.id ? 'active' : ''}`}
                                        onClick={() => { setSelectedModel(m.id); setShowModelSelector(false); }}
                                    >
                                        <div className="model-option-name">{m.name}</div>
                                        <div className="model-option-desc">{m.desc}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="header-actions-v2">
                        <div className="language-picker-v2">
                            <Globe size={14} />
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="en">English</option>
                                <option value="hi">हिंदी</option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="messages-container-v2">
                    <div className="messages-scroll-v2">
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <Motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`message-wrapper-v2 ${msg.role === 'user' ? 'user' : 'agent'}`}
                                >
                                    {msg.role === 'agent' && (
                                        <div className="agent-avatar-v2">
                                            <WheatGrainIcon size={22} />
                                        </div>
                                    )}
                                    <div className="message-content-v2">
                                        {msg.role === 'agent' && msg.agents_used?.length > 0 && (
                                            <div className="agents-used-v2">
                                                {msg.agents_used.map(ag => (
                                                    <span key={ag} className="agent-tag-v2">
                                                        {ag === 'Weather' ? '🌤' : ag === 'Market' ? '📊' : ag === 'Crop' ? '🌱' : ag === 'Orchestrator' ? '⚡' : '💡'} {ag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {msg.role === 'agent' && msg.confidence && msg.confidence < 70 && (
                                            <div className="confidence-low-v2">
                                                <AlertCircle size={12} />
                                                Confidence: {msg.confidence}%
                                            </div>
                                        )}
                                        <div
                                            className="message-body-v2 markdown-body"
                                            dangerouslySetInnerHTML={{ __html: marked(msg.answer || msg.text || '') }}
                                        />
                                        {msg.role === 'agent' && msg.sources?.length > 0 && (
                                            <div className="sources-section-v2">
                                                <button 
                                                    className="sources-toggle-v2"
                                                    onClick={() => setShowSources(showSources === i ? null : i)}
                                                >
                                                    <Sparkles size={12} />
                                                    {showSources === i ? 'Hide Sources' : 'Show Sources'}
                                                </button>
                                                <AnimatePresence>
                                                    {showSources === i && (
                                                        <Motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="sources-list-v2"
                                                        >
                                                            {msg.sources.map((s, idx) => (
                                                                <div key={idx} className="source-item-v2">
                                                                    <span className="source-label-v2">{s.source}</span>
                                                                    <span className="source-text-v2">{s.text?.substring(0, 100)}...</span>
                                                                </div>
                                                            ))}
                                                        </Motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                        {msg.role === 'user' && (
                                            <div className="msg-time-v2">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === 'agent' && (
                                        <div className="message-actions-v2">
                                            <button
                                                className={`action-btn-v2 ${speakingMsgId === msg.id ? 'active' : ''}`}
                                                onClick={() => handleSpeak(msg)}
                                                title={speakingMsgId === msg.id ? 'Stop' : 'Speak'}
                                            >
                                                {speakingMsgId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                            </button>
                                            <button
                                                className={`action-btn-v2 ${copiedMsgId === msg.id ? 'active' : ''}`}
                                                onClick={() => handleCopy(msg)}
                                                title="Copy"
                                            >
                                                {copiedMsgId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                            <button
                                                className={`action-btn-v2 ${msg.is_helpful === 1 ? 'active' : ''}`}
                                                onClick={() => handleFeedback(msg.id, 1, i)}
                                                title="Helpful"
                                            >
                                                <ThumbsUp size={14} />
                                            </button>
                                            <button
                                                className={`action-btn-v2 ${msg.is_helpful === -1 ? 'active' : ''}`}
                                                onClick={() => setCorrectionIndex(i)}
                                                title="Not Helpful"
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
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="typing-indicator-v2"
                            >
                                <div className="agent-avatar-v2">
                                    <WheatGrainIcon size={22} />
                                </div>
                                <WheatWaveTyping />
                            </Motion.div>
                        )}
                        {connectionError && (
                            <div className="connection-error-v2">
                                <WifiOff size={16} />
                                Connection lost. Please try again.
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <footer className="input-section-v2">
                    <div className="suggestions-v2">
                        {suggestedActions.map((action, idx) => (
                            <button
                                key={idx}
                                className="suggestion-chip-v2"
                                onClick={() => setInput(action.query)}
                            >
                                <span>{action.icon}</span>
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="input-wrapper-v2">
                        {attachments.length > 0 && (
                            <div className="attachments-preview-v2">
                                {attachments.map(att => (
                                    <div key={att.id} className="attachment-chip-v2">
                                        {att.preview ? (
                                            <img src={att.preview} alt="preview" />
                                        ) : (
                                            <FileText size={16} />
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
                                className="hidden-file"
                                multiple
                                onChange={(e) => handleFileSelect(e.target.files)}
                            />
                            <button className="attach-btn-v2" onClick={() => fileInputRef.current.click()}>
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me about farming..."
                                rows={1}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            />
                            <button 
                                className="send-btn-v2" 
                                onClick={handleSend} 
                                disabled={isTyping || (!input.trim() && attachments.length === 0)}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                    <p className="disclaimer-v2">
                        <Info size={10} />
                        AI may make errors. Verify critical advice with local agricultural experts.
                    </p>
                </footer>

                {correctionIndex !== null && (
                    <div className="correction-overlay-v2" onClick={() => setCorrectionIndex(null)}>
                        <div className="correction-modal-v2" onClick={(e) => e.stopPropagation()}>
                            <h3>Help Improve My Response</h3>
                            <p>What information was incorrect or missing?</p>
                            <textarea
                                value={correctionText}
                                onChange={(e) => setCorrectionText(e.target.value)}
                                placeholder="Provide the correct information..."
                                rows={4}
                            />
                            <div className="modal-actions-v2">
                                <button className="btn-secondary-v2" onClick={() => setCorrectionIndex(null)}>Cancel</button>
                                <button className="btn-primary-v2" onClick={submitCorrection}>Submit</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatPage;