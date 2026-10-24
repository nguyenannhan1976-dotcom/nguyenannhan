import { useState } from "react";
import { Share2, Copy, Check, ExternalLink, X, Sparkles, CheckCircle2 } from "lucide-react";

export interface PublishedGameData {
  id: string;
  pinCode: string;
  title: string;
  className: string;
  createdAt: string;
}

export function PublishModal({
  htmlContent,
  initialTitle,
  initialClass,
  gameType,
  questionCount,
  onClose,
  onPublishedSuccess,
}: {
  htmlContent: string;
  initialTitle: string;
  initialClass: string;
  gameType: string;
  questionCount: number;
  onClose: () => void;
  onPublishedSuccess: (game: PublishedGameData) => void;
}) {
  const [title, setTitle] = useState(initialTitle || "Trò chơi học tập SGK");
  const [className, setClassName] = useState(initialClass || "Lớp 5A1");
  const [pinCode, setPinCode] = useState(
    "LLQ-" + Math.floor(1000 + Math.random() * 9000)
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedGame, setPublishedGame] = useState<PublishedGameData | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getPlayUrl = (gameId: string) => {
    const origin = window.location.origin;
    return `${origin}/?play=${gameId}`;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề bài tập / trò chơi");
      return;
    }

    try {
      setIsPublishing(true);
      setErrorMsg(null);

      const res = await fetch("/api/published-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          className: className.trim(),
          htmlContent,
          gameType,
          questionCount,
          pinCode: pinCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể xuất bản trò chơi");
      }

      setPublishedGame(data.game);
      onPublishedSuccess(data.game);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi xuất bản trò chơi");
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = async (text: string, isPin = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isPin) {
        setIsCopiedPin(true);
        setTimeout(() => setIsCopiedPin(false), 2000);
      } else {
        setIsCopiedLink(true);
        setTimeout(() => setIsCopiedLink(false), 2000);
      }
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-xs">
              🚀
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight uppercase">
                Xuất Bản Trò Chơi
              </h3>
              <p className="text-xs text-indigo-100 font-medium">
                Tạo link & mã PIN cho học sinh làm bài tập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!publishedGame ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên trò chơi / Bài học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập Toán 10 - Mệnh đề & Tập hợp"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lớp áp dụng
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="VD: Lớp 5A1, 10A..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã PIN bài tập
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold font-mono text-indigo-700 bg-indigo-50/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Quy trình cho học sinh:</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  1. Giáo viên gửi link hoặc mã PIN cho học sinh qua Zalo/Lớp học.
                  <br />
                  2. Học sinh chỉ cần nhập Họ tên & Lớp là có thể vào chơi ngay.
                  <br />
                  3. Khi hoàn thành, điểm số sẽ tự động lưu vào mục <strong>"Bảng Kết Quả Học Sinh"</strong> của giáo viên!
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-6 py-2.5 rounded-full text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-2"
                >
                  {isPublishing ? "Đang xuất bản..." : "Xác Nhận Xuất Bản ✨"}
                </button>
              </div>
            </>
          ) : (
            /* Published Success Screen */
            <div className="space-y-5 text-center py-2 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Đã Xuất Bản Thành Công! 🎉
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy gửi thông tin dưới đây cho học sinh để bắt đầu làm bài:
                </p>
              </div>

              {/* PIN Code Box */}
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl flex flex-col items-center justify-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mã PIN vào chơi nhanh
                </span>
                <span className="text-3xl font-black font-mono tracking-widest text-indigo-700">
                  {publishedGame.pinCode}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(publishedGame.pinCode, true)}
                  className="mt-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs cursor-pointer"
                >
                  {isCopiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedPin ? "Đã sao chép mã PIN" : "Sao chép mã PIN"}</span>
                </button>
              </div>

              {/* Direct Link Box */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Đường link trực tiếp cho học sinh:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPlayUrl(publishedGame.id)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(getPlayUrl(publishedGame.id), false)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                  >
                    {isCopiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                    <span>{isCopiedLink ? "Đã chép" : "Chép link"}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <a
                  href={getPlayUrl(publishedGame.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở giao diện Học sinh chơi thử ↗</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all cursor-pointer"
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
