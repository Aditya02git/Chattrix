import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  Download,
  FileText,
  File,
  Check,
  X,
  Eye,
  Reply,
  Copy,
  Pin,
  Share2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";

const ChatMessage = ({ message, isPending }) => {
  const { authUser } = useAuthStore();
  const {
    selectedUser,
    deleteMessage,
    pinMessage,
    pinnedMessages,
    setReplyMessage,
  } = useChatStore();
  const isOwnMessage = message.senderId === authUser._id;
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedText, setSelectedText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const contextMenuRef = useRef(null);

  const isPinned = pinnedMessages?.some((pm) => pm._id === message._id);

  // Adjust context menu position if it goes off screen
  useEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const menu = contextMenuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      let adjustedX = contextMenu.x;
      let adjustedY = contextMenu.y;

      // Check if menu goes off the right edge
      if (menuRect.right > windowWidth) {
        adjustedX = windowWidth - menuRect.width - 10;
      }

      // Check if menu goes off the bottom edge
      if (menuRect.bottom > windowHeight) {
        adjustedY = windowHeight - menuRect.height - 10;
      }

      // Check if menu goes off the top edge
      if (adjustedY < 10) {
        adjustedY = 10;
      }

      // Check if menu goes off the left edge
      if (adjustedX < 10) {
        adjustedX = 10;
      }

      // Update position if adjusted
      if (adjustedX !== contextMenu.x || adjustedY !== contextMenu.y) {
        setContextMenu({ x: adjustedX, y: adjustedY });
      }
    }
  }, [contextMenu]);

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="size-8 text-gray-400" />;

    const ext = fileName.split(".").pop().toLowerCase();
    if (ext === "pdf") return <FileText className="size-8 text-red-500" />;
    if (["doc", "docx"].includes(ext))
      return <FileText className="size-8 text-blue-500" />;
    if (["xls", "xlsx"].includes(ext))
      return <FileText className="size-8 text-green-500" />;
    if (["txt"].includes(ext)) return <File className="size-8 text-gray-500" />;
    return <FileText className="size-8 text-gray-400" />;
  };

  const handleDownloadImage = async () => {
    if (!message.image || isDownloading) return;

    setIsDownloading(true);

    try {
      const response = await fetch(message.image);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${message.createdAt || Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    const selection = window.getSelection().toString();
    setSelectedText(selection);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedText("");
  };

  // Context menu actions
  const handleReply = () => {
    const replyData = {
      _id: message._id,
      text:
        message.text ||
        (message.image
          ? "📷 Image"
          : message.video
          ? "🎥 Video"
          : message.audio
          ? "🎧 Audio"
          : message.document
          ? "📄 Document"
          : "Media"),
      senderName: isOwnMessage ? "You" : selectedUser.fullName,
      image: message.image,
      video: message.video,
      audio: message.audio,
      document: message.document,
    };

    setReplyMessage(replyData);
    toast.success("Replying to message");
    closeContextMenu();
  };

  const handleSelect = () => {
    const messageElement = document.getElementById(`message-${message._id}`);
    if (messageElement) {
      messageElement.classList.toggle("bg-base-300");
      messageElement.classList.toggle("p-2");
      messageElement.classList.toggle("rounded-md");
    }
    toast.success("Message selected");
    closeContextMenu();
  };

  const handleDeleteForEveryone = async () => {
    if (!isOwnMessage) {
      toast.error("You can only delete your own messages for everyone");
      closeContextMenu();
      return;
    }

    try {
      await deleteMessage(message._id);
      toast.success("Message deleted for everyone");
    } catch (error) {
      toast.error("Failed to delete message", error);
    }
    closeContextMenu();
  };

  const handleShare = () => {
    let shareContent = "";

    if (message.text) {
      shareContent = message.text;
    } else if (message.image) {
      shareContent = message.image;
    } else if (message.video) {
      shareContent = message.video;
    } else if (message.audio) {
      shareContent = message.audio;
    } else if (message.document) {
      shareContent = message.document;
    }

    setShareLink(shareContent);
    setShowShareModal(true);
    closeContextMenu();
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard");
    setShowShareModal(false);
  };

  const handlePin = async () => {
    try {
      if (!isPinned && pinnedMessages && pinnedMessages.length > 0) {
        for (const pinnedMsg of pinnedMessages) {
          await pinMessage(pinnedMsg._id, false);
        }
      }

      await pinMessage(message._id, !isPinned);
      toast.success(isPinned ? "Message unpinned" : "Message pinned");
    } catch (error) {
      toast.error("Failed to pin message", error);
    }
    closeContextMenu();
  };

  const handleCopy = () => {
    const textToCopy = selectedText || message.text || "";
    navigator.clipboard.writeText(textToCopy);
    toast.success("Copied to clipboard");
    closeContextMenu();
  };

  // Function to detect and linkify URLs
  const linkifyText = (text) => {
    if (!text) return text;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Click outside to close context menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-200 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Content</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="bg-base-300 p-3 rounded-lg mb-4">
              <p className="text-sm break-all">{shareLink}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyShareLink}
                className="btn btn-primary flex-1 gap-2"
              >
                <Copy className="size-4" />
                Copy Link
              </button>
              <button
                onClick={() => window.open(shareLink, "_blank")}
                className="btn btn-ghost gap-2"
                disabled={!shareLink.startsWith("http")}
              >
                <ExternalLink className="size-4" />
                Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-base-200 rounded-lg shadow-xl border border-base-300 py-2 min-w-[180px] z-50"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <button
            onClick={handleReply}
            className="w-full px-4 py-2 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
          >
            <Reply className="size-4" />
            <span>Reply</span>
          </button>

          <button
            onClick={handleSelect}
            className="w-full px-4 py-2 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
          >
            <Check className="size-4" />
            <span>Select</span>
          </button>

          {(message.text || selectedText) && (
            <button
              onClick={handleCopy}
              className="w-full px-4 py-2 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
            >
              <Copy className="size-4" />
              <span>Copy</span>
            </button>
          )}

          <button
            onClick={handlePin}
            className="w-full px-4 py-2 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
          >
            <Pin className={`size-4 ${isPinned ? "text-primary" : ""}`} />
            <span>{isPinned ? "Unpin" : "Pin"}</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full px-4 py-2 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
          >
            <Share2 className="size-4" />
            <span>Share</span>
          </button>

          <div className="border-t border-base-300 my-1" />

          {isOwnMessage && (
            <button
              onClick={handleDeleteForEveryone}
              className="w-full px-4 py-2 text-left hover:bg-base-300 transition-colors flex items-center gap-3 text-red-500"
            >
              <Trash2 className="size-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && message.image && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-12 right-0 btn btn-circle btn-sm bg-white text-black hover:bg-gray-200"
            >
              <X className="size-5" />
            </button>

            <img
              src={message.image}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg"
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="btn btn-sm bg-white text-black hover:bg-gray-200 gap-2"
              >
                <Download className="size-4" />
                {isDownloading ? "Downloading..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        id={`message-${message._id}`}
        className={`chat ${
          isOwnMessage ? "chat-end" : "chat-start"
        } transition-all`}
        onContextMenu={handleContextMenu}
      >
        {/* Pinned indicator */}
        {isPinned && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <Pin className="size-4 text-primary fill-primary" />
          </div>
        )}

        {/* Reply indicator */}
        {message.replyTo && (
          <div
            className={`mb-1 px-2 ${isOwnMessage ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block text-xs opacity-70 border-t-2 border-primary pl-2 py-2 px-4 bg-base-300 rounded-lg cursor-pointer hover:opacity-100 transition-opacity ${
                isOwnMessage ? "border-r-2 border-l-0 pr-2 pl-0" : "border-l-2"
              }`}
              onClick={() => {
                const replyToElement = document.getElementById(
                  `message-${message.replyTo.messageId}`
                );
                if (replyToElement) {
                  replyToElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  replyToElement.classList.add("rounded-md", "bg-base-300/50");
                  setTimeout(() => {
                    replyToElement.classList.remove(
                      "rounded-md",
                      "bg-base-300/50"
                    );
                  }, 2000);
                } else {
                  toast.error("Original message not found");
                }
              }}
            >
              <div className="font-semibold">{message.replyTo.senderName}</div>
              <div className="truncate max-w-[200px]">
                {message.replyTo.text}
              </div>
            </div>
          </div>
        )}

        <div className="chat-image avatar">
          <div className="size-10 rounded-full border">
            <img
              src={
                isOwnMessage
                  ? authUser.profilePic || "/avatar.png"
                  : selectedUser.profilePic || "/avatar.png"
              }
              alt="profile pic"
            />
          </div>
        </div>
        <div className="chat-header mb-1">
          <time className="text-xs opacity-50 ml-1">
            {formatMessageTime(message.createdAt)}
          </time>
        </div>
        <div className="chat-bubble flex flex-col">
          {message.image && (
            <div className="relative group">
              <img
                src={message.image}
                alt="Attachment"
                className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                onClick={() => setShowImagePreview(true)}
              />

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => setShowImagePreview(true)}
                  className="btn btn-circle btn-sm bg-white text-black hover:bg-gray-200"
                  title="Preview"
                >
                  <Eye className="size-4" />
                </button>
                <button
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="btn btn-circle btn-sm bg-white text-black hover:bg-gray-200"
                  title="Download"
                >
                  <Download className="size-4" />
                </button>
              </div>
            </div>
          )}

          {message.video && (
            <video
              src={message.video}
              controls
              className="sm:max-w-[300px] rounded-md mb-2"
            />
          )}
          {message.audio && (
            <audio
              src={message.audio}
              controls
              className="sm:max-w-[300px] rounded-md mb-2"
            />
          )}

          {message.document && (
            <a
              href={message.document}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#2b3440] dark:bg-[#2a323c] p-3 rounded-lg transition-colors mb-2 max-w-xs"
            >
              <div className="flex-shrink-0">
                {getFileIcon(message.documentName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">
                  {message.documentName || "Document"}
                </p>
                <p className="text-xs opacity-70">Click to download</p>
              </div>
              <Download className="size-5 opacity-70 flex-shrink-0" />
            </a>
          )}

          {message.text && (
            <div className="flex items-end gap-1">
              <p className="break-words">{linkifyText(message.text)}</p>
              {isOwnMessage && (
                <span className="flex-shrink-0 self-end mb-0.5">
                  {message.isRead ? (
                    <svg
                      width="22px"
                      height="22px"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 12.9L7.14286 16.5L15 7.5"
                        stroke="#03b6fc"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 7.5625L11.4283 16.5625L11 16"
                        stroke="#03b6fc"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <Check className="w-4 h-4 text-gray-400" />
                  )}
                </span>
              )}
            </div>
          )}

          {(message.image ||
            message.video ||
            message.audio ||
            message.document) &&
            !message.text &&
            isOwnMessage &&
            !isPending && (
              <div className="flex justify-end mt-1">
                {message.isRead ? (
                  <svg
                    width="22px"
                    height="22px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12.9L7.14286 16.5L15 7.5"
                      stroke="#03b6fc"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 7.5625L11.4283 16.5625L11 16"
                      stroke="#03b6fc"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <Check className="w-4 h-4 text-gray-400" />
                )}
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default ChatMessage;
