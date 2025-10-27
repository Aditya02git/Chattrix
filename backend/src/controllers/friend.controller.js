import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Search user by email
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const currentUserId = req.user._id;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email (excluding current user)
    const user = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: currentUserId },
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already friends
    const currentUser = await User.findById(currentUserId);
    const isAlreadyFriend = currentUser.friends.includes(user._id);

    // Check if blocked
    const isBlocked =
      currentUser.blockedUsers.includes(user._id) ||
      user.blockedUsers.includes(currentUserId);

    // Check existing friend request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: user._id },
        { sender: user._id, receiver: currentUserId },
      ],
    });

    res.status(200).json({
      user,
      isAlreadyFriend,
      isBlocked,
      friendRequest: existingRequest,
    });
  } catch (error) {
    console.error("Error in searchUserByEmail:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already friends
    const sender = await User.findById(senderId);
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Check if blocked
    if (
      sender.blockedUsers.includes(receiverId) ||
      receiver.blockedUsers.includes(senderId)
    ) {
      return res.status(400).json({ error: "Cannot send friend request" });
    }

    // Check for existing request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already exists" });
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    await friendRequest.save();

    // Populate sender info for notification
    await friendRequest.populate("sender", "fullName email profilePic");

    // Send real-time notification
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendRequest", friendRequest);
    }

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all friend requests (received)
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendRequests = await FriendRequest.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "fullName email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(friendRequests);
  } catch (error) {
    console.error("Error in getFriendRequests:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get sent friend requests
export const getSentFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const sentRequests = await FriendRequest.find({
      sender: userId,
      status: "pending",
    })
      .populate("receiver", "fullName email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(sentRequests);
  } catch (error) {
    console.error("Error in getSentFriendRequests:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (friendRequest.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (friendRequest.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Friend request already processed" });
    }

    // Update request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add to friends list for both users
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.receiver },
    });

    await User.findByIdAndUpdate(friendRequest.receiver, {
      $addToSet: { friends: friendRequest.sender },
    });

    // Notify sender
    const senderSocketId = getReceiverSocketId(friendRequest.sender);
    if (senderSocketId) {
      io.to(senderSocketId).emit("friendRequestAccepted", {
        userId: friendRequest.receiver,
      });
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (friendRequest.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete the request
    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cancel sent friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (friendRequest.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Friend request cancelled" });
  } catch (error) {
    console.error("Error in cancelFriendRequest:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    // Delete any existing friend requests
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    });

    // Notify friend
    const friendSocketId = getReceiverSocketId(friendId);
    if (friendSocketId) {
      io.to(friendSocketId).emit("friendRemoved", { userId });
    }

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error in removeFriend:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Block user
export const blockUser = async (req, res) => {
  try {
    const { userId: userToBlock } = req.params;
    const currentUserId = req.user._id;

    // Add to blocked list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userToBlock },
      $pull: { friends: userToBlock },
    });

    // Remove from friend's list
    await User.findByIdAndUpdate(userToBlock, {
      $pull: { friends: currentUserId },
    });

    // Delete any friend requests
    await FriendRequest.deleteMany({
      $or: [
        { sender: currentUserId, receiver: userToBlock },
        { sender: userToBlock, receiver: currentUserId },
      ],
    });

    // Notify blocked user
    const blockedUserSocketId = getReceiverSocketId(userToBlock);
    if (blockedUserSocketId) {
      io.to(blockedUserSocketId).emit("userBlocked", { userId: currentUserId });
    }

    res.status(200).json({ message: "User blocked" });
  } catch (error) {
    console.error("Error in blockUser:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const { userId: userToUnblock } = req.params;
    const currentUserId = req.user._id;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userToUnblock },
    });

    res.status(200).json({ message: "User unblocked" });
  } catch (error) {
    console.error("Error in unblockUser:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate("blockedUsers", "fullName email profilePic")
      .select("blockedUsers");

    res.status(200).json(user.blockedUsers);
  } catch (error) {
    console.error("Error in getBlockedUsers:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
