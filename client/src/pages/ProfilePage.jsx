import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        username: '',
        description: '',
        interests: '',
        hobbies: '',
        preferences: { region: '', ageRange: [18, 45], language: '' },
        favorites: { music: '', sports: '', movies: '', artists: '' },
    });

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/users/profile');
                if (data) {
                    setProfile({
                        username: data.username || '',
                        description: data.description || '',
                        interests: data.interests || '',
                        hobbies: data.hobbies || '',
                        preferences: data.preferences || { region: '', ageRange: [18, 45], language: '' },
                        favorites: data.favorites || { music: '', sports: '', movies: '', artists: '' },
                    });
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/users/profile', profile);
            navigate('/find');
        } catch (err) {
            console.error('Profile update failed:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-lg mx-auto">
                <div className="text-center mb-8 animate-slide-up">
                    <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
                    <p className="text-surface-200 mt-2">Update your public matchmaking preferences</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="glass-card space-y-4 animate-slide-up">
                    <div className="space-y-3">
                        <input
                            type="text" placeholder="Username" required
                            value={profile.username}
                            onChange={e => setProfile({ ...profile, username: e.target.value })}
                            className="input-field"
                        />
                        <textarea
                            placeholder="Tell us about yourself..."
                            rows={3}
                            value={profile.description}
                            onChange={e => setProfile({ ...profile, description: e.target.value })}
                            className="input-field resize-none"
                        />
                        <input
                            type="text" placeholder="Interests (e.g. AI, photography, travel)"
                            value={profile.interests}
                            onChange={e => setProfile({ ...profile, interests: e.target.value })}
                            className="input-field"
                        />
                        <input
                            type="text" placeholder="Hobbies (e.g. guitar, hiking, cooking)"
                            value={profile.hobbies}
                            onChange={e => setProfile({ ...profile, hobbies: e.target.value })}
                            className="input-field"
                        />

                        {/* Preferences */}
                        <div className="pt-2">
                            <h3 className="text-sm font-medium text-surface-200 mb-2">Preferences</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text" placeholder="Preferred region"
                                    value={profile.preferences.region}
                                    onChange={e => setProfile({
                                        ...profile,
                                        preferences: { ...profile.preferences, region: e.target.value }
                                    })}
                                    className="input-field"
                                />
                                <input
                                    type="text" placeholder="Language(s)"
                                    value={profile.preferences.language}
                                    onChange={e => setProfile({
                                        ...profile,
                                        preferences: { ...profile.preferences, language: e.target.value }
                                    })}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* Favorites */}
                        <div className="pt-2">
                            <h3 className="text-sm font-medium text-surface-200 mb-2">Favorites</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {['music', 'sports', 'movies', 'artists'].map(key => (
                                    <input
                                        key={key}
                                        type="text"
                                        placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                                        value={profile.favorites[key]}
                                        onChange={e => setProfile({
                                            ...profile,
                                            favorites: { ...profile.favorites, [key]: e.target.value }
                                        })}
                                        className="input-field"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => navigate('/find')} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="btn-gradient px-8">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
