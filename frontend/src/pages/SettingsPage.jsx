import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Bell, Lock, LogOut, Shield, UserPlus, Users } from "lucide-react";

const SettingsPage = () => {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-y-auto pt-20">
      {/* Settings Section */}
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-4">
          <div className="border-b border-base-300 pb-4">
            <h1 className="text-2xl font-bold mb-2">Settings</h1>
            <p className="text-sm text-gray-400">
              Manage your account and preferences
            </p>
          </div>

          {/* Friends Section */}
          <div className="bg-base-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-base-300">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Friends & Connections
              </h2>
            </div>

            <Link
              to="/add-friend"
              className="flex items-center gap-4 p-4 hover:bg-base-300 transition-colors border-b border-base-300"
            >
              <div className="bg-primary/10 p-3 rounded-full">
                <UserPlus className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Add Friends</h3>
                <p className="text-sm text-gray-400">
                  Search and add friends by email
                </p>
              </div>
            </Link>

            <Link
              to="/friend-requests"
              className="flex items-center gap-4 p-4 hover:bg-base-300 transition-colors border-b border-base-300"
            >
              <div className="bg-primary/10 p-3 rounded-full">
                <Bell className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Friend Requests</h3>
                <p className="text-sm text-gray-400">
                  Manage incoming and sent requests
                </p>
              </div>
            </Link>

            <Link
              to="/friends-management"
              className="flex items-center gap-4 p-4 hover:bg-base-300 transition-colors"
            >
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Manage Friends</h3>
                <p className="text-sm text-gray-400">
                  View, remove, or block friends
                </p>
              </div>
            </Link>
          </div>

          {/* Privacy Section */}
          <div className="bg-base-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-base-300">
              <h2 className="font-semibold flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                Privacy & Security
              </h2>
            </div>

            <Link
              to="/friends-management?tab=blocked"
              className="flex items-center gap-4 p-4 hover:bg-base-300 transition-colors border-b border-base-300"
            >
              <div className="bg-error/10 p-3 rounded-full">
                <Shield className="size-5 text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Blocked Users</h3>
                <p className="text-sm text-gray-400">
                  Manage blocked users list
                </p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-4 p-4 hover:bg-base-300 transition-colors"
            >
              <div className="bg-primary/10 p-3 rounded-full">
                <Lock className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Profile Settings</h3>
                <p className="text-sm text-gray-400">
                  Update your profile information
                </p>
              </div>
            </Link>
          </div>

          {/* Appearance Section */}
          <div className="bg-base-200 rounded-lg overflow-hidden">
            <div className="p-4">
              {authUser && (
                <>
                  <button
                    className="flex gap-2 items-center"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    <LogOut className="size-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
