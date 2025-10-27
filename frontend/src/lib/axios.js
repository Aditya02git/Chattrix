import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://chattrix-l0cr.onrender.com",//"http://localhost:5001/api"
    withCredentials: true,
});