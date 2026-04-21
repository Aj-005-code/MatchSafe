import React, { useState } from 'react';
import api from '../services/api';
import { getInitials, truncate } from '../utils/helpers';

export default function ConnectionCard({ connection }) {
    const [showContact, setShowContact] = useState(false);
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleRevealContact = async () => {
        if (contact) {
            setShowContact(!showContact);
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(`/connections/${connection.other_user_id}/contact`);
            setContact(data);
            setShowContact(true);
        } catch (err) {
            console.error('Failed to reveal contact:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-lg font-bold shrink-0 group-hover:scale-105 transition-transform">
                    {connection.profile_picture ? (
                        <img
                            src={connection.profile_picture}
                            alt={connection.username}
                            className="w-full h-full rounded-2xl object-cover"
                        />
                    ) : (
                        getInitials(connection.username)
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">
                        {connection.username || 'Anonymous'}
                    </h3>
                    <p className="text-sm text-surface-200 mt-0.5">
                        {truncate(connection.interests, 60)}
                    </p>
                    <p className="text-xs text-surface-200/60 mt-1">
                        Connected {new Date(connection.connected_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Contact Reveal */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <button
                    onClick={handleRevealContact}
                    disabled={loading}
                    className="btn-gradient w-full text-sm py-2.5"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="spinner w-4 h-4 border-2" />
                            Loading...
                        </span>
                    ) : showContact ? 'Hide Contact' : 'Reveal Contact'}
                </button>

                {showContact && contact && (
                    <div className="mt-3 space-y-2 animate-slide-up">
                        {contact.phone_number && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-primary-400">📱</span>
                                <a href={`tel:${contact.phone_number}`} className="text-primary-300 hover:text-primary-200 transition-colors">
                                    {contact.phone_number}
                                </a>
                            </div>
                        )}
                        {contact.instagram_id && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-accent-400">📸</span>
                                <a
                                    href={`https://instagram.com/${contact.instagram_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-400 hover:text-accent-300 transition-colors"
                                >
                                    @{contact.instagram_id} — Open DM →
                                </a>
                            </div>
                        )}
                        {!contact.phone_number && !contact.instagram_id && (
                            <p className="text-sm text-surface-200/60">No contact info available</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
