import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

/**
 * Handles the OAuth callback redirect.
 * Extracts token and user info from URL params, stores them, and redirects.
 */
export default function AuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const email = searchParams.get('email');

        if (token && userId) {
            login({
                token,
                refreshToken,
                user: { userId, name, email },
            });
            navigate('/onboarding');
        } else {
            navigate('/login?error=auth_failed');
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-surface-200">Signing you in...</p>
            </div>
        </div>
    );
}
