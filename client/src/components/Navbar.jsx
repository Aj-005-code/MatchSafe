import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { disconnectSocket } from '../services/socket';
import { getInitials } from '../utils/helpers';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        disconnectSocket();
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) return null;

    const navLinks = [
        { path: '/find', label: 'Find Match', icon: '🔍' },
        { path: '/connections', label: 'Connections', icon: '🤝' },
        { path: '/profile', label: 'Profile', icon: '⚙️' },
    ];

    return (
        <nav className="glass fixed top-0 left-0 right-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/find" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                            M
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                            MatchSafe
                        </span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {navLinks.map(({ path, label, icon }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === path
                                    ? 'bg-primary-600/20 text-primary-400'
                                    : 'text-surface-200 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className="mr-1.5">{icon}</span>
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/profile"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold">
                                {getInitials(user?.name)}
                            </div>
                            <span className="text-sm font-medium hidden sm:block">
                                {user?.name?.split(' ')[0]}
                            </span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-surface-200 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
