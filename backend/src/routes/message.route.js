import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage, 
  markMessagesAsRead,
  getUnreadCounts,
  deleteMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages
} from "../controllers/message.controller.js";

const router = express.Router();

// IMPORTANT: Put specific routes BEFORE parameterized routes
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/unread-counts", protectRoute, getUnreadCounts);
router.put("/read/:id", protectRoute, markMessagesAsRead);

// Pin/Unpin routes
router.post("/pin/:id", protectRoute, pinMessage);
router.delete("/pin/:id", protectRoute, unpinMessage);
router.get("/pinned/:userId", protectRoute, getPinnedMessages);

// Delete message route
router.delete("/:id", protectRoute, deleteMessage);

// Parameterized routes come last
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

export default router;