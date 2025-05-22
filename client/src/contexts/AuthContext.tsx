import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface User {
    id: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const navigate = useNavigate();

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
        navigate("/login");
    }, [navigate]);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const fetchUser = async () => {
                try {
                    const response = await axios.get("http://localhost:5000/api/auth/me");
                    setUser(response.data);
                } catch (error) {
                    console.error("Error fetching user:", error);
                    logout();
                }
            };
            fetchUser();
        }
    }, [token, logout]);

    const login = async (username: string, password: string) => {
        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", {
                username,
                password
            });

            const { token } = response.data;
            localStorage.setItem("token", token);
            setToken(token);
            navigate("/");
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}; 