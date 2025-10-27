import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import PinnedMessage from "../models/pinnedMessage.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get current user with friends list
    const currentUser = await User.findById(loggedInUserId).select(
      "friends blockedUsers"
    );

    // Only get users who are friends and not blocked
    const filteredUsers = await User.find({
      _id: {
        $in: currentUser.friends,
        $nin: currentUser.blockedUsers,
      },
    }).select("-password");

    // Get last message for each user
    const usersWithLastMessage = await Promise.all(
      filteredUsers.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean();

        return {
          ...user.toObject(),
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                image: lastMessage.image,
                video: lastMessage.video,
                audio: lastMessage.audio,
                document: lastMessage.document,
                documentName: lastMessage.documentName,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
                isRead: lastMessage.isRead || false,
              }
            : null,
        };
      })
    );

    // Sort users by last message time
    usersWithLastMessage.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || new Date(0);
      const timeB = b.lastMessage?.createdAt || new Date(0);
      return new Date(timeB) - new Date(timeA);
    });

    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, video, audio, document, documentName, replyTo } =
      req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log("Received message data:", {
      hasText: !!text,
      hasImage: !!image,
      hasVideo: !!video,
      hasAudio: !!audio,
      hasDocument: !!document,
      documentName,
      hasReplyTo: !!replyTo,
    });

    let imageUrl, videoUrl, audioUrl, documentUrl;

    // Upload image to cloudinary
    if (image) {
      console.log("Uploading image...");
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      console.log("Image uploaded:", imageUrl);
    }

    // Upload video to cloudinary
    if (video) {
      console.log("Uploading video...");
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
        folder: "chat_videos",
      });
      videoUrl = uploadResponse.secure_url;
      console.log("Video uploaded:", videoUrl);
    }

    // Upload audio to cloudinary
    if (audio) {
      console.log("Uploading audio...");

      try {
        const uploadResponse = await cloudinary.uploader.upload(audio, {
          resource_type: "raw", // ✅ Change from "audio" to "raw"
          folder: "chat_audios",
          format: "mp3", // or detect from file
          allowed_formats: ["mp3", "wav", "ogg", "m4a", "aac", "webm"], // ✅ Add allowed formats
        });
        audioUrl = uploadResponse.secure_url;
        console.log("Audio uploaded:", audioUrl);
      } catch (uploadError) {
        console.error("Audio upload error:", uploadError);
        throw new Error(`Audio upload failed: ${uploadError.message}`);
      }
    }

    // Upload document to cloudinary
    if (document) {
      console.log("Uploading document...");
      const uploadResponse = await cloudinary.uploader.upload(document, {
        resource_type: "raw",
        folder: "chat_documents",
      });
      documentUrl = uploadResponse.secure_url;
      console.log("Document uploaded:", documentUrl);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
      document: documentUrl,
      documentName: documentName,
      replyTo: replyTo || null,
      isRead: false,
    });

    await newMessage.save();
    console.log("Message saved:", newMessage);

    // Real time functionality socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message for everyone
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only the sender can delete for everyone
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    // Delete from cloudinary if it has media
    if (message.image) {
      const publicId = message.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    if (message.video) {
      const publicId = message.video
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    }
    if (message.audio) {
      const publicId = message.audio
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: "audio" });
    }
    if (message.document) {
      const publicId = message.document
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    }

    await Message.findByIdAndDelete(id);

    // Also delete pinned message if exists
    await PinnedMessage.deleteMany({ messageId: id });

    // Emit socket event to both users
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin message
export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { chatUserId } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if already pinned
    const existingPin = await PinnedMessage.findOne({
      messageId: id,
      chatUsers: { $all: [req.user._id, chatUserId] },
    });

    if (existingPin) {
      return res.status(400).json({ error: "Message already pinned" });
    }

    // Create pinned message
    const pinnedMessage = await PinnedMessage.create({
      messageId: id,
      chatUsers: [req.user._id, chatUserId],
      pinnedBy: req.user._id,
    });

    // Emit socket event
    const receiverSocketId = getReceiverSocketId(chatUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagePinned", { messageId: id, message });
    }

    res.status(200).json(pinnedMessage);
  } catch (error) {
    console.log("Error in pinMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unpin message
export const unpinMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const pinnedMessage = await PinnedMessage.findOne({ messageId: id });

    if (!pinnedMessage) {
      return res.status(404).json({ error: "Pinned message not found" });
    }

    await PinnedMessage.findOneAndDelete({ messageId: id });

    // Emit socket event to the other user
    const message = await Message.findById(id);
    if (message) {
      const otherUserId =
        message.senderId.toString() === req.user._id.toString()
          ? message.receiverId
          : message.senderId;

      const receiverSocketId = getReceiverSocketId(otherUserId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageUnpinned", { messageId: id });
      }
    }

    res.status(200).json({ message: "Message unpinned successfully" });
  } catch (error) {
    console.log("Error in unpinMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pinned messages
export const getPinnedMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const pinnedMessages = await PinnedMessage.find({
      chatUsers: { $all: [myId, userId] },
    }).populate("messageId");

    const messages = pinnedMessages
      .filter((pm) => pm.messageId) // Filter out any null messageIds
      .map((pm) => pm.messageId);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getPinnedMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    // Update all unread messages from this sender
    const result = await Message.updateMany(
      {
        senderId: senderId,
        receiverId: receiverId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Notify the sender that messages were read via Socket.IO
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        readBy: receiverId,
        senderId: senderId,
      });
    }

    res
      .status(200)
      .json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get unread message counts
export const getUnreadCounts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get unread message counts grouped by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: loggedInUserId,
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to a more friendly format
    const countsMap = {};
    unreadCounts.forEach((item) => {
      countsMap[item._id.toString()] = item.count;
    });

    res.status(200).json(countsMap);
  } catch (error) {
    console.error("Error in getUnreadCounts: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
