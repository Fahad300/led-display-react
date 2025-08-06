import axios from "axios";
import { BACKEND_URL } from "../config";

export const backendApi = axios.create({
    baseURL: BACKEND_URL || 'http://localhost:5000',
    headers: {
        "Content-Type": "application/json",
    },
});

export const externalApi = axios.create({
    baseURL: process.env.REACT_APP_EXTERNAL_API_URL || 'https://sep.solitontechnologies.com/api',
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.REACT_APP_EXTERNAL_API_TOKEN}`
    },
});