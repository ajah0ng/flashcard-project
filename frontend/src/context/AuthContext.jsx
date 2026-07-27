import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext(null);

const fetchCurrentUser = async () => {
    const response = await axios.get("/api/auth/me");
    return response.data;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        fetchCurrentUser()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        // Every signed-in user shares the same React Query cache keys
        // (["collections"], ["deck", id], ...). Without clearing it here,
        // switching accounts mid-session would keep showing the previous
        // user's cached collections until something happened to evict them.
        const handleUnauthorized = () => {
            setUser(null);
            queryClient.clear();
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);

        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, [queryClient]);

    // Accepts either { code } (useGoogleLogin auth-code flow) or
    // { credential } (GoogleLogin rendered-button ID token)
    const signInWithGoogle = useCallback(async (payload) => {
        const response = await axios.post("/api/auth/google", payload);

        queryClient.clear();
        setUser(response.data);
    }, [queryClient]);

    const signOut = useCallback(async () => {
        try {
            await axios.post("/api/auth/logout");
        } finally {
            queryClient.clear();
            setUser(null);
        }
    }, [queryClient]);

    return (
        <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
