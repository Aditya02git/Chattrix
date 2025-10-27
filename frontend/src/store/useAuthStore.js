import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const BASE_URL =
  import.meta.env.MODE === "development" 
    ? "http://localhost:5001" 
    : "https://chattrix-l0cr.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
      if (error.response?.status !== 401) {
        toast.error("Authentication failed");
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      
      if (res.data.token) {
        localStorage.setItem('auth-token', res.data.token);
      }
      
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      
      if (res.data.token) {
        localStorage.setItem('auth-token', res.data.token);
      }
      
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      
      localStorage.removeItem('auth-token');
      
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser || socket?.connected) return;

    console.log("🔌 Attempting to connect socket to:", BASE_URL);
    console.log("User ID:", authUser._id);

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // CRITICAL: Global listener for unread counts
    newSocket.on("newMessage", (newMessage) => {
      console.log("📩 Global newMessage received:", newMessage);
      
      const currentAuthUser = get().authUser;
      const chatStore = useChatStore.getState();
      
      console.log("Current user:", currentAuthUser._id);
      console.log("Selected user:", chatStore.selectedUser?._id);
      console.log("Message sender:", newMessage.senderId);
      console.log("Message receiver:", newMessage.receiverId);
      
      // Update sidebar last message for everyone
      chatStore.updateUserLastMessage(newMessage);
      
      // Increment unread count ONLY if:
      // 1. I'm the receiver
      // 2. The sender's chat is NOT currently open
      const shouldIncrementUnread = 
        newMessage.receiverId === currentAuthUser._id && 
        chatStore.selectedUser?._id !== newMessage.senderId;
      
      console.log("Should increment unread?", shouldIncrementUnread);
      
      if (shouldIncrementUnread) {
        const currentCount = chatStore.unreadCounts[newMessage.senderId] || 0;
        console.log("Current unread count:", currentCount);
        console.log("New unread count:", currentCount + 1);
        
        useChatStore.setState((state) => {
          const newCounts = {
            ...state.unreadCounts,
            [newMessage.senderId]: currentCount + 1,
          };
          console.log("Updated unreadCounts:", newCounts);
          return { unreadCounts: newCounts };
        });
      }
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      console.log("Socket disconnected");
    }
    set({ socket: null });
  },
}));