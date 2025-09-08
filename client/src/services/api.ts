import axios from "axios";

// Get the backend URL based on environment
const getBackendUrl = (): string => {
    // Check if we're in production
    if (process.env.NODE_ENV === "production") {
        // For production, use the current host with the backend port
        const currentHost = window.location.hostname;
        const backendPort = process.env.REACT_APP_BACKEND_PORT || "5000";
        return process.env.REACT_APP_BACKEND_URL || `http://${currentHost}:${backendPort}`;
    }
    // For development, use localhost
    return process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
};

export const backendApi = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

