import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import FindMatchPage from './pages/FindMatchPage';
import ChatRoomPage from './pages/ChatRoomPage';
import ConnectionsPage from './pages/ConnectionsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return (
        <BrowserRouter>
            <>
                <div className="bg-mesh" />
                <div className="min-h-screen relative">
                    <Navbar />
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={
                            isAuthenticated ? <Navigate to="/find" /> : <LoginPage />
                        } />
                        <Route path="/auth/callback" element={<AuthCallbackPage />} />

                        {/* Protected routes */}
                        <Route path="/onboarding" element={
                            <ProtectedRoute><OnboardingPage /></ProtectedRoute>
                        } />
                        <Route path="/find" element={
                            <ProtectedRoute><FindMatchPage /></ProtectedRoute>
                        } />
                        <Route path="/chat" element={
                            <ProtectedRoute><ChatRoomPage /></ProtectedRoute>
                        } />
                        <Route path="/connections" element={
                            <ProtectedRoute><ConnectionsPage /></ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute><ProfilePage /></ProtectedRoute>
                        } />

                        {/* Default redirect */}
                        <Route path="*" element={<Navigate to={isAuthenticated ? '/find' : '/login'} />} />
                    </Routes>
                </div>
            </>
        </BrowserRouter>
    );
}
