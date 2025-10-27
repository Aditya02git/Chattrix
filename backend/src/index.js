import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import statusRoutes from "./routes/status.route.js"; // Add this
import friendRoutes from "./routes/friend.route.js";

import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;

app.use(express.json({ limit: "50mb" })); // Increase limit for video uploads
app.use(cookieParser());
app.use(
  cors({
    origin: "https://chattrix-app-g8al.onrender.com",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/status", statusRoutes); // Add this
app.use("/api/friends", friendRoutes);

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
