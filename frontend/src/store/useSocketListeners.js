import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

export const useSocketListeners = () => {
  const { socket, authUser } = useAuthStore();
  const { updateUserLastMessage } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Update the last message in sidebar
      updateUserLastMessage(newMessage);
    };

    const handleMessagesRead = ({ readBy, senderId }) => {
      // Update users list when messages are read
      if (senderId === authUser._id) {
        useChatStore.setState((state) => ({
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
    };

    // Listen for new messages globally
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);

    // Cleanup
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, updateUserLastMessage, authUser]);
};
