import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createStatus,
  getAllStatuses,
  getUserStatuses,
  viewStatus,
  deleteStatus,
  getStatusViews,
} from "../controllers/status.controller.js";

const router = express.Router();

router.post("/", protectRoute, createStatus);
router.get("/", protectRoute, getAllStatuses);
router.get("/:userId", protectRoute, getUserStatuses);
router.get("/views/:statusId", protectRoute, getStatusViews); 
router.put("/view/:statusId", protectRoute, viewStatus);
router.delete("/:statusId", protectRoute, deleteStatus);

export default router;