import React from 'react';

export default function ModerationAlert({ warning, onContinue, onLeave }) {
    if (!warning) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
            <div className="glass-card max-w-md mx-4 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Content Warning</h3>
                <p className="text-surface-200 mb-6">{warning}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={onContinue} className="btn-secondary">
                        Continue Chat
                    </button>
                    <button onClick={onLeave} className="btn-gradient bg-red-500">
                        Leave Chat
                    </button>
                </div>
            </div>
        </div>
    );
}
