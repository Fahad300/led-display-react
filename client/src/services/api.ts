import axios from "axios";

// Get the backend URL based on environment
const getBackendUrl = (): string => {
    // Always use REACT_APP_BACKEND_URL if it's set
    if (process.env.REACT_APP_BACKEND_URL) {
        return process.env.REACT_APP_BACKEND_URL;
    }

    // For production, use the current host (works for VM deployment)
    if (process.env.NODE_ENV === "production") {
        const currentHost = window.location.hostname;
        const backendPort = process.env.REACT_APP_BACKEND_PORT || "5000";
        return `http://${currentHost}:${backendPort}`;
    }

    // For development, use localhost
    return "http://localhost:5000";
};

// Log the backend URL for debugging
console.log("Backend URL:", getBackendUrl());
console.log("Environment variables:", {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    REACT_APP_BACKEND_PORT: process.env.REACT_APP_BACKEND_PORT
});

export const backendApi = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

