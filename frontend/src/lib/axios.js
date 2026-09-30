import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://chattrix-dun.vercel.app/",
    withCredentials: true,
});

// Add interceptor to include token in all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
