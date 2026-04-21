import React from 'react';
import { formatTime } from '../utils/helpers';

export default function Timer({ timeLeft }) {
    const isLow = timeLeft <= 60;
    const percentage = (timeLeft / 600) * 100;

    return (
        <div className="flex items-center gap-3">
            {/* Circular progress */}
            <div className="relative w-10 h-10">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="3"
                    />
                    <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke={isLow ? '#e64980' : '#4c6ef5'}
                        strokeWidth="3"
                        strokeDasharray="94.25"
                        strokeDashoffset={94.25 - (percentage / 100) * 94.25}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                    />
                </svg>
            </div>
            <span className={`text-sm font-mono font-semibold ${isLow ? 'text-accent-500 animate-pulse' : 'text-primary-400'}`}>
                {formatTime(timeLeft)}
            </span>
        </div>
    );
}
