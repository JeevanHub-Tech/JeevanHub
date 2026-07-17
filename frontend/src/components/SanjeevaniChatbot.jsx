import React, { useState, useEffect, useRef, useContext } from 'react';
import './SanjeevaniChatbot.css';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BACKEND_URL } from '../config';

const SanjeevaniChatbot = ({ isFullScreen = false }) => {
    const location = useLocation();
    const [chatState, setChatState] = useState(() => {
        if (isFullScreen) return 'open';
        if (location.pathname === '/') return 'peek';
        return 'closed';
    });
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const messagesEndRef = useRef(null);
    const initializedId = useRef(null);
    const chatbotRef = useRef(null);
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showIosInstallModal, setShowIosInstallModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (chatState === 'open' || isFullScreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [chatState, isFullScreen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatbotRef.current && !chatbotRef.current.contains(event.target)) {
                if (!isFullScreen && chatState !== 'closed') {
                    setChatState('closed');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFullScreen, chatState]);

    useEffect(() => {
        // Device Detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const mobileCheck = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        setIsMobile(mobileCheck);
        
        const iosCheck = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(iosCheck);

        // Listen for beforeinstallprompt (Android/Chrome)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Android / Chrome
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
        } else if (isIOS) {
            // iOS Safari
            setShowIosInstallModal(true);
        }
    };

    // Dynamically associate chat session to the permanent logged in ID
    useEffect(() => {
        let id;
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        // Cleanup any old hardcoded guest caches
        localStorage.removeItem('sanjeevani_chat_id');

        // If officially logged into the platform, sync the Chatbot memory to their DB Profile
        const currentUserId = auth?.user?.id || auth?.user?._id;
        if (token && currentUserId) {
            id = currentUserId;
        } else {
            // Use session storage so guests don't lose history just by minimizing the chat widget
            let guestId = sessionStorage.getItem('sanjeevani_guest_id');
            if (!guestId) {
                guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('sanjeevani_guest_id', guestId);
            }
            id = guestId;
        }

        setUserId(id);

        // Initial check with backend to get dynamic greeting and fetch HISTORY
        const initChat = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.post(`${BACKEND_URL}/api/chat/message`, {
                    userId: id,
                    message: 'INIT_CHAT_EVENT',
                    isRegistered: !!token,
                    userRole: role,
                    fetchHistory: true
                }, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });

                const { response: aiText, metadata, history } = response.data;
                const pastMessages = (history || []).map(h => ({
                    role: h.role,
                    content: h.content,
                    metadata: h.metadata
                }));

                if (aiText) {
                    setMessages([...pastMessages, { role: 'assistant', content: aiText, metadata }]);
                }
            } catch (e) {
                setMessages([{ role: 'assistant', content: "Namaste 🙏 I am Sanjeevani AI. How can I assist you today?" }]);
            }
        };

        // Only call initChat if we haven't already initialized this specific user ID
        // This prevents the chat from refreshing and fetching history/greetings every time the widget is opened/closed
        if (id && (chatState !== 'closed' || isFullScreen) && initializedId.current !== id) {
            initializedId.current = id;
            initChat();
        }
    }, [auth, chatState, isFullScreen]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentNode;
            const messageNodes = container.querySelectorAll('.sanjeevani-msg');
            if (messageNodes.length > 0) {
                const lastMessage = messageNodes[messageNodes.length - 1];
                const containerHeight = container.clientHeight;
                
                // offsetTop is relative to the offsetParent. 
                // To be safe, calculate the relative position within the scrollable container.
                const lastMsgTop = lastMessage.offsetTop - container.offsetTop;
                const lastMsgHeight = lastMessage.offsetHeight;
                
                if (lastMsgHeight > containerHeight) {
                    // Message is taller than container, align to top of message
                    container.scrollTop = lastMsgTop - 10; // 10px buffer for padding
                } else {
                    // Message fits, scroll to bottom
                    container.scrollTop = container.scrollHeight;
                }
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, chatState, isFullScreen]);

    const handleSend = async (textOverride) => {
        const textToSend = textOverride || inputText;
        if (!textToSend.trim() || !userId) return;

        // Add user message
        const userMsg = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '40px';
        }
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${BACKEND_URL}/api/chat/message`, {
                userId,
                message: textToSend,
                isRegistered: !!token
            }, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            const { response: aiText, metadata } = response.data;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: aiText,
                metadata
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm experiencing a disturbance in my network. Please try again in a moment. 🪷"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Render rich custom UI based on metadata
    const renderMessageContent = (msg, idx) => {
        if (msg.role === 'user') {
            return <div className="sanjeevani-msg sanjeevani-user">{msg.content}</div>;
        }

        return (
            <div className="sanjeevani-msg sanjeevani-bot">
                <div className="sanjeevani-avatar">🌿</div>
                <div className="sanjeevani-content">
                    <div className="sanjeevani-text" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                    </div>

                    {msg.metadata && msg.metadata.type === 'options' && (
                        <div className="sanjeevani-options">
                            {msg.metadata.options.map((opt, i) => (
                                <button key={i} onClick={() => {
                                    const label = typeof opt === 'string' ? opt : opt.label;
                                    if (opt.action) {
                                        if (isFullScreen) {
                                            // PWA mode: open platform pages in new tab since hash-app can't SPA-route
                                            const base = window.location.origin;
                                            window.open(base + opt.action, '_blank');
                                        } else {
                                            setChatState('closed');
                                            navigate(opt.action);
                                        }
                                    } else {
                                        handleSend(label);
                                    }
                                }} className="sanjeevani-opt-btn">
                                    {typeof opt === 'string' ? opt : opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {msg.metadata && msg.metadata.type === 'action_fetch_doctors' && (
                        <div className="sanjeevani-action-card">
                            <p>Looking for a {msg.metadata.category} specialist?</p>
                            <button
                                className="sanjeevani-primary-btn"
                                onClick={() => {
                                    if (isFullScreen) {
                                        window.open(window.location.origin + '/doctors', '_blank');
                                    } else {
                                        setChatState('closed');
                                        navigate('/doctors');
                                    }
                                }}>
                                Browse Doctors Now
                            </button>
                        </div>
                    )}

                    {msg.metadata && msg.metadata.type === 'doctors_list' && (
                        <div className="sanjeevani-doctors-list">
                            {msg.metadata.reason && (
                                <p className="sanjeevani-doc-reason">💡 {msg.metadata.reason}</p>
                            )}
                            {msg.metadata.doctors?.map((doc, i) => (
                                <div key={i} className="sanjeevani-doc-card">
                                    <div className="sanjeevani-doc-header">
                                        <strong>{doc.name}</strong>
                                        <div className="sanjeevani-doc-badges">
                                            {doc.experience > 0 && (
                                                <span className="sanjeevani-doc-exp">{doc.experience} Yrs</span>
                                            )}
                                            {doc.rating && (
                                                <span className="sanjeevani-doc-rating">⭐ {Number(doc.rating).toFixed(1)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="sanjeevani-doc-spec">🌿 {doc.specialization}</div>
                                    {doc.location && (
                                        <div className="sanjeevani-doc-location">📍 {typeof doc.location === 'object' ? (doc.location.specific || doc.location.pincode || '') : doc.location}</div>
                                    )}
                                    {doc.languages && (
                                        <div className="sanjeevani-doc-langs">🗣️ {doc.languages}</div>
                                    )}
                                    {doc.about && (
                                        <div className="sanjeevani-doc-about">
                                            {doc.about.slice(0, 90)}{doc.about.length > 90 ? '…' : ''}
                                        </div>
                                    )}
                                    <div className="sanjeevani-doc-footer">
                                        <span className="sanjeevani-doc-price">₹{doc.price} / consult</span>
                                        <button
                                            className="sanjeevani-book-btn"
                                            onClick={() => {
                                                // Map chatbot doctor data to match DoctorDetailPage's expected format
                                                const doctorForPage = {
                                                    _id: doc.id,
                                                    name: doc.name?.replace(/^Dr\.\s*/i, '') || doc.name,
                                                    email: doc.email || '',
                                                    specialization: doc.specialization,
                                                    experience: doc.experience,
                                                    pricepoint: doc.price,
                                                    price: doc.price,
                                                    location: doc.location || '',
                                                    languages: doc.languages || '',
                                                    about: doc.about || '',
                                                    rating: doc.rating || 0,
                                                    profileImage: doc.profileImage || null
                                                };
                                                if (isFullScreen) {
                                                    // PWA: can't pass state, open doctors list instead
                                                    window.open(window.location.origin + '/doctors', '_blank');
                                                } else {
                                                    setChatState('closed');
                                                    navigate('/doctor-detail', { state: { doctor: doctorForPage } });
                                                }
                                            }}>
                                            View & Book →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {msg.metadata && msg.metadata.type === 'videos' && (
                        <div className="sanjeevani-videos">
                            {msg.metadata.videos.map((vid, i) => (
                                <a key={i} href={vid.link} target="_blank" rel="noreferrer" className="sanjeevani-video-link">
                                    {vid.thumbnail && (
                                        <img src={vid.thumbnail} alt={vid.title} style={{ width: '100%', borderRadius: '6px', marginBottom: '6px' }} />
                                    )}
                                    <span style={{ fontWeight: 600 }}>▶ {vid.title}</span>
                                    {vid.channel && <span className="sanjeevani-vid-desc">Channel: {vid.channel}</span>}
                                    {vid.description && <span className="sanjeevani-vid-desc">{vid.description}</span>}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`sanjeevani-container ${isFullScreen ? 'sanjeevani-full-screen-app' : ''}`}>
            {(chatState !== 'closed' || isFullScreen) ? (
                <div ref={chatbotRef} className={`sanjeevani-window ${isFullScreen ? 'sanjeevani-window-full' : ''} ${chatState === 'peek' ? 'peek' : ''}`}>
                    <div className="sanjeevani-header">
                        <div className="sanjeevani-header-info">
                            <h3>Sanjeevani AI ✨</h3>
                            <span className="sanjeevani-status">Online and Ready</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isMobile && (
                                <button 
                                    onClick={handleInstallClick}
                                    style={{
                                        background: '#fff',
                                        color: '#1b5e20',
                                        border: 'none',
                                        padding: '4px 10px',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Install App 📱
                                </button>
                            )}
                            {!isFullScreen && (
                                <button className="sanjeevani-close-btn" onClick={(e) => { e.stopPropagation(); setChatState('closed'); }}>×</button>
                            )}
                        </div>
                    </div>

                    {showIosInstallModal && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                            backdropFilter: 'blur(2px)'
                        }}>
                            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '80%', maxWidth: '300px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#1b5e20', fontSize: '18px' }}>Install on iOS</h4>
                                <p style={{ fontSize: '14px', margin: '0 0 15px 0', color: '#555' }}>
                                    To install Sanjeevani AI on your iPhone or iPad:
                                </p>
                                <ol style={{ textAlign: 'left', fontSize: '13px', margin: '0 0 20px 0', paddingLeft: '20px', color: '#333' }}>
                                    <li style={{ marginBottom: '8px' }}>Tap the <strong>Share</strong> icon at the bottom of Safari.</li>
                                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                                </ol>
                                <button 
                                    onClick={() => setShowIosInstallModal(false)}
                                    style={{ padding: '10px 20px', background: '#1b5e20', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', width: '100%' }}
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    )}

                    <div 
                        className="sanjeevani-messages"
                        onClick={() => {
                            if (chatState === 'peek') setChatState('open');
                        }}
                    >
                        {messages.map((msg, i) => (
                            <React.Fragment key={i}>
                                {renderMessageContent(msg, i)}
                            </React.Fragment>
                        ))}
                        {isLoading && (
                            <div className="sanjeevani-msg sanjeevani-bot">
                                <div className="sanjeevani-avatar">🌿</div>
                                <div className="sanjeevani-loading">
                                    <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="sanjeevani-input-area">
                        <div className="sanjeevani-input-wrapper">
                            <textarea
                                ref={textareaRef}
                                placeholder="Ask Sanjeevani AI..."
                                value={inputText}
                                onFocus={() => {
                                    if (chatState === 'peek') setChatState('open');
                                }}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    e.target.style.height = '40px';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                rows={1}
                            />
                            <button 
                                onClick={() => handleSend()} 
                                disabled={!inputText.trim() || isLoading}
                                onMouseDown={(e) => e.preventDefault()}
                                onTouchStart={(e) => e.preventDefault()}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {(chatState === 'closed' && !isFullScreen) && (
                <button className="sanjeevani-fab" onClick={(e) => { e.stopPropagation(); setChatState('open'); }}>
                    <span className="sanjeevani-fab-icon">🌿</span>
                    <div className="sanjeevani-fab-tooltip">Chat with Sanjeevani AI</div>
                </button>
            )}
        </div>
    );
};

export default SanjeevaniChatbot;
