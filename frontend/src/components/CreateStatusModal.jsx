import { useState, useRef } from "react";
import { useStatusStore } from "../store/useStatusStore";
import { X, Image as ImageIcon, Video, Type, Upload } from "lucide-react";
import toast from "react-hot-toast";

const CreateStatusModal = ({ onClose }) => {
  const { createStatus } = useStatusStore();
  const [statusType, setStatusType] = useState(null); // 'text', 'image', 'video'
  const [textContent, setTextContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#1a1a2e");
  const [caption, setCaption] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const backgroundColors = [
    "#1a1a2e",
    "#16213e",
    "#0f3460",
    "#533483",
    "#8b2f97",
    "#c94277",
    "#e63946",
    "#f4a261",
    "#2a9d8f",
    "#264653",
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize =
      statusType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      toast.error(
        `File size should be less than ${
          statusType === "video" ? "50MB" : "10MB"
        }`
      );
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!statusType) {
      toast.error("Please select a status type");
      return;
    }

    if (statusType === "text" && !textContent.trim()) {
      toast.error("Please enter some text");
      return;
    }

    if ((statusType === "image" || statusType === "video") && !mediaFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);

    try {
      const statusData = {
        type: statusType,
      };

      if (statusType === "text") {
        statusData.content = textContent;
        statusData.backgroundColor = backgroundColor;
      } else {
        statusData.content = mediaPreview;
        statusData.caption = caption;
      }

      await createStatus(statusData);
      onClose();
    } catch (error) {
      console.error("Error creating status:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-base-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <h2 className="text-2xl font-bold">Create Status</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!statusType ? (
            /* Type Selection */
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setStatusType("text")}
                className="flex flex-col items-center gap-3 p-6 bg-base-100 rounded-xl hover:bg-base-300 transition-colors"
              >
                <div className="bg-primary text-primary-content p-4 rounded-full">
                  <Type className="size-8" />
                </div>
                <span className="font-semibold">Text</span>
              </button>

              <button
                onClick={() => {
                  setStatusType("image");
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="flex flex-col items-center gap-3 p-6 bg-base-100 rounded-xl hover:bg-base-300 transition-colors"
              >
                <div className="bg-green-500 text-white p-4 rounded-full">
                  <ImageIcon className="size-8" />
                </div>
                <span className="font-semibold">Image</span>
              </button>

              <button
                onClick={() => {
                  setStatusType("video");
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="flex flex-col items-center gap-3 p-6 bg-base-100 rounded-xl hover:bg-base-300 transition-colors"
              >
                <div className="bg-purple-500 text-white p-4 rounded-full">
                  <Video className="size-8" />
                </div>
                <span className="font-semibold">Video</span>
              </button>
            </div>
          ) : statusType === "text" ? (
            /* Text Status */
            <div className="space-y-4">
              <div
                className="relative rounded-xl p-8 min-h-[300px] flex items-center justify-center"
                style={{ backgroundColor }}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your status..."
                  className="w-full bg-transparent text-white text-2xl md:text-4xl font-bold text-center resize-none focus:outline-none placeholder-white/50"
                  rows="4"
                  maxLength="200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {backgroundColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`size-12 rounded-lg ${
                        backgroundColor === color ? "ring-4 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-400 text-right">
                {textContent.length}/200
              </div>
            </div>
          ) : (
            /* Image/Video Status */
            <div className="space-y-4">
              {mediaPreview ? (
                <div className="relative">
                  {statusType === "image" ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full max-h-[400px] object-contain rounded-xl bg-black"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      className="w-full max-h-[400px] object-contain rounded-xl bg-black"
                      controls
                    />
                  )}
                  <button
                    onClick={() => {
                      setMediaPreview(null);
                      setMediaFile(null);
                      fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 btn btn-error btn-sm btn-circle"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-base-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="size-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold mb-2">
                    Click to upload {statusType}
                  </p>
                  <p className="text-sm text-gray-400">
                    Max size: {statusType === "video" ? "50MB" : "10MB"}
                  </p>
                </div>
              )}

              {mediaPreview && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="textarea textarea-bordered w-full"
                    rows="3"
                    maxLength="200"
                  />
                  <div className="text-sm text-gray-400 text-right mt-1">
                    {caption.length}/200
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={statusType === "image" ? "image/*" : "video/*"}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-base-300">
          <button
            onClick={() => {
              setStatusType(null);
              setTextContent("");
              setCaption("");
              setMediaPreview(null);
              setMediaFile(null);
            }}
            className="btn btn-ghost"
            disabled={isUploading}
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isUploading ||
              (statusType === "text" && !textContent.trim()) ||
              ((statusType === "image" || statusType === "video") && !mediaFile)
            }
            className="btn btn-primary gap-2"
          >
            {isUploading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Uploading...
              </>
            ) : (
              "Post Status"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStatusModal;
