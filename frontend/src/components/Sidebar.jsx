import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { AudioLines, FileText, Image, Video } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadCounts,
    getUnreadCounts,
    markMessagesAsRead,
    setupGlobalMessageListener, // Add this
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
    getUnreadCounts();
    setupGlobalMessageListener(); // Add this line
  }, [getUsers, getUnreadCounts, setupGlobalMessageListener]);

  // Handle user selection and mark messages as read
  const handleSelectUser = async (user) => {
    setSelectedUser(user);

    // Mark messages as read if there are unread messages
    if (unreadCounts[user._id]) {
      await markMessagesAsRead(user._id);
    }
  };

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Helper function to format time
  const formatMessageTime = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Helper function to get message preview with media indicators
  const getMessagePreview = (message) => {
    if (!message) return { type: "text", content: "No messages yet" };

    if (message.document) {
      return {
        type: "media",
        content: (
          <span className="inline-flex items-center gap-1">
            <FileText size={14} />
            <span>{message.documentName || "Document"}</span>
          </span>
        ),
      };
    }
    if (message.video) {
      return {
        type: "media",
        content: (
          <span className="inline-flex items-center gap-1">
            <Video size={14} />
            <span>Video</span>
          </span>
        ),
      };
    }

    if (message.audio) {
      return {
        type: "media",
        content: (
          <span className="inline-flex items-center gap-1">
            <AudioLines size={14} />
            <span>Audio</span>
          </span>
        ),
      };
    }
    if (message.image) {
      return {
        type: "media",
        content: (
          <span className="inline-flex items-center gap-1">
            <Image size={14} />
            <span>Photo</span>
          </span>
        ),
      };
    }
    if (message.text) return { type: "text", content: message.text };

    return { type: "text", content: "No messages yet" };
  };

  // Helper function to truncate message
  const truncateMessage = (text, maxLength = 30) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-[400px] border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <span className="font-medium hidden lg:block">My Contacts</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const unreadCount = unreadCounts[user._id] || 0;
          const hasUnread = unreadCount > 0;

          return (
            <button
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${
                  selectedUser?._id === user._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
            >
              <div className="relative mx-auto lg:mx-0 flex-shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div
                    className={`font-medium truncate ${
                      hasUnread ? "font-bold" : ""
                    }`}
                  >
                    {user.fullName}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.lastMessage && (
                      <span className="text-xs text-zinc-500">
                        {formatMessageTime(user.lastMessage.createdAt)}
                      </span>
                    )}
                    {hasUnread && (
                      <span className="bg-primary text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-2">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`text-sm truncate ${
                    hasUnread ? " font-semibold" : "text-zinc-400"
                  }`}
                >
                  {user.lastMessage ? (
                    <span>
                      {user.lastMessage.senderId === authUser?._id && "You: "}
                      {(() => {
                        const preview = getMessagePreview(user.lastMessage);
                        return preview.type === "media"
                          ? preview.content
                          : truncateMessage(preview.content);
                      })()}
                    </span>
                  ) : (
                    <span className="italic">No messages yet</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;