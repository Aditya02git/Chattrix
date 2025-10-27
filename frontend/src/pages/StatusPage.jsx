import { useEffect, useState } from "react";
import { useStatusStore } from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";
import { Plus, Eye } from "lucide-react";
import CreateStatusModal from "../components/CreateStatusModal";
import StatusViewer from "../components/StatusViewer";

const StatusPage = () => {
  const {
    statuses,
    getAllStatuses,
    isStatusLoading,
    subscribeToStatuses,
    unsubscribeFromStatuses,
  } = useStatusStore();
  const { authUser } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    getAllStatuses();
    subscribeToStatuses();
    return () => unsubscribeFromStatuses();
  }, [getAllStatuses, subscribeToStatuses, unsubscribeFromStatuses]);

  // Get current user's statuses
  const myStatuses = statuses.find((s) => s.user._id === authUser?._id);

  // Filter statuses to only show friends' statuses
  const friendStatuses = statuses.filter((s) => {
    if (s.user._id === authUser?._id) return false; // Exclude own status
    return true;
  });

  // Calculate time remaining
  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Status Ring Component
  const StatusRing = ({
    user,
    statuses,
    onClick,
    isOwn = false,
    onAddMore,
  }) => {
    // For own status, never show as unviewed (always gray ring)
    // For friends' status, check if any status hasn't been viewed
    const hasUnviewed = isOwn
      ? false
      : statuses.some((status) => {
          // Check if current user has viewed this status
          const isViewed = status.views.some((view) => {
            const viewUserId = view.userId?._id || view.userId;
            return viewUserId === authUser?._id;
          });
          return !isViewed; // Return true if NOT viewed (meaning there's an unviewed status)
        });

    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className={`relative p-1 rounded-full cursor-pointer transition-all duration-300 ${
            hasUnviewed
              ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
              : "bg-gray-600"
          }`}
          onClick={onClick}
        >
          <div className="bg-base-100 rounded-full p-1">
            <img
              src={user.profilePic || "/avatar.png"}
              alt={user.fullName}
              className="size-16 object-cover rounded-full"
            />
          </div>

          {isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddMore();
              }}
              className="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full p-1 hover:bg-primary-focus transition-colors"
              title="Add more status"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
        <div className="text-center max-w-[80px]">
          <p className="text-xs font-medium truncate">
            {isOwn ? "Your Status" : user.fullName}
          </p>
          {statuses.length > 0 && (
            <p className="text-xs text-gray-400">
              {getTimeRemaining(statuses[statuses.length - 1].expiresAt)}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pt-20">
      {/* Header */}
      <div className="border-b border-base-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Status</h1>
            <p className="text-sm text-gray-400">
              Share photos, videos, and text updates
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary gap-2"
          >
            <Plus className="size-5" />
            Create Status
          </button>
        </div>
      </div>

      {/* Status List */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* My Status */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">My Status</h2>
          <div className="flex items-start gap-6 overflow-x-auto pb-4">
            {myStatuses ? (
              <StatusRing
                user={authUser}
                statuses={myStatuses.statuses}
                onClick={() => setSelectedUser(myStatuses)}
                isOwn={true}
                onAddMore={() => setShowCreateModal(true)}
              />
            ) : (
              <div
                onClick={() => setShowCreateModal(true)}
                className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80"
              >
                <div className="relative p-1 rounded-full bg-gray-600">
                  <div className="bg-base-100 rounded-full p-1">
                    <img
                      src={authUser?.profilePic || "/avatar.png"}
                      alt="You"
                      className="size-16 object-cover rounded-full"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full p-1">
                    <Plus className="size-4" />
                  </div>
                </div>
                <p className="text-xs font-medium">Add Status</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Updates */}
        {friendStatuses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Updates</h2>
            <div className="flex items-start gap-6 overflow-x-auto pb-4">
              {friendStatuses.map((statusGroup) => (
                <StatusRing
                  key={statusGroup.user._id}
                  user={statusGroup.user}
                  statuses={statusGroup.statuses}
                  onClick={() => setSelectedUser(statusGroup)}
                />
              ))}
            </div>
          </div>
        )}

        {friendStatuses.length === 0 && !myStatuses && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-base-200 rounded-full p-6 mb-4">
              <Eye className="size-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No status updates yet
            </h3>
            <p className="text-gray-400 mb-4">
              Your friends haven&apos;t posted any status. Be the first!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary gap-2"
            >
              <Plus className="size-5" />
              Create Your First Status
            </button>
          </div>
        )}

        {friendStatuses.length === 0 && myStatuses && (
          <div className="text-center py-8">
            <p className="text-gray-400">
              None of your friends have posted status updates yet
            </p>
          </div>
        )}
      </div>

      {/* Create Status Modal */}
      {showCreateModal && (
        <CreateStatusModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Status Viewer */}
      {selectedUser && (
        <StatusViewer
          statusGroup={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAddMore={() => setShowCreateModal(true)}
        />
      )}
    </div>
  );
};

export default StatusPage;
