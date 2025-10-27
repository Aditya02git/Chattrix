import { useEffect, useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { UserPlus, Check, X, Clock, Send } from "lucide-react";

const FriendRequestsPage = () => {
  const {
    friendRequests,
    sentRequests,
    getFriendRequests,
    getSentFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    isLoading,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState("received"); // "received" or "sent"

  useEffect(() => {
    getFriendRequests();
    getSentFriendRequests();
  }, [getFriendRequests, getSentFriendRequests]);

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now - messageDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return messageDate.toLocaleDateString();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-base-300 p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="size-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Friend Requests</h1>
            <p className="text-sm text-gray-400">Manage your friend requests</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "received"
                ? "bg-primary text-primary-content"
                : "bg-base-200 hover:bg-base-300"
            }`}
          >
            Received ({friendRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "sent"
                ? "bg-primary text-primary-content"
                : "bg-base-200 hover:bg-base-300"
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : activeTab === "received" ? (
          // Received Requests
          <div className="space-y-4">
            {friendRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="size-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-400">
                  No friend requests
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  You don&apos;t have any pending friend requests
                </p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-base-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={request.sender.profilePic || "/avatar.png"}
                      alt={request.sender.fullName}
                      className="size-14 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">
                        {request.sender.fullName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {request.sender.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request._id)}
                      className="btn btn-success btn-sm gap-2"
                    >
                      <Check className="size-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request._id)}
                      className="btn btn-error btn-sm gap-2"
                    >
                      <X className="size-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Sent Requests
          <div className="space-y-4">
            {sentRequests.length === 0 ? (
              <div className="text-center py-12">
                <Send className="size-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-400">
                  No sent requests
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  You haven&apos;t sent any friend requests
                </p>
              </div>
            ) : (
              sentRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-base-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={request.receiver.profilePic || "/avatar.png"}
                      alt={request.receiver.fullName}
                      className="size-14 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">
                        {request.receiver.fullName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {request.receiver.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="size-3" />
                        Sent {formatTime(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => cancelFriendRequest(request._id)}
                    className="btn btn-outline btn-error btn-sm gap-2"
                  >
                    <X className="size-4" />
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequestsPage;
