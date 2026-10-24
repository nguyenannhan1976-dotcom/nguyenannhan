import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "../utils/cn";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="absolute top-20 right-8 z-50">
      <div 
        className={cn(
          "flex items-start gap-4 p-4 shadow-xl rounded-lg border-l-4 transition-all duration-300 bg-white",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
          type === "error" ? "border-red-500" : "border-emerald-500"
        )}
      >
        <div className={cn(
          "p-1 rounded-full shrink-0 mt-0.5",
          type === "error" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
        )}>
          {type === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </div>
        <div className="pr-4">
          <p className="text-sm font-bold text-slate-900">{type === "error" ? "Lỗi" : "Thành công!"}</p>
          <p className="text-xs text-slate-500 mt-0.5">{message}</p>
        </div>
        <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}
