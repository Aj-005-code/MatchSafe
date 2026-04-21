import React from 'react';

export default function ConsentModal({ onAccept, onReject }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
            <div className="glass-card max-w-md mx-4 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-white mb-2">Connection Request!</h3>
                <p className="text-surface-200 mb-6">
                    Your chat partner wants to connect with you. If you both agree, you'll be able to see each other's contact details.
                </p>
                <div className="flex gap-3 justify-center">
                    <button onClick={onReject} className="btn-secondary">
                        Decline
                    </button>
                    <button onClick={onAccept} className="btn-gradient">
                        Accept & Connect ✨
                    </button>
                </div>
            </div>
        </div>
    );
}
