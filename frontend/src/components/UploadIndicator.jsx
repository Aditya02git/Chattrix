import { Loader2, Upload } from "lucide-react";

const UploadIndicator = ({ fileName, fileType }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg border border-base-300 animate-pulse">
      <div className="bg-primary/10 p-2 rounded-full">
        <Upload className="size-5 text-primary animate-bounce" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Uploading {fileType}...</p>
        <p className="text-xs text-gray-400 truncate">
          {fileName || "Please wait"}
        </p>
      </div>
      <Loader2 className="size-5 text-primary animate-spin" />
    </div>
  );
};

export default UploadIndicator;
