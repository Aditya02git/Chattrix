import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import {
  Send,
  X,
  Video,
  FileText,
  Paperclip,
  Loader2,
  Image as ImageIcon,
  Download,
  Eye,
  AudioLines,
  Smile,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import ReplyPreview from "./ReplyPreview";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState("emojis");
  const [searchQuery, setSearchQuery] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const textInputRef = useRef(null);
  const { sendMessage, replyMessage, clearReplyMessage } = useChatStore();

  // Emoji categories
  const emojiCategories = {
    smileys: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "🥲",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "🤥",
    ],
    gestures: [
      "👋",
      "🤚",
      "🖐",
      "✋",
      "🖖",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
    ],
    hearts: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "♥️",
    ],
    animals: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🦆",
      "🦅",
      "🦉",
      "🦇",
      "🐺",
      "🐗",
      "🐴",
      "🦄",
      "🐝",
      "🐛",
      "🦋",
      "🐌",
      "🐞",
      "🐢",
      "🐍",
      "🦎",
      "🦖",
      "🦕",
      "🐙",
      "🦑",
      "🦐",
      "🦞",
      "🦀",
      "🐡",
      "🐠",
      "🐟",
      "🐬",
      "🐳",
      "🐋",
      "🦈",
    ],
    food: [
      "🍏",
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
      "🥒",
      "🌶",
      "🫑",
      "🌽",
      "🥕",
      "🫒",
      "🧄",
      "🧅",
      "🥔",
      "🍠",
      "🥐",
      "🥯",
      "🍞",
      "🥖",
      "🥨",
      "🧀",
      "🥚",
      "🍳",
      "🧈",
      "🥞",
      "🧇",
      "🥓",
      "🥩",
      "🍗",
      "🍖",
      "🦴",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
      "🫓",
      "🥪",
      "🥙",
      "🧆",
      "🌮",
      "🌯",
      "🫔",
      "🥗",
      "🥘",
      "🫕",
      "🥫",
    ],
    activities: [
      "⚽️",
      "🏀",
      "🏈",
      "⚾️",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🪀",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🪃",
      "🥅",
      "⛳️",
      "🪁",
      "🏹",
      "🎣",
      "🤿",
      "🥊",
      "🥋",
      "🎽",
      "🛹",
      "🛼",
      "🛷",
      "⛸",
      "🥌",
      "🎿",
      "⛷",
      "🏂",
      "🪂",
      "🏋️",
      "🤼",
      "🤸",
      "🤺",
      "⛹️",
      "🤾",
      "🏌️",
      "🏇",
      "🧘",
      "🏊",
      "🏄",
      "🚣",
      "🧗",
      "🚵",
      "🚴",
    ],
  };

  // Popular stickers (using emojis as stickers for this example)
  const stickers = [
    "🎉",
    "🎊",
    "🎁",
    "🎈",
    "🎀",
    "🎂",
    "🍰",
    "🧁",
    "🎯",
    "🎮",
    "🎲",
    "🎪",
    "🎭",
    "🎨",
    "🎬",
    "🎤",
    "🎧",
    "🎼",
    "🎹",
    "🥁",
    "🎺",
    "🎷",
    "🎸",
    "🪕",
    "🎻",
    "🎳",
    "🎯",
    "🎰",
    "🧩",
    "🪀",
    "🪁",
    "🎏",
    "🎐",
    "🧧",
    "🎎",
    "🎃",
    "🎄",
    "🎆",
    "🎇",
    "🧨",
    "✨",
    "🎋",
    "🎍",
    "💝",
    "💖",
    "💗",
    "💓",
    "💞",
    "💕",
    "💟",
    "❣️",
    "💔",
    "❤️‍🔥",
    "❤️‍🩹",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
  ];

  // Trending GIF keywords (in real app, you'd use Giphy API)
  const gifKeywords = [
    { keyword: "happy", emoji: "😊" },
    { keyword: "love", emoji: "❤️" },
    { keyword: "funny", emoji: "😂" },
    { keyword: "sad", emoji: "😢" },
    { keyword: "angry", emoji: "😠" },
    { keyword: "excited", emoji: "🎉" },
    { keyword: "dance", emoji: "💃" },
    { keyword: "celebrate", emoji: "🎊" },
    { keyword: "thumbs up", emoji: "👍" },
    { keyword: "fire", emoji: "🔥" },
    { keyword: "cool", emoji: "😎" },
    { keyword: "shock", emoji: "😱" },
    { keyword: "yes", emoji: "✅" },
    { keyword: "no", emoji: "❌" },
    { keyword: "thinking", emoji: "🤔" },
  ];

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setShowUploadMenu(false);

    const maxSize =
      type === "video"
        ? 50 * 1024 * 1024
        : type === "image"
        ? 10 * 1024 * 1024
        : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024));
      toast.error(`File size should be less than ${sizeMB}MB`);
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setUploadProgress(0);
    setMediaType(type);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    };

    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 300);
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsUploading(false);
      setUploadProgress(0);
    };

    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    setFileName("");
    setUploadProgress(0);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const handleDownloadImage = () => {
    if (!mediaPreview || mediaType !== "image") return;

    const link = document.createElement("a");
    link.href = mediaPreview;
    link.download = fileName || `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded successfully");
  };

  const insertEmoji = (emoji) => {
    const input = textInputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setText(newText);

      // Set cursor position after emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setText(text + emoji);
    }
  };

  const sendGif = (gifKeyword) => {
    // In a real app, you'd fetch actual GIF from Giphy API
    // For now, we'll just send the keyword as text
    setText(`[GIF: ${gifKeyword}]`);
    toast.success(`GIF selected: ${gifKeyword}`);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaPreview) return;
    if (isUploading) return;

    setIsUploading(true);

    try {
      await sendMessage({
        text: text.trim(),
        image: mediaType === "image" ? mediaPreview : null,
        video: mediaType === "video" ? mediaPreview : null,
        audio: mediaType === "audio" ? mediaPreview : null,
        document: mediaType === "document" ? mediaPreview : null,
        documentName: mediaType === "document" ? fileName : null,
        replyTo: replyMessage
          ? {
              messageId: replyMessage._id,
              text: replyMessage.text,
              senderName: replyMessage.senderName,
            }
          : null,
      });

      setText("");
      setMediaPreview(null);
      setMediaType(null);
      setFileName("");
      clearReplyMessage();
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      if (documentInputRef.current) documentInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!fileName) return <FileText className="size-8 text-gray-400" />;

    const ext = fileName.split(".").pop().toLowerCase();
    if (ext === "pdf") return <FileText className="size-8 text-red-500" />;
    if (["doc", "docx"].includes(ext))
      return <FileText className="size-8 text-blue-500" />;
    if (["xls", "xlsx"].includes(ext))
      return <FileText className="size-8 text-green-500" />;
    return <FileText className="size-8 text-gray-400" />;
  };

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!searchQuery) return Object.values(emojiCategories).flat();
    return Object.values(emojiCategories)
      .flat()
      .filter((emoji) => emoji.includes(searchQuery));
  };

  const getFilteredStickers = () => {
    if (!searchQuery) return stickers;
    return stickers.filter((sticker) => sticker.includes(searchQuery));
  };

  const getFilteredGifs = () => {
    if (!searchQuery) return gifKeywords;
    return gifKeywords.filter((gif) =>
      gif.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="w-full">
      {/* Reply Preview */}
      <ReplyPreview />

      <div className="p-4">
        {showImagePreview && mediaType === "image" && (
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
                src={mediaPreview}
                alt="Preview"
                className="w-full h-full object-contain rounded-lg"
              />

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={handleDownloadImage}
                  className="btn btn-sm bg-white text-black hover:bg-gray-200 gap-2"
                >
                  <Download className="size-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {mediaPreview && (
          <div className="mb-3 flex items-center gap-2">
            <div className="relative">
              {mediaType === "image" && (
                <div className="relative">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                  />

                  {!isUploading && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => setShowImagePreview(true)}
                        className="btn btn-xs btn-circle bg-base-300 hover:bg-base-200"
                        title="Preview"
                        type="button"
                      >
                        <Eye className="size-3" />
                      </button>
                      <button
                        onClick={handleDownloadImage}
                        className="btn btn-xs btn-circle bg-base-300 hover:bg-base-200"
                        title="Download"
                        type="button"
                      >
                        <Download className="size-3" />
                      </button>
                    </div>
                  )}

                  {isUploading && uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center text-white">
                        <svg
                          className="animate-spin h-6 w-6 text-white mb-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        <span className="text-xs font-medium">
                          Uploading...
                        </span>
                      </div>{" "}
                    </div>
                  )}
                </div>
              )}

              {mediaType === "video" && (
                <div className="w-20 h-20 bg-base-300 rounded-lg border border-zinc-700 flex items-center justify-center relative overflow-hidden">
                  <video
                    src={mediaPreview}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {isUploading && uploadProgress < 100 ? (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="flex flex-col items-center text-white">
                          <svg
                            className="animate-spin h-6 w-6 text-white mb-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          <span className="text-xs font-medium">
                            Uploading...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Video className="size-8 text-white" />
                    )}
                  </div>
                </div>
              )}

              {mediaType === "audio" && (
                <div className="w-20 h-20 bg-base-300 rounded-lg border border-zinc-700 flex items-center justify-center relative overflow-hidden">
                  <audio
                    src={mediaPreview}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {isUploading && uploadProgress < 100 ? (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="flex flex-col items-center text-white">
                          <svg
                            className="animate-spin h-6 w-6 text-white mb-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          <span className="text-xs font-medium">
                            Uploading...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <AudioLines className="size-8 text-white" />
                    )}
                  </div>
                </div>
              )}

              {mediaType === "document" && (
                <div className="w-32 h-20 bg-base-300 rounded-lg border border-zinc-700 flex flex-col items-center justify-center p-2 relative">
                  {getFileIcon()}
                  <span className="text-xs text-gray-400 truncate w-full text-center mt-1">
                    {fileName}
                  </span>
                  {isUploading && uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center text-white">
                        <svg
                          className="animate-spin h-6 w-6 text-white mb-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        <span className="text-xs font-medium">
                          Uploading...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isUploading && (
                <button
                  onClick={removeMedia}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white
                  flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                  type="button"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <input
              ref={textInputRef}
              type="text"
              className="w-full input input-bordered rounded-lg input-sm sm:input-md"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isUploading}
            />

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={imageInputRef}
              onChange={(e) => handleFileChange(e, "image")}
              disabled={isUploading}
            />
            <input
              type="file"
              accept="video/*"
              className="hidden"
              ref={videoInputRef}
              onChange={(e) => handleFileChange(e, "video")}
              disabled={isUploading}
            />
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              ref={audioInputRef}
              onChange={(e) => handleFileChange(e, "audio")}
              disabled={isUploading}
            />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              ref={documentInputRef}
              onChange={(e) => handleFileChange(e, "document")}
              disabled={isUploading}
            />

            {/* Emoji Picker Button */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                className="btn btn-circle"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isUploading}
              >
                <Smile size={20} />
              </button>

              {showEmojiPicker && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowEmojiPicker(false)}
                  />

                  <div className="absolute bottom-full right-0 mb-2 bg-base-200 rounded-lg shadow-xl border border-base-300 w-80 z-20">
                    {/* Tabs */}
                    <div className="flex border-b border-base-300">
                      <button
                        type="button"
                        onClick={() => setEmojiTab("emojis")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          emojiTab === "emojis"
                            ? "text-primary border-b-2 border-primary"
                            : "text-base-content/70"
                        }`}
                      >
                        😊 Emojis
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmojiTab("stickers")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          emojiTab === "stickers"
                            ? "text-primary border-b-2 border-primary"
                            : "text-base-content/70"
                        }`}
                      >
                        🎨 Stickers
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmojiTab("gifs")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          emojiTab === "gifs"
                            ? "text-primary border-b-2 border-primary"
                            : "text-base-content/70"
                        }`}
                      >
                        🎬 GIFs
                      </button>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-base-300">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
                        <input
                          type="text"
                          placeholder={`Search ${emojiTab}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input input-sm w-full pl-9"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 h-64 overflow-y-auto">
                      {emojiTab === "emojis" && (
                        <div className="grid grid-cols-8">
                          {getFilteredEmojis().map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              className="text-2xl hover:bg-base-300 rounded  transition-colors"
                              onClick={() => {
                                insertEmoji(emoji);
                                setShowEmojiPicker(false);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {emojiTab === "stickers" && (
                        <div className="grid grid-cols-6">
                          {getFilteredStickers().map((sticker, index) => (
                            <button
                              key={index}
                              type="button"
                              className="text-3xl hover:bg-base-300 rounded-lg transition-colors"
                              onClick={() => {
                                insertEmoji(sticker);
                                setShowEmojiPicker(false);
                                toast.success("Sticker added!");
                              }}
                            >
                              {sticker}
                            </button>
                          ))}
                        </div>
                      )}

                      {emojiTab === "gifs" && (
                        <div className="grid grid-cols-2">
                          {getFilteredGifs().map((gif, index) => (
                            <button
                              key={index}
                              type="button"
                              className="hover:bg-base-300 rounded-lg transition-colors flex flex-col items-center gap-2"
                              onClick={() => sendGif(gif.keyword)}
                            >
                              <span className="text-4xl">{gif.emoji}</span>
                              <span className="text-xs capitalize">
                                {gif.keyword}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No results */}
                      {searchQuery &&
                        ((emojiTab === "emojis" &&
                          getFilteredEmojis().length === 0) ||
                          (emojiTab === "stickers" &&
                            getFilteredStickers().length === 0) ||
                          (emojiTab === "gifs" &&
                            getFilteredGifs().length === 0)) && (
                          <div className="text-center py-8 text-base-content/50">
                            No {emojiTab} found
                          </div>
                        )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative hidden sm:block">
              <button
                type="button"
                className={`btn btn-circle ${
                  mediaPreview ? "text-emerald-500" : "text-zinc-400"
                }`}
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                disabled={isUploading}
              >
                <Paperclip size={20} />
              </button>

              {showUploadMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUploadMenu(false)}
                  />

                  <div className="absolute bottom-full right-0 mb-2 bg-base-200 rounded-lg shadow-lg border border-base-300 py-2 min-w-[180px] z-20">
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
                      onClick={() => {
                        imageInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      <ImageIcon className="size-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">Image</div>
                        <div className="text-xs text-gray-500">Max 10MB</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
                      onClick={() => {
                        videoInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      <Video className="size-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-sm">Video</div>
                        <div className="text-xs text-gray-500">Max 50MB</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
                      onClick={() => {
                        audioInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      <AudioLines className="size-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-sm">Audio</div>
                        <div className="text-xs text-gray-500">Max 50MB</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left hover:bg-base-300 transition-colors flex items-center gap-3"
                      onClick={() => {
                        documentInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                    >
                      <FileText className="size-5 text-green-500" />
                      <div>
                        <div className="font-medium text-sm">Document</div>
                        <div className="text-xs text-gray-500">
                          PDF, DOC, XLS, TXT
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-sm btn-circle"
            disabled={(!text.trim() && !mediaPreview) || isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send size={22} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
