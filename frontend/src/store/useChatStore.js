import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},
  pendingMessages: new Set(),
  pinnedMessages: [],
  replyMessage: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-counts");
      set({ unreadCounts: res.data });
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      get().markMessagesAsRead(userId);

      // Load pinned messages for this chat
      get().getPinnedMessages(userId);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, pendingMessages } = get();
    const tempId = `temp-${Date.now()}`;

    const hasLargeFile = messageData.video || messageData.document;

    if (!hasLargeFile) {
      const optimisticMessage = {
        _id: tempId,
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedUser._id,
        text: messageData.text || "",
        image: messageData.image || null,
        video: null,
        document: null,
        documentName: null,
        replyTo: messageData.replyTo || null,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      const newPendingMessages = new Set(pendingMessages);
      newPendingMessages.add(tempId);

      set({
        messages: [...messages, optimisticMessage],
        pendingMessages: newPendingMessages,
      });
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      if (!hasLargeFile) {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === tempId ? res.data : msg
          ),
          pendingMessages: (() => {
            const updated = new Set(state.pendingMessages);
            updated.delete(tempId);
            return updated;
          })(),
        }));
      } else {
        set((state) => ({
          messages: [...state.messages, res.data],
        }));
      }

      get().updateUserLastMessage(res.data);
    } catch (error) {
      if (!hasLargeFile) {
        set((state) => ({
          messages: state.messages.filter((msg) => msg._id !== tempId),
          pendingMessages: (() => {
            const updated = new Set(state.pendingMessages);
            updated.delete(tempId);
            return updated;
          })(),
        }));
      }

      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);

      // Remove message from state
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));

      // Also remove from pinned if it was pinned
      set((state) => ({
        pinnedMessages: state.pinnedMessages.filter(
          (msg) => msg._id !== messageId
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
      throw error;
    }
  },

  pinMessage: async (messageId, shouldPin) => {
    try {
      const { selectedUser } = get();

      if (shouldPin) {
        await axiosInstance.post(`/messages/pin/${messageId}`, {
          chatUserId: selectedUser._id,
        });

        // Add to pinned messages
        const message = get().messages.find((msg) => msg._id === messageId);
        if (message) {
          set((state) => ({
            pinnedMessages: [...state.pinnedMessages, message],
          }));
        }
      } else {
        await axiosInstance.delete(`/messages/pin/${messageId}`);

        // Remove from pinned messages
        set((state) => ({
          pinnedMessages: state.pinnedMessages.filter(
            (msg) => msg._id !== messageId
          ),
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin message");
      throw error;
    }
  },

  getPinnedMessages: async (userId) => {
    try {
      const res = await axiosInstance.get(`/messages/pinned/${userId}`);
      set({ pinnedMessages: res.data });
    } catch (error) {
      console.error("Error fetching pinned messages:", error);
    }
  },

  setReplyMessage: (message) => {
    set({ replyMessage: message });
  },

  clearReplyMessage: () => {
    set({ replyMessage: null });
  },

  markMessagesAsRead: async (userId) => {
    try {
      await axiosInstance.put(`/messages/read/${userId}`);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId === userId && !msg.isRead
            ? { ...msg, isRead: true, readAt: new Date() }
            : msg
        ),
      }));

      set((state) => {
        const newUnreadCounts = { ...state.unreadCounts };
        delete newUnreadCounts[userId];
        return { unreadCounts: newUnreadCounts };
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;

      if (isMessageSentFromSelectedUser) {
        // Message from selected user - add to messages and mark as read
        set({
          messages: [...get().messages, newMessage],
        });

        // Mark as read immediately since chat is open
        get().markMessagesAsRead(selectedUser._id);
        get().updateUserLastMessage(newMessage);
      }
      // Note: Unread count updates are handled in useAuthStore's global listener
    });

    socket.on("messagesRead", ({ readBy, senderId }) => {
      const authUser = useAuthStore.getState().authUser;

      if (senderId === authUser._id) {
        // Update messages in current chat
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.receiverId === readBy && !msg.isRead
              ? { ...msg, isRead: true, readAt: new Date() }
              : msg
          ),
        }));

        // Update last message read status in users list
        set((state) => ({
          users: state.users.map((user) =>
            user._id === readBy &&
            user.lastMessage &&
            user.lastMessage.senderId === authUser._id
              ? {
                  ...user,
                  lastMessage: { ...user.lastMessage, isRead: true },
                }
              : user
          ),
        }));
      }
    });

    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
        pinnedMessages: state.pinnedMessages.filter(
          (msg) => msg._id !== messageId
        ),
      }));
    });

    socket.on("messagePinned", ({ message }) => {
      set((state) => ({
        pinnedMessages: [...state.pinnedMessages, message],
      }));
    });

    socket.on("messageUnpinned", ({ messageId }) => {
      set((state) => ({
        pinnedMessages: state.pinnedMessages.filter(
          (msg) => msg._id !== messageId
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("messageDeleted");
    socket.off("messagePinned");
    socket.off("messageUnpinned");
  },

  updateUserLastMessage: (newMessage) => {
    set((state) => {
      const updatedUsers = state.users.map((user) => {
        if (
          user._id === newMessage.senderId ||
          user._id === newMessage.receiverId
        ) {
          return {
            ...user,
            lastMessage: {
              text: newMessage.text,
              image: newMessage.image,
              video: newMessage.video,
              document: newMessage.document,
              documentName: newMessage.documentName,
              audio: newMessage.audio,
              createdAt: newMessage.createdAt,
              senderId: newMessage.senderId,
              isRead: newMessage.isRead || false,
            },
          };
        }
        return user;
      });

      updatedUsers.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt
          ? new Date(a.lastMessage.createdAt)
          : new Date(0);
        const timeB = b.lastMessage?.createdAt
          ? new Date(b.lastMessage.createdAt)
          : new Date(0);
        return timeB - timeA;
      });

      return { users: updatedUsers };
    });
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));