import axios from "axios";

export const backendApi = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    },
});

