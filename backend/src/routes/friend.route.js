import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  searchUserByEmail,
  sendFriendRequest,
  getFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.post("/search", protectRoute, searchUserByEmail);
router.post("/request", protectRoute, sendFriendRequest);
router.get("/requests", protectRoute, getFriendRequests);
router.get("/requests/sent", protectRoute, getSentFriendRequests);
router.put("/request/:requestId/accept", protectRoute, acceptFriendRequest);
router.delete("/request/:requestId/reject", protectRoute, rejectFriendRequest);
router.delete("/request/:requestId/cancel", protectRoute, cancelFriendRequest);
router.delete("/remove/:friendId", protectRoute, removeFriend);
router.post("/block/:userId", protectRoute, blockUser);
router.delete("/unblock/:userId", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);

export default router;