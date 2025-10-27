import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { Users, UserX, Trash2, Ban, Shield } from "lucide-react";

const FriendsManagementPage = () => {
  const { users, getUsers } = useChatStore();
  const {
    blockedUsers,
    removeFriend,
    blockUser,
    unblockUser,
    getBlockedUsers,
  } = useFriendStore();
  const [activeTab, setActiveTab] = useState("friends"); // "friends" or "blocked"
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null); // "remove" or "block" or "unblock"

  useEffect(() => {
    getUsers();
    getBlockedUsers();
  }, [getUsers, getBlockedUsers]);

  const handleAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      if (actionType === "remove") {
        await removeFriend(selectedUser._id);
        await getUsers(); // Refresh friends list
      } else if (actionType === "block") {
        await blockUser(selectedUser._id);
        await getUsers(); // Refresh friends list
      } else if (actionType === "unblock") {
        await unblockUser(selectedUser._id);
      }
    } finally {
      setShowConfirmModal(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-base-300 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="size-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Friends Management</h1>
            <p className="text-sm text-gray-400">
              Manage your friends and blocked users
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "friends"
                ? "bg-primary text-primary-content"
                : "bg-base-200 hover:bg-base-300"
            }`}
          >
            Friends ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "blocked"
                ? "bg-error text-error-content"
                : "bg-base-200 hover:bg-base-300"
            }`}
          >
            Blocked ({blockedUsers.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "friends" ? (
          // Friends List
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="size-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-400">
                  No friends yet
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Add friends to start chatting!
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className="bg-base-200 rounded-lg p-4 flex items-center justify-between hover:bg-base-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-14 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{user.fullName}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(user, "block")}
                      className="btn btn-outline btn-warning btn-sm gap-2"
                      title="Block user"
                    >
                      <Ban className="size-4" />
                      Block
                    </button>
                    <button
                      onClick={() => handleAction(user, "remove")}
                      className="btn btn-outline btn-error btn-sm gap-2"
                      title="Remove friend"
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Blocked Users List
          <div className="space-y-4">
            {blockedUsers.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="size-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-400">
                  No blocked users
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  You haven&apos;t blocked anyone
                </p>
              </div>
            ) : (
              blockedUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-base-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="size-14 rounded-full object-cover opacity-50"
                      />
                      <Ban className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 text-error" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.fullName}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <p className="text-xs text-error mt-1">Blocked</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAction(user, "unblock")}
                    className="btn btn-success btn-sm gap-2"
                  >
                    <UserX className="size-4" />
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-200 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Action</h3>

            {actionType === "remove" && (
              <p className="mb-6">
                Are you sure you want to remove{" "}
                <strong>{selectedUser?.fullName}</strong> from your friends
                list?
              </p>
            )}

            {actionType === "block" && (
              <p className="mb-6">
                Are you sure you want to block{" "}
                <strong>{selectedUser?.fullName}</strong>? They will be removed
                from your friends list and won&apos;t be able to send you
                messages.
              </p>
            )}

            {actionType === "unblock" && (
              <p className="mb-6">
                Are you sure you want to unblock{" "}
                <strong>{selectedUser?.fullName}</strong>?
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                  setActionType(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`btn ${
                  actionType === "unblock" ? "btn-success" : "btn-error"
                }`}
              >
                {actionType === "remove" && "Remove"}
                {actionType === "block" && "Block"}
                {actionType === "unblock" && "Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsManagementPage;
