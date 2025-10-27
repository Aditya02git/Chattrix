import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://chattrix-l0cr.onrender.com/api",//"http://localhost:5001/api""https://chattrix-l0cr.onrender.com"
    withCredentials: true,
});