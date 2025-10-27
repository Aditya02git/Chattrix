import {
  X,
  Image,
  Video,
  FileText,
  Link2,
  ChevronRight,
  Forward,
  Search,
  Pin,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const {
    selectedUser,
    setSelectedUser,
    messages,
    getUsers,
    users,
    sendMessage,
    pinnedMessages,
    pinMessage,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("images");
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(true);

  // Get the single pinned message (only one can be pinned at a time)
  const pinnedMessage =
    pinnedMessages && pinnedMessages.length > 0 ? pinnedMessages[0] : null;

  // Check for selected messages in DOM
  useEffect(() => {
    const checkSelectedMessages = () => {
      const selected = document.querySelectorAll(".bg-base-300.p-2.rounded-md");
      const messageIds = Array.from(selected).map((el) =>
        el.id.replace("message-", "")
      );
      setSelectedMessages(messageIds);
    };

    // Check periodically for selected messages
    const interval = setInterval(checkSelectedMessages, 500);
    return () => clearInterval(interval);
  }, []);

  // Filter messages by media type
  const getMediaMessages = () => {
    const images = messages.filter((msg) => msg.image);
    const videos = messages.filter((msg) => msg.video);
    const documents = messages.filter((msg) => msg.document);
    const links = messages.filter((msg) => {
      if (!msg.text) return false;
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return urlRegex.test(msg.text);
    });

    return { images, videos, documents, links };
  };

  const { images, videos, documents, links } = getMediaMessages();

  const extractLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Handle forward action
  const handleForward = () => {
    if (selectedMessages.length === 0) {
      toast.error("No messages selected");
      return;
    }
    setShowForwardModal(true);
  };

  // Handle forwarding to a user
  const handleForwardToUser = async (targetUser) => {
    setIsForwarding(true);

    try {
      // Get the actual message objects
      const messagesToForward = messages.filter((msg) =>
        selectedMessages.includes(msg._id)
      );

      if (messagesToForward.length === 0) {
        toast.error("Messages not found");
        setIsForwarding(false);
        return;
      }

      // Forward each selected message
      for (const message of messagesToForward) {
        const forwardData = {
          text: message.text || "",
          image: message.image || "",
          video: message.video || "",
          audio: message.audio || "",
          document: message.document || "",
          documentName: message.documentName || "",
        };

        // Temporarily switch to target user to send message
        const originalUser = selectedUser;
        setSelectedUser(targetUser);

        await sendMessage(forwardData);

        // Switch back to original user
        setSelectedUser(originalUser);
      }

      toast.success(
        `Forwarded ${messagesToForward.length} message(s) to ${targetUser.fullName}`
      );

      // Clear selections
      const selected = document.querySelectorAll(".ring-2.ring-primary");
      selected.forEach((el) => {
        el.classList.remove("ring-2", "ring-primary");
      });
      setSelectedMessages([]);
      setShowForwardModal(false);
    } catch (error) {
      console.error("Forward error:", error);
      toast.error("Failed to forward messages");
    } finally {
      setIsForwarding(false);
    }
  };

  // Cancel selection
  const handleCancelSelection = () => {
    const selected = document.querySelectorAll(".ring-2.ring-primary");
    selected.forEach((el) => {
      el.classList.remove("ring-2", "ring-primary");
    });
    setSelectedMessages([]);
  };

  // Filter users for forward modal (exclude current user and selected user)
  const availableUsers = users.filter(
    (user) =>
      user._id !== authUser._id &&
      user._id !== selectedUser._id &&
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load users when forward modal opens
  useEffect(() => {
    if (showForwardModal && users.length === 0) {
      getUsers();
    }
  }, [showForwardModal, users.length, getUsers]);

  // Scroll to pinned message
  const scrollToPinnedMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Add highlight effect
      messageElement.classList.add("rounded-md", "bg-base-300/50");

      // Remove highlight after 2 seconds
      setTimeout(() => {
        messageElement.classList.remove("rounded-md", "bg-base-300/50");
      }, 2000);
    } else {
      toast.error("Message not found");
    }
  };

  // Get preview text for pinned message
  const getPinnedMessagePreview = (message) => {
    if (message.text) return message.text;
    if (message.image) return "📷 Image";
    if (message.video) return "🎥 Video";
    if (message.audio) return "🎧 Audio";
    if (message.document) return `📄 ${message.documentName || "Document"}`;
    return "Media";
  };

  // Handle unpinning message
  const handleUnpinMessage = async (e) => {
    e.stopPropagation();
    if (!pinnedMessage) return;

    try {
      await pinMessage(pinnedMessage._id, false);
      toast.success("Message unpinned");
    } catch (error) {
      toast.error("Failed to unpin message", error);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-base-100">
        <div className="p-2.5 border-b border-base-300">
          <div className="flex items-center justify-between">
            {selectedMessages.length > 0 ? (
              // Selection mode header
              <>
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={handleCancelSelection}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <X />
                  </button>
                  <span className="font-medium">
                    {selectedMessages.length} selected
                  </span>
                </div>

                <button
                  onClick={handleForward}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Forward className="size-4" />
                  Forward
                </button>
              </>
            ) : (
              // Normal header
              <>
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-base-200 p-2 rounded-lg transition-colors"
                  onClick={() => setShowProfile(true)}
                >
                  {/* Avatar */}
                  <div className="avatar">
                    <div className="size-10 rounded-full relative">
                      <img
                        src={selectedUser.profilePic || "/avatar.png"}
                        alt={selectedUser.fullName}
                      />
                    </div>
                  </div>

                  {/* User info */}
                  <div className="flex-1">
                    <h3 className="font-medium">{selectedUser.fullName}</h3>
                    <p className="text-sm text-base-content/70">
                      {onlineUsers.includes(selectedUser._id)
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>

                  <ChevronRight className="size-5 text-base-content/50" />
                </div>

                {/* Close button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pinned Messages Section */}
        {pinnedMessage && showPinnedMessages && (
          <div className="bg-base-200/50 border-b border-base-300">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <Pin className="size-4 text-primary fill-primary" />
                <span className="text-sm font-medium">Pinned Message</span>
              </div>
              <button
                onClick={() => setShowPinnedMessages(false)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X className="size-3" />
              </button>
            </div>

            <div className="px-3 pb-3">
              <div
                onClick={() => scrollToPinnedMessage(pinnedMessage._id)}
                className="flex items-start gap-3 p-3 bg-base-100 rounded-lg cursor-pointer hover:bg-base-300 transition-colors group"
              >
                <Pin className="size-4 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  {pinnedMessage.image && (
                    <img
                      src={pinnedMessage.image}
                      alt="Pinned"
                      className="w-16 h-16 object-cover rounded mb-2"
                    />
                  )}
                  {pinnedMessage.video && (
                    <video
                      src={pinnedMessage.video}
                      className="w-16 h-16 object-cover rounded mb-2"
                    />
                  )}
                  <p className="text-sm line-clamp-2">
                    {getPinnedMessagePreview(pinnedMessage)}
                  </p>
                  <p className="text-xs text-base-content/50 mt-1">
                    {pinnedMessage.senderId === authUser._id
                      ? "You"
                      : selectedUser.fullName}
                  </p>
                </div>
                <button
                  onClick={handleUnpinMessage}
                  className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Unpin message"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show pinned message button when hidden */}
        {pinnedMessage && !showPinnedMessages && (
          <div className="bg-base-200/30 border-b border-base-300">
            <button
              onClick={() => setShowPinnedMessages(true)}
              className="w-full px-3 py-2 flex items-center justify-center gap-2 hover:bg-base-200 transition-colors text-sm"
            >
              <Pin className="size-4 text-primary fill-primary" />
              <span>Show pinned message</span>
            </button>
          </div>
        )}
      </div>

      {/* Forward Modal */}
      {showForwardModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowForwardModal(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-base-100 rounded-lg shadow-xl z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Forward to</h2>
              <button
                onClick={() => setShowForwardModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-base-300">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isForwarding ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="loading loading-spinner loading-lg text-primary"></div>
                  <p className="mt-4 text-base-content/70">
                    Forwarding messages...
                  </p>
                </div>
              ) : availableUsers.length > 0 ? (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleForwardToUser(user)}
                      className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="avatar">
                        <div className="size-10 rounded-full">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.fullName}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{user.fullName}</h3>
                        <p className="text-sm text-base-content/70">
                          {onlineUsers.includes(user._id)
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                      <div>
                        {onlineUsers.includes(user._id) && (
                          <span className="badge badge-success badge-sm">
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/50">
                  {searchQuery ? "No users found" : "No users available"}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Profile Sidebar */}
      {showProfile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowProfile(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 z-50 shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Profile Info</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X />
              </button>
            </div>

            {/* Profile Section */}
            <div className="p-6 border-b border-base-300 flex flex-col items-center">
              <div className="avatar">
                <div className="size-24 rounded-full">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt={selectedUser.fullName}
                  />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                {selectedUser.fullName}
              </h3>
              <p className="text-sm text-base-content/70 mt-1">
                {selectedUser.email}
              </p>
              <div className="mt-2">
                <span
                  className={`badge ${
                    onlineUsers.includes(selectedUser._id)
                      ? "badge-success"
                      : "badge-ghost"
                  }`}
                >
                  {onlineUsers.includes(selectedUser._id)
                    ? "Online"
                    : "Offline"}
                </span>
              </div>
            </div>

            {/* Media Tabs */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-base-content/70 mb-3">
                SHARED MEDIA
              </h3>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("images")}
                  className={`btn btn-sm ${
                    activeTab === "images" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  <Image className="size-4" />
                  Images ({images.length})
                </button>
                <button
                  onClick={() => setActiveTab("videos")}
                  className={`btn btn-sm ${
                    activeTab === "videos" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  <Video className="size-4" />
                  Videos ({videos.length})
                </button>
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`btn btn-sm ${
                    activeTab === "documents" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  <FileText className="size-4" />
                  Docs ({documents.length})
                </button>
                <button
                  onClick={() => setActiveTab("links")}
                  className={`btn btn-sm ${
                    activeTab === "links" ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  <Link2 className="size-4" />
                  Links ({links.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-2">
                {/* Images Tab */}
                {activeTab === "images" && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.length > 0 ? (
                      images.map((msg, idx) => (
                        <div key={idx} className="aspect-square">
                          <img
                            src={msg.image}
                            alt="Shared"
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(msg.image, "_blank")}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8 text-base-content/50">
                        No images shared yet
                      </div>
                    )}
                  </div>
                )}

                {/* Videos Tab */}
                {activeTab === "videos" && (
                  <div className="space-y-2">
                    {videos.length > 0 ? (
                      videos.map((msg, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden">
                          <video
                            src={msg.video}
                            controls
                            className="w-full rounded-lg"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-base-content/50">
                        No videos shared yet
                      </div>
                    )}
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <div className="space-y-2">
                    {documents.length > 0 ? (
                      documents.map((msg, idx) => (
                        <a
                          key={idx}
                          href={msg.document}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                        >
                          <FileText className="size-8 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {msg.documentName || "Document"}
                            </p>
                            <p className="text-xs text-base-content/70">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-8 text-base-content/50">
                        No documents shared yet
                      </div>
                    )}
                  </div>
                )}

                {/* Links Tab */}
                {activeTab === "links" && (
                  <div className="space-y-2">
                    {links.length > 0 ? (
                      links.map((msg, idx) => {
                        const messageLinks = extractLinks(msg.text);
                        return messageLinks.map((link, linkIdx) => (
                          <a
                            key={`${idx}-${linkIdx}`}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                          >
                            <Link2 className="size-5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate text-primary">
                                {link}
                              </p>
                              <p className="text-xs text-base-content/70">
                                {new Date(msg.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </a>
                        ));
                      })
                    ) : (
                      <div className="text-center py-8 text-base-content/50">
                        No links shared yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ChatHeader;
