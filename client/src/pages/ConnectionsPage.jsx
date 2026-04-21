import React, { useEffect, useState } from 'react';
import api from '../services/api';
import useConnectionStore from '../stores/connectionStore';
import ConnectionCard from '../components/ConnectionCard';

export default function ConnectionsPage() {
    const { connections, loading, setConnections, setLoading, setError } = useConnectionStore();

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/connections');
                setConnections(data.connections);
            } catch (err) {
                setError('Failed to load connections');
                console.error(err);
            }
        })();
    }, [setConnections, setLoading, setError]);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-slide-up">
                    <h1 className="text-3xl font-bold text-white">Your Connections</h1>
                    <p className="text-surface-200 mt-2">
                        People you've mutually connected with. Click to reveal contact details.
                    </p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="spinner"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && connections.length === 0 && (
                    <div className="glass-card text-center py-16 animate-slide-up">
                        <div className="text-6xl mb-4">🌟</div>
                        <h2 className="text-xl font-semibold text-white mb-2">No Connections Yet</h2>
                        <p className="text-surface-200 max-w-sm mx-auto">
                            Start chatting and when both you and your match agree, you'll see them here!
                        </p>
                        <a href="/find" className="btn-gradient inline-block mt-6">
                            Find a Match →
                        </a>
                    </div>
                )}

                {/* Connections Grid */}
                {!loading && connections.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                        {connections.map((conn) => (
                            <ConnectionCard key={conn.connection_id} connection={conn} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
