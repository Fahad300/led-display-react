import axios from "axios";

// Get the backend URL based on environment
const getBackendUrl = (): string => {
    // Use REACT_APP_BACKEND_URL from environment variables
    return process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
};

// Log backend URL only in development
if (process.env.NODE_ENV === 'development') {
    console.log("Backend URL:", getBackendUrl());
}

export const backendApi = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

