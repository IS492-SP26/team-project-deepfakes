import axios from "axios";

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL
    ? `${(import.meta as any).env.VITE_API_BASE_URL}/api`
    : "http://localhost:8000/api",
  timeout: 30000,
});

export default api;
