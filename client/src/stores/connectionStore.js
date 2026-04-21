import { create } from 'zustand';

const useConnectionStore = create((set) => ({
    connections: [],
    loading: false,
    error: null,

    setConnections: (connections) => set({ connections, loading: false }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),

    removeConnection: (connectionId) => set((state) => ({
        connections: state.connections.filter(c => c.connection_id !== connectionId),
    })),
}));

export default useConnectionStore;
