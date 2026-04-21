import { create } from 'zustand';

const useChatStore = create((set, get) => ({
    sessionId: null,
    messages: [],
    isSearching: false,
    isConnected: false,
    timer: null,
    timeLeft: 600, // 10 minutes in seconds
    connectionRequestSent: false,
    connectionRequestReceived: false,
    connectionEstablished: false,
    moderationWarning: null,

    setSession: (sessionId) => set({
        sessionId,
        isConnected: true,
        isSearching: false,
        messages: [],
        connectionRequestSent: false,
        connectionRequestReceived: false,
        connectionEstablished: false,
        moderationWarning: null,
        timeLeft: 600,
    }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
    })),

    setSearching: (isSearching) => set({ isSearching }),

    setTimeLeft: (timeLeft) => set({ timeLeft }),

    setConnectionRequestSent: () => set({ connectionRequestSent: true }),

    setConnectionRequestReceived: (value = true) => set({
        connectionRequestReceived: value,
    }),

    setConnectionEstablished: () => set({ connectionEstablished: true }),

    setModerationWarning: (warning) => set({ moderationWarning: warning }),

    clearModerationWarning: () => set({ moderationWarning: null }),

    resetChat: () => set({
        sessionId: null,
        messages: [],
        isSearching: false,
        isConnected: false,
        timer: null,
        timeLeft: 600,
        connectionRequestSent: false,
        connectionRequestReceived: false,
        connectionEstablished: false,
        moderationWarning: null,
    }),
}));

export default useChatStore;
