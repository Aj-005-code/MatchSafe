import React from 'react';
import useAuthStore from '../stores/authStore';

export default function ChatBubble({ message }) {
    const currentUserId = useAuthStore((s) => s.user?.userId);
    const isSelf = message.userId === currentUserId;

    return (
        <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`px-4 py-2.5 ${isSelf ? 'chat-bubble-self' : 'chat-bubble-other'}`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.moderation?.action === 'WARN' && (
                        <span className="text-[10px] text-yellow-400">⚠️ flagged</span>
                    )}
                </div>
            </div>
        </div>
    );
}
