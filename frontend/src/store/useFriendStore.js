import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
  friendRequests: [],
  sentRequests: [],
  blockedUsers: [],
  searchResult: null,
  isSearching: false,
  isLoading: false,

  // Search user by email
  searchUserByEmail: async (email) => {
    set({ isSearching: true, searchResult: null });
    try {
      const res = await axiosInstance.post("/friends/search", { email });
      set({ searchResult: res.data });
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || "User not found";
      toast.error(message);
      set({ searchResult: null });
      throw error;
    } finally {
      set({ isSearching: false });
    }
  },

  // Send friend request
  sendFriendRequest: async (receiverId) => {
    try {
      await axiosInstance.post("/friends/request", { receiverId });
      toast.success("Friend request sent!");

      // Update search result to reflect sent request
      set((state) => ({
        searchResult: state.searchResult
          ? {
              ...state.searchResult,
              friendRequest: {
                sender: useAuthStore.getState().authUser._id,
                receiver: receiverId,
                status: "pending",
              },
            }
          : null,
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to send friend request"
      );
      throw error;
    }
  },

  // Get received friend requests
  getFriendRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ friendRequests: res.data });
    } catch (error) {
      toast.error("Failed to load friend requests");
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Get sent friend requests
  getSentFriendRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests/sent");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error("Failed to load sent requests:", error);
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/friends/request/${requestId}/accept`);
      toast.success("Friend request accepted!");

      // Remove from friend requests
      set((state) => ({
        friendRequests: state.friendRequests.filter(
          (req) => req._id !== requestId
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to accept request");
    }
  },

  // Reject friend request
  rejectFriendRequest: async (requestId) => {
    try {
      await axiosInstance.delete(`/friends/request/${requestId}/reject`);
      toast.success("Friend request rejected");

      set((state) => ({
        friendRequests: state.friendRequests.filter(
          (req) => req._id !== requestId
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reject request");
    }
  },

  // Cancel sent friend request
  cancelFriendRequest: async (requestId) => {
    try {
      await axiosInstance.delete(`/friends/request/${requestId}/cancel`);
      toast.success("Friend request cancelled");

      set((state) => ({
        sentRequests: state.sentRequests.filter((req) => req._id !== requestId),
        searchResult: state.searchResult
          ? {
              ...state.searchResult,
              friendRequest: null,
            }
          : null,
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to cancel request");
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);
      toast.success("Friend removed");

      // Update search result if it's the removed friend
      set((state) => ({
        searchResult:
          state.searchResult?.user?._id === friendId
            ? {
                ...state.searchResult,
                isAlreadyFriend: false,
              }
            : state.searchResult,
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove friend");
    }
  },

  // Block user
  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/friends/block/${userId}`);
      toast.success("User blocked");

      await get().getBlockedUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to block user");
    }
  },

  // Unblock user
  unblockUser: async (userId) => {
    try {
      await axiosInstance.delete(`/friends/unblock/${userId}`);
      toast.success("User unblocked");

      set((state) => ({
        blockedUsers: state.blockedUsers.filter((user) => user._id !== userId),
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to unblock user");
    }
  },

  // Get blocked users
  getBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/friends/blocked");
      set({ blockedUsers: res.data });
    } catch (error) {
      console.error("Failed to load blocked users:", error);
    }
  },

  // Clear search result
  clearSearchResult: () => set({ searchResult: null }),

  // Subscribe to friend events
  subscribeToFriendEvents: () => {
    const socket = useAuthStore.getState().socket;

    // Add null check to prevent errors
    if (!socket) {
      console.warn("Socket not available for friend events");
      return;
    }

    socket.on("friendRequest", (request) => {
      set((state) => ({
        friendRequests: [request, ...state.friendRequests],
      }));
      toast.success(`${request.sender.fullName} sent you a friend request!`);
    });

    socket.on("friendRequestAccepted", () => {
      toast.success("Your friend request was accepted!");
    });

    socket.on("friendRemoved", () => {
      toast.info("A friend removed you from their list");
    });

    socket.on("userBlocked", () => {
      toast.info("You have been blocked by a user");
    });
  },

  unsubscribeFromFriendEvents: () => {
    const socket = useAuthStore.getState().socket;

    // Add null check
    if (!socket) {
      return;
    }

    socket.off("friendRequest");
    socket.off("friendRequestAccepted");
    socket.off("friendRemoved");
    socket.off("userBlocked");
  },
}));
