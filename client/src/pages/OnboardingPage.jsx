import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    // Identity form (Step 1)
    const [identity, setIdentity] = useState({
        name: user?.name || '',
        dob: '',
        city: '',
        country: '',
        phone_number: '',
        instagram_id: '',
    });

    // Profile form (Step 2)
    const [profile, setProfile] = useState({
        username: '',
        description: '',
        interests: '',
        hobbies: '',
        preferences: { region: '', ageRange: [18, 45], language: '' },
        favorites: { music: '', sports: '', movies: '', artists: '' },
    });

    // Check if already onboarded
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/users/onboarding-status');
                if (data.onboardingComplete) {
                    navigate('/find');
                    return;
                }
            } catch {
                // Proceed with onboarding
            }
            setCheckingStatus(false);
        })();
    }, [navigate]);

    const handleIdentitySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/users/identity', identity);
            setStep(2);
        } catch (err) {
            console.error('Identity save failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/users/profile', profile);
            navigate('/find');
        } catch (err) {
            console.error('Profile save failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-8 pb-12 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-slide-up">
                    <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
                    <p className="text-surface-200 mt-2">Step {step} of 2</p>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/10 mt-4 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                            style={{ width: step === 1 ? '50%' : '100%' }}
                        ></div>
                    </div>
                </div>

                {/* Step 1: Identity */}
                {step === 1 && (
                    <form onSubmit={handleIdentitySubmit} className="glass-card space-y-4 animate-slide-up">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">1</span>
                            Personal Information
                        </h2>
                        <p className="text-sm text-surface-200/70">This stays private and is only shared with mutual connections.</p>

                        <div className="space-y-3">
                            <input
                                type="text" placeholder="Full Name" required
                                value={identity.name}
                                onChange={e => setIdentity({ ...identity, name: e.target.value })}
                                className="input-field"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-surface-200/60 mb-1 block">Date of Birth</label>
                                    <input
                                        type="date" required
                                        value={identity.dob}
                                        onChange={e => setIdentity({ ...identity, dob: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <input
                                    type="text" placeholder="City"
                                    value={identity.city}
                                    onChange={e => setIdentity({ ...identity, city: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <input
                                type="text" placeholder="Country" required
                                value={identity.country}
                                onChange={e => setIdentity({ ...identity, country: e.target.value })}
                                className="input-field"
                            />
                            <input
                                type="tel" placeholder="Phone number (encrypted)"
                                value={identity.phone_number}
                                onChange={e => setIdentity({ ...identity, phone_number: e.target.value })}
                                className="input-field"
                            />
                            <input
                                type="text" placeholder="Instagram username"
                                value={identity.instagram_id}
                                onChange={e => setIdentity({ ...identity, instagram_id: e.target.value })}
                                className="input-field"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-gradient w-full mt-2">
                            {loading ? 'Saving...' : 'Continue →'}
                        </button>
                    </form>
                )}

                {/* Step 2: Profile */}
                {step === 2 && (
                    <form onSubmit={handleProfileSubmit} className="glass-card space-y-4 animate-slide-up">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-accent-500/20 text-accent-400 flex items-center justify-center text-sm">2</span>
                            Public Profile
                        </h2>
                        <p className="text-sm text-surface-200/70">This is what other users see when matching.</p>

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

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                                ← Back
                            </button>
                            <button type="submit" disabled={loading} className="btn-gradient flex-1">
                                {loading ? 'Setting up...' : 'Complete Setup ✨'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
