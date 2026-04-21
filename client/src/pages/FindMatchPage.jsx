import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../stores/chatStore';
import { getSocket } from '../services/socket';

export default function FindMatchPage() {
    const { isSearching, setSearching, setSession, resetChat } = useChatStore();
    const navigate = useNavigate();

    const handleFindMatch = useCallback(() => {
        resetChat();
        setSearching(true);

        const socket = getSocket();

        // Listen for match events
        socket.on('waiting-for-match', () => {
            // Still searching...
        });

        socket.on('chat-started', (data) => {
            setSession(data.sessionId);
            navigate('/chat');
        });

        socket.on('error-message', (data) => {
            setSearching(false);
            alert(data.message);
        });

        // Emit find-match
        socket.emit('find-match', {});
    }, [navigate, setSearching, setSession, resetChat]);

    const handleCancel = useCallback(() => {
        const socket = getSocket();
        socket.emit('cancel-matching');
        setSearching(false);
    }, [setSearching]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-20">
            <div className="max-w-lg w-full text-center">
                {/* Hero Illustration */}
                <div className="relative mb-8 animate-slide-up">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary-600/20 to-accent-500/20 flex items-center justify-center">
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-5xl ${isSearching ? 'animate-pulse' : 'animate-float'}`}>
                            {isSearching ? '🔍' : '✨'}
                        </div>
                    </div>
                    {isSearching && (
                        <>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-40 h-40 rounded-full border-2 border-primary-500/20 animate-ping"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-48 h-48 rounded-full border border-primary-500/10 animate-pulse"></div>
                            </div>
                        </>
                    )}
                </div>

                {/* Text */}
                <div className="animate-slide-up mb-8">
                    <h1 className="text-3xl font-bold text-white mb-3">
                        {isSearching ? 'Finding Your Match...' : 'Ready to Connect?'}
                    </h1>
                    <p className="text-surface-200 max-w-sm mx-auto">
                        {isSearching
                            ? 'We\'re looking for someone who shares your interests. This won\'t take long!'
                            : 'You\'ll be matched with someone based on your interests for a 10-minute chat. If it clicks, connect!'}
                    </p>
                </div>

                {/* Action Button */}
                {!isSearching ? (
                    <button
                        onClick={handleFindMatch}
                        className="btn-gradient text-lg px-10 py-4 animate-slide-up"
                    >
                        Find New Connection 🚀
                    </button>
                ) : (
                    <div className="space-y-4 animate-slide-up">
                        <div className="flex items-center justify-center gap-3">
                            <div className="spinner"></div>
                            <span className="text-surface-200">Searching...</span>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="btn-secondary text-sm"
                        >
                            Cancel Search
                        </button>
                    </div>
                )}

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-3 mt-12 animate-slide-up">
                    {[
                        { icon: '⏱️', title: '10 min', desc: 'Chat duration' },
                        { icon: '🤖', title: 'AI Safe', desc: 'Moderated chat' },
                        { icon: '🔒', title: 'Private', desc: 'No message logs' },
                    ].map(({ icon, title, desc }) => (
                        <div key={title} className="glass-card text-center py-4">
                            <span className="text-2xl block mb-2">{icon}</span>
                            <h3 className="text-sm font-semibold text-white">{title}</h3>
                            <p className="text-xs text-surface-200/60 mt-0.5">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
