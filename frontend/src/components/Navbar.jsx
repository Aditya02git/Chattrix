import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  CircleFadingPlus,
  MessageSquareText,
  Moon,
  Settings,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useFriendStore } from "../store/useFriendStore";
import { useStatusStore } from "../store/useStatusStore";
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

const Navbar = () => {
  const { authUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const {
    statuses,
    getAllStatuses,
    subscribeToStatuses,
    unsubscribeFromStatuses,
  } = useStatusStore();
  const {
    friendRequests,
    getFriendRequests,
    subscribeToFriendEvents,
    unsubscribeFromFriendEvents,
  } = useFriendStore();
  const { unreadCounts } = useChatStore();

  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    if (authUser) {
      getFriendRequests();
      getAllStatuses();
      subscribeToFriendEvents();
      subscribeToStatuses();

      return () => {
        unsubscribeFromFriendEvents();
        unsubscribeFromStatuses();
      };
    }
  }, [
    authUser,
    getFriendRequests,
    getAllStatuses,
    subscribeToFriendEvents,
    subscribeToStatuses,
    unsubscribeFromFriendEvents,
    unsubscribeFromStatuses,
  ]);

  // Calculate unviewed status count
  const getUnviewedStatusCount = () => {
    if (!authUser) return 0;

    let count = 0;
    statuses.forEach((statusGroup) => {
      // Exclude own statuses
      if (statusGroup.user._id === authUser._id) return;

      // Check if any status in this group has not been viewed
      const hasUnviewed = statusGroup.statuses.some(
        (status) =>
          !status.views.some(
            (view) =>
              view.userId === authUser._id || view.userId?._id === authUser._id
          )
      );

      if (hasUnviewed) {
        count++;
      }
    });

    return count;
  };

  const unviewedStatusCount = getUnviewedStatusCount();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center  hover:opacity-80 transition-all"
            >
              <div className=" rounded-lg flex items-center justify-center">
                <img
                  src="/app_icon.png"
                  alt="Chattrix"
                  height="80px"
                  width="80px"
                />
              </div>
              <h1 className="text-2xl font-bold">Chattrix</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {authUser && (
              <>
                <Link to={"/"} className={`btn btn-sm gap-2 relative`}>
                  <MessageSquareText className="size-5" />
                  <span className="hidden sm:inline">Chat</span>
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-bold rounded-full size-5 flex items-center justify-center">
                      {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                  )}
                </Link>

                <Link to={"/status"} className={`btn btn-sm gap-2 relative`}>
                  <CircleFadingPlus className="size-5" />
                  <span className="hidden sm:inline">Status</span>
                  {unviewedStatusCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-bold rounded-full size-5 flex items-center justify-center">
                      {unviewedStatusCount > 9 ? "9+" : unviewedStatusCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/add-friend"
                  className="btn btn-sm gap-2"
                  title="Add Friends"
                >
                  <UserPlus className="size-5" />
                  <span className="hidden sm:inline">Add Friend</span>
                </Link>

                <Link
                  to="/friend-requests"
                  className="btn btn-sm gap-2 relative"
                  title="Friend Requests"
                >
                  <Users className="size-5" />
                  <span className="hidden sm:inline">Requests</span>
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs font-bold rounded-full size-5 flex items-center justify-center">
                      {friendRequests.length > 9 ? "9+" : friendRequests.length}
                    </span>
                  )}
                </Link>

                <Link
                  to={"/settings"}
                  className={`btn btn-sm gap-2 transition-colors`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </>
            )}

            {/* Toggle Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="relative inline-flex items-center gap-2 bg-base-200 rounded-full p-1 transition-colors hover:bg-base-300"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    theme === "light"
                      ? "bg-primary text-primary-content"
                      : "bg-transparent"
                  }`}
                >
                  <Sun size={20} />
                </div>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    theme === "dark"
                      ? "bg-primary text-primary-content"
                      : "bg-transparent"
                  }`}
                >
                  <Moon size={20} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
