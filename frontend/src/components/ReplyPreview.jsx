import { X, Image, Video, FileText } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const ReplyPreview = () => {
  const { replyMessage, clearReplyMessage } = useChatStore();

  if (!replyMessage) return null;

  const getPreviewContent = () => {
    if (replyMessage.image) {
      return (
        <div className="flex items-center gap-2">
          <Image className="size-4" />
          <span>Photo</span>
        </div>
      );
    }
    if (replyMessage.video) {
      return (
        <div className="flex items-center gap-2">
          <Video className="size-4" />
          <span>Video</span>
        </div>
      );
    }
    if (replyMessage.document) {
      return (
        <div className="flex items-center gap-2">
          <FileText className="size-4" />
          <span>{replyMessage.documentName || "Document"}</span>
        </div>
      );
    }
    return replyMessage.text;
  };

  return (
    <div className="px-4 py-2 bg-base-200 border-l-4 border-primary">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-primary mb-1">
            {replyMessage.senderName}
          </div>
          <div className="text-sm opacity-70 truncate">
            {getPreviewContent()}
          </div>
        </div>
        <button
          onClick={clearReplyMessage}
          className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview;
