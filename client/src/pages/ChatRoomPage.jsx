import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import { getSocket } from '../services/socket';
import ChatBubble from '../components/ChatBubble';
import Timer from '../components/Timer';
import ModerationAlert from '../components/ModerationAlert';
import ConsentModal from '../components/ConsentModal';

export default function ChatRoomPage() {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const userId = useAuthStore((s) => s.user?.userId);

    const {
        sessionId, messages, timeLeft, isConnected,
        connectionRequestSent, connectionRequestReceived, connectionEstablished,
        moderationWarning,
        addMessage, setTimeLeft, setConnectionRequestSent,
        setConnectionRequestReceived, setConnectionEstablished,
        setModerationWarning, clearModerationWarning, resetChat,
    } = useChatStore();

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Timer countdown
    useEffect(() => {
        if (!isConnected || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isConnected, timeLeft, setTimeLeft]);

    // Socket event listeners
    useEffect(() => {
        if (!sessionId) {
            navigate('/find');
            return;
        }

        const socket = getSocket();

        socket.on('receive-message', (data) => {
            addMessage(data);
        });

        socket.on('moderation-warning', (data) => {
            setModerationWarning(data.message);
        });

        socket.on('connection-request-received', () => {
            setConnectionRequestReceived(true);
        });

        socket.on('connection-established', () => {
            setConnectionEstablished(true);
        });

        socket.on('connection-request-sent', () => {
            // Already tracked locally
        });

        socket.on('waiting-for-consent', () => {
            // Show waiting state (already handled by connectionRequestSent)
        });

        socket.on('chat-ended', (data) => {
            alert(data.reason || 'Chat ended');
            resetChat();
            navigate('/find');
        });

        socket.on('chat-terminated', (data) => {
            alert('⚠️ ' + (data.reason || 'Chat terminated due to safety violation'));
            resetChat();
            navigate('/find');
        });

        return () => {
            socket.off('receive-message');
            socket.off('moderation-warning');
            socket.off('connection-request-received');
            socket.off('connection-established');
            socket.off('connection-request-sent');
            socket.off('waiting-for-consent');
            socket.off('chat-ended');
            socket.off('chat-terminated');
        };
    }, [sessionId, navigate, addMessage, setModerationWarning, setConnectionRequestReceived, setConnectionEstablished, resetChat]);

    const handleSend = useCallback((e) => {
        e.preventDefault();
        if (!inputText.trim() || !sessionId) return;

        const socket = getSocket();
        socket.emit('send-message', { text: inputText.trim(), sessionId });
        setInputText('');
    }, [inputText, sessionId]);

    const handleSendConnectionRequest = useCallback(() => {
        const socket = getSocket();
        socket.emit('send-connection-request', { sessionId });
        setConnectionRequestSent();
    }, [sessionId, setConnectionRequestSent]);

    const handleRespondConnection = useCallback((accepted) => {
        const socket = getSocket();
        socket.emit('respond-connection-request', { sessionId, accepted });
        setConnectionRequestReceived(false);
    }, [sessionId, setConnectionRequestReceived]);

    const handleLeaveChat = useCallback(() => {
        const socket = getSocket();
        socket.emit('leave-chat', { sessionId });
        resetChat();
        navigate('/find');
    }, [sessionId, resetChat, navigate]);

    return (
        <div className="min-h-screen flex flex-col pt-16">
            {/* Moderation Warning Modal */}
            <ModerationAlert
                warning={moderationWarning}
                onContinue={clearModerationWarning}
                onLeave={handleLeaveChat}
            />

            {/* Connection Request Modal */}
            {connectionRequestReceived && (
                <ConsentModal
                    onAccept={() => handleRespondConnection(true)}
                    onReject={() => handleRespondConnection(false)}
                />
            )}

            {/* Connection Established Banner */}
            {connectionEstablished && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
                    <div className="glass-card bg-green-500/10 border-green-500/30 text-center px-8 py-4">
                        <div className="text-3xl mb-2">🎉</div>
                        <h3 className="text-lg font-bold text-green-400">Connection Established!</h3>
                        <p className="text-sm text-surface-200 mt-1">Check your Connections tab to see contact details.</p>
                        <button onClick={() => navigate('/connections')} className="btn-gradient mt-3 text-sm py-2">
                            View Connections →
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Header */}
            <div className="glass border-b border-white/5 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-sm font-medium text-white">Ephemeral Chat</span>
                        <span className="text-xs text-surface-200/50">• Messages are not stored</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Timer timeLeft={timeLeft} />
                        <button onClick={handleLeaveChat} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                            Leave
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-3">
                    {/* System message */}
                    <div className="text-center text-sm text-surface-200/50 mb-6">
                        <p>🔒 This is an ephemeral chat. No messages are stored.</p>
                        <p>You have 10 minutes to chat. Be respectful.</p>
                    </div>

                    {messages.map((msg, i) => (
                        <ChatBubble key={i} message={msg} />
                    ))}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="glass border-t border-white/5 px-4 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3">
                        {/* Connection Request Button */}
                        {!connectionRequestSent && !connectionEstablished && (
                            <button
                                onClick={handleSendConnectionRequest}
                                className="btn-gradient text-sm py-2.5 px-4 whitespace-nowrap"
                                title="Send connection request"
                            >
                                🤝 Connect
                            </button>
                        )}
                        {connectionRequestSent && !connectionEstablished && (
                            <span className="text-xs text-primary-400 whitespace-nowrap px-3">
                                Request sent ✓
                            </span>
                        )}

                        {/* Message Input */}
                        <form onSubmit={handleSend} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                className="input-field flex-1"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="btn-gradient px-5 py-3"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
