import mongoose from "mongoose";

const pinnedMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    chatUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
pinnedMessageSchema.index({ messageId: 1 });
pinnedMessageSchema.index({ chatUsers: 1 });

const PinnedMessage = mongoose.model("PinnedMessage", pinnedMessageSchema);

export default PinnedMessage;