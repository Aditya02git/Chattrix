import { useEffect, useState } from "react";
import { useStatusStore } from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Pause,
  Play,
  Plus,
} from "lucide-react";

const StatusViewer = ({ statusGroup, onClose, onAddMore }) => {
  const {
    viewStatus,
    deleteStatus,
    currentStatusIndex,
    setCurrentStatusIndex,
  } = useStatusStore();
  const { authUser } = useAuthStore();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const statuses = statusGroup.statuses;
  const currentStatus = statuses[currentStatusIndex];
  const isOwn = statusGroup.user._id === authUser?._id;

// Auto-advance timer
useEffect(() => {
  if (isPaused) return;

  const duration = currentStatus.type === "video" ? 15000 : 5000; // 15s for video, 5s for image/text
  const interval = 50;
  const increment = (interval / duration) * 100;

  const timer = setInterval(() => {
    setProgress((prev) => {
      if (prev >= 100) {
        handleNext();
        return 0;
      }
      return prev + increment;
    });
  }, interval);

  return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentStatusIndex, isPaused, currentStatus.type]);

// Mark as viewed when status changes
useEffect(() => {
  if (!isOwn && currentStatus) {
    viewStatus(currentStatus._id);
  }
  setProgress(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentStatusIndex, currentStatus, isOwn]);

  const handleNext = () => {
    if (currentStatusIndex < statuses.length - 1) {
      setCurrentStatusIndex(currentStatusIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStatusIndex > 0) {
      setCurrentStatusIndex(currentStatusIndex - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this status?")) {
      await deleteStatus(currentStatus._id);
      if (statuses.length === 1) {
        onClose();
      } else if (currentStatusIndex === statuses.length - 1) {
        setCurrentStatusIndex(currentStatusIndex - 1);
      }
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const statusDate = new Date(date);
    const diffInHours = Math.floor((now - statusDate) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - statusDate) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return statusDate.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {statuses.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width:
                  index === currentStatusIndex
                    ? `${progress}%`
                    : index < currentStatusIndex
                    ? "100%"
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <img
            src={statusGroup.user.profilePic || "/avatar.png"}
            alt={statusGroup.user.fullName}
            className="size-10 rounded-full object-cover ring-2 ring-white"
          />
          <div>
            <p className="text-white font-semibold">
              {statusGroup.user.fullName}
            </p>
            <p className="text-gray-300 text-sm">
              {formatTime(currentStatus.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn btn-ghost btn-sm btn-circle text-white"
          >
            {isPaused ? (
              <Play className="size-5" />
            ) : (
              <Pause className="size-5" />
            )}
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => setShowViewers(!showViewers)}
                className="btn btn-ghost btn-sm gap-2 text-white"
              >
                <Eye className="size-5" />
                {currentStatus.views.length}
              </button>
              <button
                onClick={() => {
                  onAddMore();
                  onClose();
                }}
                className="btn btn-ghost btn-sm btn-circle text-white"
                title="Add more status"
              >
                <Plus className="size-5" />
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-ghost btn-sm btn-circle text-white"
              >
                <Trash2 className="size-5" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-white"
          >
            <X className="size-6" />
          </button>
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={handlePrevious}
        disabled={currentStatusIndex === 0}
        className="absolute left-4 top-1/2 btn btn-ghost btn-circle text-white disabled:opacity-30 z-10"
      >
        <ChevronLeft className="size-8" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 btn btn-ghost btn-circle text-white z-10"
      >
        <ChevronRight className="size-8" />
      </button>

      {/* Status Content */}
      <div className="w-full h-full flex items-center justify-center">
        {currentStatus.type === "text" && (
          <div
            className="w-full h-full flex items-center justify-center p-8"
            style={{ backgroundColor: currentStatus.backgroundColor }}
          >
            <p className="text-white text-3xl md:text-5xl font-bold text-center max-w-2xl break-words">
              {currentStatus.content}
            </p>
          </div>
        )}

        {currentStatus.type === "image" && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={currentStatus.content}
              alt="Status"
              className="max-w-full max-h-full object-contain"
            />
            {currentStatus.caption && (
              <div className="absolute bottom-20 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <p className="text-white text-lg text-center">
                  {currentStatus.caption}
                </p>
              </div>
            )}
          </div>
        )}

        {currentStatus.type === "video" && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              src={currentStatus.content}
              className="max-w-full max-h-full"
              autoPlay
              muted
              loop
              playsInline
            />
            {currentStatus.caption && (
              <div className="absolute bottom-20 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <p className="text-white text-lg text-center">
                  {currentStatus.caption}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Viewers List */}
      {showViewers && isOwn && (
        <div className="absolute bottom-0 left-0 right-0 bg-base-200 rounded-t-2xl p-6 max-h-[50vh] overflow-y-auto z-20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="size-5" />
            Viewed by {currentStatus.views.length}
          </h3>
          <div className="space-y-3">
            {currentStatus.views.map((view, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="size-10 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold">
                  {view.userId?.fullName?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {view.userId?.fullName || "Unknown User"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatTime(view.viewedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click areas for navigation */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" onClick={handlePrevious} />
        <div className="flex-1" onClick={handleNext} />
      </div>
    </div>
  );
};

export default StatusViewer;
