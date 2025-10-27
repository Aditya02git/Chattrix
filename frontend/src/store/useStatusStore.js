import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useStatusStore = create((set) => ({
  statuses: [],
  isStatusLoading: false,
  selectedUserStatuses: [],
  currentStatusIndex: 0,

  getAllStatuses: async () => {
    set({ isStatusLoading: true });
    try {
      const res = await axiosInstance.get("/status");
      set({ statuses: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch statuses");
    } finally {
      set({ isStatusLoading: false });
    }
  },

  createStatus: async (statusData) => {
    try {
      const res = await axiosInstance.post("/status", statusData);
      toast.success("Status uploaded successfully!");

      // Update local state immediately
      const newStatus = res.data;
      const currentUserId = useAuthStore.getState().authUser._id;

      set((state) => {
        const existingGroupIndex = state.statuses.findIndex(
          (group) => group.user._id === currentUserId
        );

        if (existingGroupIndex !== -1) {
          // Add to existing group
          const updatedStatuses = [...state.statuses];
          updatedStatuses[existingGroupIndex].statuses.unshift(newStatus);
          return { statuses: updatedStatuses };
        } else {
          // Create new group
          return {
            statuses: [
              {
                user: useAuthStore.getState().authUser,
                statuses: [newStatus],
              },
              ...state.statuses,
            ],
          };
        }
      });

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create status");
      throw error;
    }
  },

  getUserStatuses: async (userId) => {
    try {
      const res = await axiosInstance.get(`/status/${userId}`);
      set({ selectedUserStatuses: res.data, currentStatusIndex: 0 });
      return res.data;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch user statuses"
      );
    }
  },

  viewStatus: async (statusId) => {
    try {
      await axiosInstance.put(`/status/view/${statusId}`);

      // Update local state immediately - optimistic update
      set((state) => {
        const updatedStatuses = state.statuses.map((group) => ({
          ...group,
          statuses: group.statuses.map((status) => {
            if (status._id === statusId) {
              const currentUser = useAuthStore.getState().authUser;
              const alreadyViewed = status.views.some(
                (v) =>
                  v.userId === currentUser._id ||
                  v.userId?._id === currentUser._id
              );

              if (!alreadyViewed) {
                return {
                  ...status,
                  views: [
                    ...status.views,
                    {
                      userId: currentUser._id,
                      viewedAt: new Date().toISOString(),
                    },
                  ],
                };
              }
            }
            return status;
          }),
        }));

        return { statuses: updatedStatuses };
      });
    } catch (error) {
      console.error("Error viewing status:", error);
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await axiosInstance.delete(`/status/${statusId}`);
      toast.success("Status deleted successfully!");

      // Update local state immediately
      set((state) => ({
        statuses: state.statuses
          .map((group) => ({
            ...group,
            statuses: group.statuses.filter((s) => s._id !== statusId),
          }))
          .filter((group) => group.statuses.length > 0),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete status");
    }
  },

  setCurrentStatusIndex: (index) => set({ currentStatusIndex: index }),

  subscribeToStatuses: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) return;

    socket.on("newStatus", (newStatus) => {
      const currentUserId = useAuthStore.getState().authUser._id;

      // Don't add if it's our own status (already added in createStatus)
      if (newStatus.userId._id === currentUserId) return;

      // Update state with new status
      set((state) => {
        const existingGroupIndex = state.statuses.findIndex(
          (group) => group.user._id === newStatus.userId._id
        );

        if (existingGroupIndex !== -1) {
          const updatedStatuses = [...state.statuses];
          updatedStatuses[existingGroupIndex].statuses.unshift(newStatus);
          return { statuses: updatedStatuses };
        } else {
          return {
            statuses: [
              {
                user: newStatus.userId,
                statuses: [newStatus],
              },
              ...state.statuses,
            ],
          };
        }
      });

      toast.success(`${newStatus.userId.fullName} posted a new status!`);
    });

    socket.on("statusDeleted", (statusId) => {
      // Update local state immediately
      set((state) => ({
        statuses: state.statuses
          .map((group) => ({
            ...group,
            statuses: group.statuses.filter((s) => s._id !== statusId),
          }))
          .filter((group) => group.statuses.length > 0),
      }));
    });

    // CRITICAL: Listen for status views to update navbar count in real-time
    socket.on("statusViewed", ({ statusId, viewerId, view }) => {
      set((state) => {
        const updatedStatuses = state.statuses.map((group) => ({
          ...group,
          statuses: group.statuses.map((status) => {
            if (status._id === statusId) {
              // Check if view already exists
              const alreadyViewed = status.views.some(
                (v) => v.userId === viewerId || v.userId?._id === viewerId
              );

              if (!alreadyViewed) {
                return {
                  ...status,
                  views: [
                    ...status.views,
                    view || {
                      userId: viewerId,
                      viewedAt: new Date().toISOString(),
                    },
                  ],
                };
              }
            }
            return status;
          }),
        }));

        return { statuses: updatedStatuses };
      });
    });
  },

  unsubscribeFromStatuses: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newStatus");
      socket.off("statusDeleted");
      socket.off("statusViewed");
    }
  },
}));
