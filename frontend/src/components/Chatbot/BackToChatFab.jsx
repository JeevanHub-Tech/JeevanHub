import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Floating "Back to Chat" button that appears on ALL routes
 * ONLY when the user originally entered via the /#chatbot PWA hash.
 * Also works when a user navigates from the chatbot widget to a platform page
 * (e.g. clicking "Log in" or "View Doctor" from the chatbot).
 */
const BackToChatFab = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Mark session if user came from the chatbot PWA
        if (window.location.hash === '#chatbot' || window.location.hash === '#/chatbot') {
            sessionStorage.setItem('sanjeevani_pwa_session', 'true');
        }

        // Show the FAB only if:
        // 1. User came from the PWA during this browser session, AND
        // 2. They're now on a normal platform route (not the chatbot itself)
        const fromPwa = sessionStorage.getItem('sanjeevani_pwa_session') === 'true';
        const isOnChatbot = window.location.hash === '#chatbot' || window.location.hash === '#/chatbot';
        setShow(fromPwa && !isOnChatbot);
    }, [location.pathname]);

    if (!show) return null;

    const handleBackToChat = () => {
        // Navigate back to the chatbot PWA
        window.location.href = window.location.origin + '/#chatbot';
        window.location.reload();
    };

    return (
        <button
            className="back-to-chat-fab animate-in slide-in-from-bottom-5 fade-in fixed bottom-6 left-1/2 z-[9999999] flex -translate-x-1/2 items-center gap-1.5 rounded-full border-none bg-(--jh-olive-deep) px-6 py-3 font-sans text-sm font-semibold text-primary-foreground shadow-(--jh-shadow-hover) duration-350 ease-out [-webkit-tap-highlight-color:transparent] active:scale-96 [&_svg]:size-4 [&_svg]:fill-current"
            onClick={handleBackToChat}
            aria-label="Back to Chat"
        >
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
            ← Back to Chat
        </button>
    );
};

export default BackToChatFab;
