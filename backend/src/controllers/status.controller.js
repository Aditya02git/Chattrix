import Status from "../models/status.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

// Create a new status
export const createStatus = async (req, res) => {
  try {
    const { type, content, backgroundColor, caption } = req.body;
    const userId = req.user._id;

    let mediaUrl;
    if (type === "image" || type === "video") {
      // Upload media to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(content, {
        resource_type: type === "video" ? "video" : "image",
        folder: "status",
      });
      mediaUrl = uploadResponse.secure_url;
    }

    // Status expires after 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newStatus = new Status({
      userId,
      type,
      content: type === "text" ? content : mediaUrl,
      backgroundColor: type === "text" ? backgroundColor : undefined,
      caption: type !== "text" ? caption : undefined,
      expiresAt,
    });

    await newStatus.save();

    // Populate user info
    await newStatus.populate("userId", "fullName profilePic");

    // Emit to all connected users
    io.emit("newStatus", newStatus);

    res.status(201).json(newStatus);
  } catch (error) {
    console.error("Error in createStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update status.controller.js

export const getAllStatuses = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentTime = new Date();

    const currentUser = await User.findById(currentUserId).select(
      "friends blockedUsers"
    );
    const allowedUserIds = [...currentUser.friends, currentUserId];

    const statuses = await Status.find({
      expiresAt: { $gt: currentTime },
      userId: {
        $in: allowedUserIds,
        $nin: currentUser.blockedUsers,
      },
    })
      .populate("userId", "fullName profilePic")
      .populate("views.userId", "fullName profilePic") // Add this line
      .sort({ createdAt: -1 });

    // Rest of the code remains the same
    const groupedStatuses = statuses.reduce((acc, status) => {
      const userId = status.userId._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: status.userId,
          statuses: [],
        };
      }
      acc[userId].statuses.push(status);
      return acc;
    }, {});

    const statusArray = Object.values(groupedStatuses).sort((a, b) => {
      const latestA = new Date(a.statuses[0].createdAt);
      const latestB = new Date(b.statuses[0].createdAt);
      return latestB - latestA;
    });

    res.status(200).json(statusArray);
  } catch (error) {
    console.error("Error in getAllStatuses:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserStatuses = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const currentTime = new Date();

    if (userId !== currentUserId.toString()) {
      const currentUser = await User.findById(currentUserId).select(
        "friends blockedUsers"
      );

      if (
        !currentUser.friends.includes(userId) ||
        currentUser.blockedUsers.includes(userId)
      ) {
        return res
          .status(403)
          .json({ error: "Cannot view this user's status" });
      }
    }

    const statuses = await Status.find({
      userId,
      expiresAt: { $gt: currentTime },
    })
      .populate("userId", "fullName profilePic")
      .populate("views.userId", "fullName profilePic") // Add this line
      .sort({ createdAt: 1 });

    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error in getUserStatuses:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark status as viewed
export const viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const viewerId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    // Check if user already viewed this status - FIXED COMPARISON
    const alreadyViewed = status.views.some(
      (view) => view.userId.toString() === viewerId.toString()
    );

    if (!alreadyViewed) {
      status.views.push({
        userId: viewerId,
        viewedAt: new Date(),
      });
      await status.save();

      // Populate the newly added view before emitting
      await status.populate("views.userId", "fullName profilePic");

      // Notify status owner about the view
      io.emit("statusViewed", {
        statusId,
        viewerId,
        statusOwnerId: status.userId,
        view: status.views[status.views.length - 1], // Send the populated view
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in viewStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a status
export const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findOne({ _id: statusId, userId });

    if (!status) {
      return res
        .status(404)
        .json({ error: "Status not found or unauthorized" });
    }

    await Status.findByIdAndDelete(statusId);

    // Emit to all users
    io.emit("statusDeleted", statusId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add this new function to get status views
export const getStatusViews = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId).populate(
      "views.userId",
      "fullName profilePic"
    );

    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    // Check if user is authorized to view this (must be status owner)
    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.status(200).json(status.views);
  } catch (error) {
    console.error("Error in getStatusViews:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add this as a temporary cleanup endpoint in status.controller.js
export const cleanupDuplicateViews = async (req, res) => {
  try {
    const statuses = await Status.find({});

    for (const status of statuses) {
      // Remove duplicate views
      const uniqueViews = [];
      const seenUserIds = new Set();

      for (const view of status.views) {
        const userIdStr = view.userId.toString();
        if (!seenUserIds.has(userIdStr)) {
          seenUserIds.add(userIdStr);
          uniqueViews.push(view);
        }
      }

      if (uniqueViews.length !== status.views.length) {
        status.views = uniqueViews;
        await status.save();
      }
    }

    res.status(200).json({ message: "Cleanup completed" });
  } catch (error) {
    console.error("Error in cleanup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
