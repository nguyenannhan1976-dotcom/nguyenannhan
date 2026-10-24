import { Loader2 } from "lucide-react";

export function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 animate-pulse" />
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 relative z-10" />
      </div>
      <p className="text-slate-600 font-bold text-lg animate-pulse">{text}</p>
    </div>
  );
}
