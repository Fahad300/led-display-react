import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { Link } from "react-router-dom";

export const Login: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(username, password);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errorMessage = err.response?.data?.details || err.response?.data?.message || "Invalid username or password";
                setError(errorMessage);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[100vh] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />

            {/* Content Container */}
            <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl relative z-10">
                    {/* Logo */}
                    <div className="flex justify-center">
                        <img
                            src="/images/logo-persivia.svg"
                            alt="Persivia Logo"
                            className="h-12 sm:h-16 w-auto mb-6"
                            style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.25))" }}
                        />
                    </div>

                    <div>
                        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-300">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-4 py-2.5 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center bg-red-900/20 p-2.5 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </div>
                                ) : (
                                    "Sign in"
                                )}
                            </button>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-400">
                                Don't have an account?{" "}
                                <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}; 