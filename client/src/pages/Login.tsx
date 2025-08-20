import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

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
        <div className="h-[100vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
            {/* Technology Network Background */}
            <div className="absolute inset-0">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />

                {/* Neural Network Nodes */}
                <div className="absolute inset-0">
                    {/* Input Layer Nodes */}
                    <div className="absolute top-1/6 left-1/4 w-4 h-4 bg-persivia-teal/90 rounded-full animate-pulse-slow shadow-lg shadow-persivia-teal/50" />
                    <div className="absolute top-1/6 left-1/3 w-4 h-4 bg-persivia-teal/90 rounded-full animate-pulse-medium shadow-lg shadow-persivia-teal/50" />
                    <div className="absolute top-1/6 left-1/2 w-4 h-4 bg-persivia-teal/90 rounded-full animate-pulse-slow shadow-lg shadow-persivia-teal/50" />
                    <div className="absolute top-1/6 left-2/3 w-4 h-4 bg-persivia-teal/90 rounded-full animate-pulse-medium shadow-lg shadow-persivia-teal/50" />
                    <div className="absolute top-1/6 left-3/4 w-4 h-4 bg-persivia-teal/90 rounded-full animate-pulse-slow shadow-lg shadow-persivia-teal/50" />

                    {/* Hidden Layer Nodes */}
                    <div className="absolute top-1/3 left-1/5 w-3.5 h-3.5 bg-persivia-light-blue/90 rounded-full animate-pulse-medium shadow-lg shadow-persivia-light-blue/50" />
                    <div className="absolute top-1/3 left-1/3 w-3.5 h-3.5 bg-persivia-light-blue/90 rounded-full animate-pulse-slow shadow-lg shadow-persivia-light-blue/50" />
                    <div className="absolute top-1/3 left-1/2 w-3.5 h-3.5 bg-persivia-light-blue/90 rounded-full animate-pulse-medium shadow-lg shadow-persivia-light-blue/50" />
                    <div className="absolute top-1/3 left-2/3 w-3.5 h-3.5 bg-persivia-light-blue/90 rounded-full animate-pulse-slow shadow-lg shadow-persivia-light-blue/50" />
                    <div className="absolute top-1/3 left-4/5 w-3.5 h-3.5 bg-persivia-light-blue/90 rounded-full animate-pulse-medium shadow-lg shadow-persivia-light-blue/50" />

                    {/* Output Layer Nodes */}
                    <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-persivia-blue/95 rounded-full animate-pulse-slow shadow-lg shadow-persivia-blue/50" />
                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-persivia-blue/95 rounded-full animate-pulse-medium shadow-lg shadow-persivia-blue/50" />
                    <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-persivia-blue/95 rounded-full animate-pulse-slow shadow-lg shadow-persivia-blue/50" />

                    {/* Additional Neural Clusters */}
                    <div className="absolute top-2/3 left-1/6 w-3 h-3 bg-persivia-teal/80 rounded-full animate-pulse-medium shadow-lg shadow-persivia-teal/40" />
                    <div className="absolute top-2/3 left-1/3 w-3 h-3 bg-persivia-teal/80 rounded-full animate-pulse-slow shadow-lg shadow-persivia-teal/40" />
                    <div className="absolute top-2/3 left-2/3 w-3 h-3 bg-persivia-teal/80 rounded-full animate-pulse-medium shadow-lg shadow-persivia-teal/40" />
                    <div className="absolute top-2/3 left-5/6 w-3 h-3 bg-persivia-teal/80 rounded-full animate-pulse-slow shadow-lg shadow-persivia-teal/40" />
                </div>

                {/* Neural Connections - Synapses */}
                <div className="absolute inset-0">
                    {/* Input to Hidden Layer Connections */}
                    <div className="absolute top-1/6 left-1/4 w-1 h-20 bg-gradient-to-b from-persivia-teal/80 to-persivia-light-blue/70 transform -rotate-3 origin-top animate-pulse-medium" />
                    <div className="absolute top-1/6 left-1/3 w-1 h-20 bg-gradient-to-b from-persivia-teal/80 to-persivia-light-blue/70 transform rotate-2 origin-top animate-pulse-slow" />
                    <div className="absolute top-1/6 left-1/2 w-1 h-20 bg-gradient-to-b from-persivia-teal/80 to-persivia-light-blue/70 transform -rotate-1 origin-top animate-pulse-medium" />
                    <div className="absolute top-1/6 left-2/3 w-1 h-20 bg-gradient-to-b from-persivia-teal/80 to-persivia-light-blue/70 transform -rotate-6 origin-top animate-pulse-medium" />
                    <div className="absolute top-1/6 left-3/4 w-1 h-20 bg-gradient-to-b from-persivia-teal/80 to-persivia-light-blue/70 transform rotate-12 origin-top animate-pulse-slow" />

                    {/* Hidden to Output Layer Connections */}
                    <div className="absolute top-1/3 left-1/5 w-1 h-20 bg-gradient-to-b from-persivia-light-blue/80 to-persivia-blue/70 transform rotate-8 origin-top animate-pulse-medium" />
                    <div className="absolute top-1/3 left-1/3 w-1 h-20 bg-gradient-to-b from-persivia-light-blue/80 to-persivia-blue/70 transform -rotate-4 origin-top animate-pulse-slow" />
                    <div className="absolute top-1/3 left-1/2 w-1 h-20 bg-gradient-to-b from-persivia-light-blue/80 to-persivia-blue/70 transform rotate-6 origin-top animate-pulse-medium" />
                    <div className="absolute top-1/3 left-2/3 w-1 h-20 bg-gradient-to-b from-persivia-light-blue/80 to-persivia-blue/70 transform -rotate-8 origin-top animate-pulse-slow" />
                    <div className="absolute top-1/3 left-4/5 w-1 h-20 bg-gradient-to-b from-persivia-light-blue/80 to-persivia-blue/70 transform rotate-8 origin-top animate-pulse-medium" />
                </div>

                {/* Data Flow Visualization */}
                <div className="absolute inset-0">
                    {/* Data Packets */}
                    <div className="absolute top-1/6 left-1/4 w-2 h-2 bg-persivia-teal/95 rounded-full animate-bounce shadow-lg shadow-persivia-teal/70" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-1/6 left-1/3 w-2 h-2 bg-persivia-teal/95 rounded-full animate-bounce shadow-lg shadow-persivia-teal/70" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/6 left-1/2 w-2 h-2 bg-persivia-teal/95 rounded-full animate-bounce shadow-lg shadow-persivia-teal/70" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-1/6 left-2/3 w-2 h-2 bg-persivia-teal/95 rounded-full animate-bounce shadow-lg shadow-persivia-teal/70" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-1/6 left-3/4 w-2 h-2 bg-persivia-teal/95 rounded-full animate-bounce shadow-lg shadow-persivia-teal/70" style={{ animationDelay: '2s' }} />

                    {/* Processing Nodes with Pulses */}
                    <div className="absolute top-1/3 left-1/5 w-5 h-5 border-2 border-persivia-light-blue/60 rounded-full animate-ping shadow-lg shadow-persivia-light-blue/40" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute top-1/3 left-1/3 w-5 h-5 border-2 border-persivia-light-blue/60 rounded-full animate-ping shadow-lg shadow-persivia-light-blue/40" style={{ animationDelay: '1.3s' }} />
                    <div className="absolute top-1/3 left-1/2 w-5 h-5 border-2 border-persivia-light-blue/60 rounded-full animate-ping shadow-lg shadow-persivia-light-blue/40" style={{ animationDelay: '0.8s' }} />
                    <div className="absolute top-1/3 left-2/3 w-5 h-5 border-2 border-persivia-light-blue/60 rounded-full animate-ping shadow-lg shadow-persivia-light-blue/40" style={{ animationDelay: '1.8s' }} />
                    <div className="absolute top-1/3 left-4/5 w-5 h-5 border-2 border-persivia-light-blue/60 rounded-full animate-ping shadow-lg shadow-persivia-light-blue/40" style={{ animationDelay: '2.3s' }} />
                </div>

                {/* Circuit-like Elements */}
                <div className="absolute top-1/3 left-1/6 w-10 h-10 border-2 border-persivia-teal/40 rounded-lg animate-pulse-slow shadow-lg shadow-persivia-teal/20">
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-persivia-teal/80 rounded-full" />
                    <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-persivia-teal/80 rounded-full" />
                    <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-persivia-light-blue/80 rounded-full" />
                    <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-persivia-light-blue/80 rounded-full" />
                </div>

                {/* Data Flow Lines */}
                <div className="absolute top-1/4 left-1/4 w-20 h-1 bg-gradient-to-r from-persivia-teal/90 to-transparent animate-pulse-slow shadow-lg shadow-persivia-teal/50" />
                <div className="absolute bottom-1/4 right-1/4 w-16 h-1 bg-gradient-to-l from-persivia-light-blue/85 to-transparent animate-pulse-medium shadow-lg shadow-persivia-light-blue/50" />
                <div className="absolute top-1/2 left-1/3 w-24 h-1 bg-gradient-to-r from-transparent to-persivia-blue/80 animate-pulse-slow shadow-lg shadow-persivia-blue/50" />

                {/* Additional Data Flow Lines for Density */}
                <div className="absolute top-1/3 right-1/4 w-18 h-1 bg-gradient-to-l from-persivia-teal/80 to-transparent animate-pulse-medium shadow-lg shadow-persivia-teal/40" />
                <div className="absolute bottom-1/3 left-1/5 w-22 h-1 bg-gradient-to-r from-transparent to-persivia-light-blue/75 animate-pulse-slow shadow-lg shadow-persivia-light-blue/40" />
                <div className="absolute top-2/3 left-1/6 w-16 h-1 bg-gradient-to-r from-persivia-blue/85 to-transparent animate-pulse-medium shadow-lg shadow-persivia-blue/40" />
                <div className="absolute bottom-2/3 right-1/5 w-20 h-1 bg-gradient-to-r from-transparent to-persivia-teal/80 animate-pulse-slow shadow-lg shadow-persivia-teal/40" />

                {/* Additional Tech Nodes */}
                <div className="absolute top-1/6 right-1/3 w-4 h-4 border-2 border-persivia-blue/50 rounded-full animate-pulse-medium shadow-lg shadow-persivia-blue/30">
                    <div className="absolute inset-1 bg-persivia-blue/60 rounded-full animate-ping" />
                </div>

                {/* Floating Data Elements */}
                <div className="absolute top-1/4 right-1/6 w-6 h-6 border border-persivia-teal/40 rounded-md animate-pulse-slow shadow-lg shadow-persivia-teal/20">
                    <div className="absolute inset-1 bg-persivia-teal/30 rounded-sm" />
                </div>

                {/* Energy Pulses */}
                <div className="absolute top-3/4 left-1/4 w-8 h-8 border-2 border-persivia-light-blue/50 rounded-full animate-ping shadow-lg shadow-persivia-light-blue/30" style={{ animationDelay: '0.7s' }} />
                <div className="absolute top-3/4 right-1/3 w-6 h-6 border-2 border-persivia-teal/50 rounded-full animate-ping shadow-lg shadow-persivia-teal/30" style={{ animationDelay: '1.2s' }} />
            </div>

            {/* Content Container */}
            <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl relative z-10 border border-white/20">
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
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-persivia-blue hover:bg-persivia-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-persivia-teal disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    </form>
                </div>
            </div>
        </div>
    );
}; 