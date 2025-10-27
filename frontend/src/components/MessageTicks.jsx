import { Check, CheckCheck } from "lucide-react";

const MessageTicks = ({ isRead, isOwnMessage }) => {
  // Only show ticks for messages sent by the user
  if (!isOwnMessage) return null;

  return (
    <span className="inline-flex items-center ml-1">
      {isRead ? (
        <CheckCheck className="w-4 h-4 text-blue-500" />
      ) : (
        <Check className="w-4 h-4 text-gray-400" />
      )}
    </span>
  );
};

export default MessageTicks;
