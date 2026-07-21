import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { BACKEND_URL } from '../../config';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

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
            return (
                <div className="sanjeevani-msg sanjeevani-user flex max-w-[85%] self-end rounded-tl-xl rounded-tr-xl rounded-br-none rounded-bl-xl bg-(--jh-sage-pale) px-4 py-3 text-sm leading-normal text-(--jh-olive-deep)">
                    {msg.content}
                </div>
            );
        }

        return (
            <div className="sanjeevani-msg sanjeevani-bot flex max-w-[85%] gap-3 self-start">
                <Avatar>
                    <AvatarFallback className="text-base">🌿</AvatarFallback>
                </Avatar>
                <div className="rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none border border-black/[0.02] bg-card px-4 py-3 text-sm leading-normal text-foreground shadow-(--jh-shadow-rest)">
                    <div className="whitespace-pre-wrap">
                        {msg.content}
                    </div>

                    {msg.metadata && msg.metadata.type === 'options' && (
                        <div className="mt-3 flex flex-col gap-2">
                            {msg.metadata.options.map((opt, i) => (
                                <Button
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    className="h-auto w-fit rounded-full border-(--jh-olive-leaf) px-3 py-1.5 text-xs font-medium text-(--jh-olive-action) hover:bg-(--jh-sage-pale)"
                                    onClick={() => {
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
                                    }}
                                >
                                    {typeof opt === 'string' ? opt : opt.label}
                                </Button>
                            ))}
                        </div>
                    )}

                    {msg.metadata && msg.metadata.type === 'action_fetch_doctors' && (
                        <div className="mt-3 rounded-md bg-(--jh-sage-pale) p-3 text-center">
                            <p className="m-0 mb-2.5 font-medium text-(--jh-olive-deep)">Looking for a {msg.metadata.category} specialist?</p>
                            <Button
                                className="w-full bg-(--jh-olive-leaf) font-semibold hover:bg-(--jh-olive-leaf)/90"
                                onClick={() => {
                                    if (isFullScreen) {
                                        window.open(window.location.origin + '/doctors', '_blank');
                                    } else {
                                        setChatState('closed');
                                        navigate('/doctors');
                                    }
                                }}>
                                Browse Doctors Now
                            </Button>
                        </div>
                    )}

                    {msg.metadata && msg.metadata.type === 'doctors_list' && (
                        <div className="mt-3 flex flex-col gap-2.5">
                            {msg.metadata.reason && (
                                <p className="m-0 flex rounded-md bg-(--jh-sage-pale) px-2.5 py-2 text-xs font-medium text-(--jh-olive-deep)">💡 {msg.metadata.reason}</p>
                            )}
                            {msg.metadata.doctors?.map((doc, i) => (
                                <div key={i} className="rounded-xl border border-(--jh-sage-pale-2) bg-card p-3.5 shadow-(--jh-shadow-rest) transition-shadow hover:shadow-(--jh-shadow-card)">
                                    <div className="mb-1.5 flex items-start justify-between">
                                        <strong className="text-sm font-bold text-(--jh-olive-action)">{doc.name}</strong>
                                        <div className="flex shrink-0 gap-1">
                                            {doc.experience > 0 && (
                                                <span className="rounded-full bg-(--jh-sage-pale) px-1.75 py-0.5 text-[11px] font-semibold text-(--jh-olive-action)">{doc.experience} Yrs</span>
                                            )}
                                            {doc.rating && (
                                                <span className="rounded-full bg-accent px-1.75 py-0.5 text-[11px] font-semibold text-(--jh-turmeric-gold)">⭐ {Number(doc.rating).toFixed(1)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-1 text-xs font-medium text-(--jh-olive-leaf)">🌿 {doc.specialization}</div>
                                    {doc.location && (
                                        <div className="mb-0.5 text-[11px] text-muted-foreground">📍 {typeof doc.location === 'object' ? (doc.location.specific || doc.location.pincode || '') : doc.location}</div>
                                    )}
                                    {doc.languages && (
                                        <div className="mb-0.5 text-[11px] text-muted-foreground">🗣️ {doc.languages}</div>
                                    )}
                                    {doc.about && (
                                        <div className="my-1.5 mb-2 text-[11px] leading-relaxed text-muted-foreground italic">
                                            {doc.about.slice(0, 90)}{doc.about.length > 90 ? '…' : ''}
                                        </div>
                                    )}
                                    <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
                                        <span className="text-[13px] font-bold text-(--jh-olive-action)">₹{doc.price} / consult</span>
                                        <Button
                                            size="sm"
                                            className="rounded-full bg-linear-to-br from-(--jh-olive-action) to-(--jh-olive-light) px-3.5 text-xs font-semibold whitespace-nowrap hover:opacity-90"
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
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {msg.metadata && msg.metadata.type === 'videos' && (
                        <div className="mt-3 flex flex-col gap-2">
                            {msg.metadata.videos.map((vid, i) => (
                                <a key={i} href={vid.link} target="_blank" rel="noreferrer" className="flex flex-col rounded-md border-l-3 border-destructive bg-muted p-2.5 text-[13px] font-medium text-destructive no-underline">
                                    {vid.thumbnail && (
                                        <img src={vid.thumbnail} alt={vid.title} className="mb-1.5 w-full rounded-md" />
                                    )}
                                    <span className="font-semibold">▶ {vid.title}</span>
                                    {vid.channel && <span className="mt-1 text-[11px] font-normal text-muted-foreground">Channel: {vid.channel}</span>}
                                    {vid.description && <span className="mt-1 text-[11px] font-normal text-muted-foreground">{vid.description}</span>}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const windowClass = isFullScreen
        ? "fixed inset-0 z-[999999] flex h-full max-h-dvh w-full max-w-full flex-col overflow-hidden rounded-none shadow-none"
        : `w-95 max-w-[90vw] ${chatState === 'peek' ? 'h-auto min-h-45 max-h-[40vh]' : 'h-150 max-h-[85vh]'} flex flex-col overflow-hidden rounded-(--jh-radius-lg) bg-card shadow-(--jh-shadow-hover) transition-all duration-400 ease-(--jh-ease-organic) [transform-origin:bottom_right]`;

    return (
        <div className={`sanjeevani-container font-sans ${isFullScreen ? 'fixed inset-0 z-[999999] max-h-dvh w-full max-w-full overflow-hidden rounded-none bg-(--jh-cream-tint) p-0' : 'fixed right-6 bottom-6 z-[9999]'}`}>
            {(chatState !== 'closed' || isFullScreen) ? (
                <div ref={chatbotRef} className={windowClass}>
                    <div className={`flex shrink-0 items-center justify-between bg-linear-to-br from-(--jh-olive-action) to-(--jh-olive-deep) px-5 py-4 ${isFullScreen ? 'pt-[calc(16px+env(safe-area-inset-top,0px))]' : ''}`}>
                        <div className="sanjeevani-header-info">
                            <h3 className={`m-0 font-semibold text-primary-foreground ${isFullScreen ? 'text-xl' : 'text-lg'}`}>Sanjeevani AI ✨</h3>
                            <span className="flex items-center gap-1 text-xs text-primary-foreground/80 before:inline-block before:size-1.5 before:rounded-full before:bg-(--jh-olive-leaf) before:content-['']">Online and Ready</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            {isMobile && (
                                <Button
                                    size="sm"
                                    onClick={handleInstallClick}
                                    className="h-auto rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-(--jh-olive-deep) shadow-(--jh-shadow-rest) hover:bg-card/90"
                                >
                                    Install App 📱
                                </Button>
                            )}
                            {!isFullScreen && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-2xl text-primary-foreground/70 leading-none hover:bg-transparent hover:text-primary-foreground"
                                    onClick={(e) => { e.stopPropagation(); setChatState('closed'); }}
                                >
                                    ×
                                </Button>
                            )}
                        </div>
                    </div>

                    <Dialog open={showIosInstallModal} onOpenChange={setShowIosInstallModal}>
                        <DialogContent className="max-w-75 text-center">
                            <DialogHeader>
                                <DialogTitle>Install on iOS</DialogTitle>
                                <DialogDescription>
                                    To install Sanjeevani AI on your iPhone or iPad:
                                </DialogDescription>
                            </DialogHeader>
                            <ol className="list-decimal space-y-2 pl-5 text-left text-[13px] text-foreground">
                                <li>Tap the <strong>Share</strong> icon at the bottom of Safari.</li>
                                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                            </ol>
                            <Button className="w-full" onClick={() => setShowIosInstallModal(false)}>
                                Got it
                            </Button>
                        </DialogContent>
                    </Dialog>

                    <div
                        className={`sanjeevani-messages flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto bg-background ${isFullScreen ? 'p-4 pb-2' : 'p-5'}`}
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
                            <div className="sanjeevani-msg flex max-w-[85%] gap-3 self-start">
                                <Avatar>
                                    <AvatarFallback className="text-base">🌿</AvatarFallback>
                                </Avatar>
                                <div className="flex h-5 items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-card px-4 py-3">
                                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.32s]"></div>
                                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.16s]"></div>
                                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={`flex shrink-0 items-center border-t border-border bg-card px-4 py-3 ${isFullScreen ? 'pb-[calc(12px+env(safe-area-inset-bottom,0px))]' : ''}`}>
                        <div className="flex w-full items-end gap-1.5 rounded-full bg-muted px-1.5 py-1 transition-[background,box-shadow] focus-within:bg-card focus-within:shadow-(--jh-shadow-rest)">
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
                                className={`h-10 flex-1 resize-none overflow-y-auto rounded-none border-none bg-transparent px-3.5 py-2.5 font-sans text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground ${isFullScreen ? 'text-base' : ''}`}
                            />
                            <Button
                                size="icon"
                                className={`shrink-0 rounded-full ${isFullScreen ? 'size-12' : 'size-10'}`}
                                onClick={() => handleSend()}
                                disabled={!inputText.trim() || isLoading}
                                onMouseDown={(e) => e.preventDefault()}
                                onTouchStart={(e) => e.preventDefault()}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            {(chatState === 'closed' && !isFullScreen) && (
                <button
                    className="sanjeevani-fab group relative flex size-16.25 items-center justify-center rounded-full border-none bg-linear-to-br from-(--jh-olive-action) to-(--jh-olive-deep) shadow-[0_8px_24px_rgba(74,92,40,0.4)] transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-108 hover:shadow-[0_12px_28px_rgba(74,92,40,0.5)]"
                    onClick={(e) => { e.stopPropagation(); setChatState('open'); }}
                >
                    <span className="text-3xl">🌿</span>
                    <div className="pointer-events-none absolute right-20 rounded-md bg-(--jh-ink-strong) px-3.5 py-2 text-sm whitespace-nowrap text-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        Chat with Sanjeevani AI
                    </div>
                </button>
            )}
        </div>
    );
};

export default SanjeevaniChatbot;
