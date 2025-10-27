import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    backgroundColor: {
      type: String,
      default: "#000000",
    },
    caption: {
      type: String,
    },
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

// Add index to prevent duplicate views - optional but recommended
statusSchema.index({ _id: 1, 'views.userId': 1 });

const Status = mongoose.model("Status", statusSchema);

export default Status;