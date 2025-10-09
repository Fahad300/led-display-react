import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendApi } from "../api/backendApi";
import axios from "axios";

interface RegisterProps { }

export const Register: React.FC<RegisterProps> = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await backendApi.post("/api/auth/register", {
                username,
                password
            });

            const { token } = response.data;
            localStorage.setItem("token", token);
            navigate("/");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errorMessage = err.response?.data?.message || "Registration failed";
                setError(errorMessage);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/");
    };

    return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
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
            <div className="w-full max-w-md mx-auto relative z-10">
                <div className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-white mb-2">
                            Add New User
                        </h2>
                        <p className="text-gray-300 text-sm">
                            Create a new user account for authorized personnel
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-4 py-3 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-persivia-blue border border-transparent rounded-lg text-sm font-medium text-white hover:bg-persivia-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-persivia-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </div>
                                ) : (
                                    "Create User"
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300 text-center">
                            <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Only authorized administrators can create new user accounts
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register; 