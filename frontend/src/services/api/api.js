// services/api/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
    baseURL: API_BASE,
    // timeout: 10000,
});

api.interceptors.request.use(cfg => {
    const token = localStorage.getItem("token");
    if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
    return cfg;
});

export default api;