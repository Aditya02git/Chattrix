import { useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Search, UserPlus, X, Check, Clock, Ban } from "lucide-react";
import toast from "react-hot-toast";

const AddFriendPage = () => {
  const [email, setEmail] = useState("");
  const {
    searchUserByEmail,
    sendFriendRequest,
    cancelFriendRequest,
    searchResult,
    isSearching,
    clearSearchResult,
  } = useFriendStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      await searchUserByEmail(email.trim());
    } catch (error) {
      // Error handled in store
      console.error("Search error:", error);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult?.user) return;

    try {
      await sendFriendRequest(searchResult.user._id);
    } catch (error) {
      // Error handled in store
      console.error("Send request error:", error);
    }
  };

  const handleCancelRequest = async () => {
    if (!searchResult?.friendRequest) return;

    try {
      await cancelFriendRequest(searchResult.friendRequest._id);
    } catch (error) {
      // Error handled in store
      console.error("Cancel request error:", error);
    }
  };

  const renderActionButton = () => {
    if (!searchResult) return null;

    const { user, isAlreadyFriend, isBlocked, friendRequest } = searchResult;

    if (isBlocked) {
      return (
        <div className="flex items-center gap-2 text-error">
          <Ban className="size-5" />
          <span>User is blocked</span>
        </div>
      );
    }

    if (isAlreadyFriend) {
      return (
        <div className="flex items-center gap-2 text-success">
          <Check className="size-5" />
          <span>Already friends</span>
        </div>
      );
    }

    if (friendRequest) {
      if (friendRequest.sender === user._id) {
        // They sent you a request
        return (
          <div className="flex items-center gap-2 text-warning">
            <Clock className="size-5" />
            <span>They sent you a friend request</span>
          </div>
        );
      } else {
        // You sent them a request
        return (
          <button
            onClick={handleCancelRequest}
            className="btn btn-outline btn-error gap-2"
          >
            <X className="size-5" />
            Cancel Request
          </button>
        );
      }
    }

    // Can send friend request
    return (
      <button onClick={handleSendRequest} className="btn btn-primary gap-2">
        <UserPlus className="size-5" />
        Send Friend Request
      </button>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-base-300 p-6">
        <h1 className="text-2xl font-bold mb-2">Add Friends</h1>
        <p className="text-sm text-gray-400">
          Search for users by their email address
        </p>
      </div>

      {/* Search Form */}
      <div className="p-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address..."
              className="w-full pl-10 pr-4 py-3 bg-base-200 border border-base-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="btn btn-primary"
          >
            {isSearching ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Search Result */}
        {searchResult && (
          <div className="mt-6 bg-base-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={searchResult.user.profilePic || "/avatar.png"}
                  alt={searchResult.user.fullName}
                  className="size-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold">
                    {searchResult.user.fullName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {searchResult.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {renderActionButton()}
                <button
                  onClick={clearSearchResult}
                  className="btn btn-ghost btn-circle"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriendPage;
