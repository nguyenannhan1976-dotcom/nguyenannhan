import { useState, useEffect, useRef } from "react";
import { Gamepad2, Trophy, RotateCcw, Home, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export function StudentPlayer({
  gameId,
  pinCode,
  onExit,
}: {
  gameId?: string;
  pinCode?: string;
  onExit: () => void;
}) {
  const [game, setGame] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Info Form
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  // Result state
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    maxScore: number;
    accuracy: number;
    gradeLabel: string;
  } | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch Game by ID or PIN
  useEffect(() => {
    const fetchGame = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        let url = "";
        if (gameId) {
          url = `/api/published-games/${gameId}`;
        } else if (pinCode) {
          url = `/api/published-games/by-pin/${pinCode}`;
        } else {
          throw new Error("Không có thông tin mã bài tập");
        }

        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || !data.success || !data.game) {
          throw new Error(data.error || "Không tìm thấy trò chơi bài tập này.");
        }

        setGame(data.game);
        if (data.game.className) {
          setStudentClass(data.game.className);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Không thể tải bài tập");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGame();
  }, [gameId, pinCode]);

  // Listen for game completion event from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === "GAME_COMPLETE") {
        const rawScore = Number(event.data.score) || 0;
        const rawMax = Number(event.data.maxScore) || 100;
        const timeSpent = startTime > 0 ? Math.round((Date.now() - startTime) / 1000) : 0;

        await submitResult(rawScore, rawMax, timeSpent);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [game, studentName, studentClass, startTime]);

  const submitResult = async (score: number, maxScore: number, timeSpent: number) => {
    if (!game) return;

    try {
      const res = await fetch(`/api/published-games/${game.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim() || "Học sinh Lạc Long Quân",
          studentClass: studentClass.trim() || game.className || "",
          score,
          maxScore,
          timeSpentSeconds: timeSpent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.submission) {
        setFinalResult({
          score: data.submission.score,
          maxScore: data.submission.maxScore,
          accuracy: data.submission.accuracy,
          gradeLabel: data.submission.gradeLabel,
        });
      } else {
        const acc = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
        setFinalResult({
          score,
          maxScore,
          accuracy: acc,
          gradeLabel: acc >= 80 ? "Xuất sắc 🌟" : acc >= 50 ? "Đạt 👍" : "Cần cố gắng 💪",
        });
      }
      setIsCompleted(true);
    } catch (e) {
      console.error("Submit error", e);
      const acc = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
      setFinalResult({
        score,
        maxScore,
        accuracy: acc,
        gradeLabel: acc >= 80 ? "Xuất sắc 🌟" : acc >= 50 ? "Đạt 👍" : "Cần cố gắng 💪",
      });
      setIsCompleted(true);
    }
  };

  const handleStartPlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    setHasStarted(true);
    setStartTime(Date.now());
  };

  const handleRestart = () => {
    setIsCompleted(false);
    setFinalResult(null);
    setStartTime(Date.now());
    // Reload iframe
    if (iframeRef.current && game) {
      iframeRef.current.srcdoc = game.htmlContent;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-bounce shadow-lg text-2xl mb-4">
          🎮
        </div>
        <h4 className="text-base font-bold text-slate-800">Đang chuẩn bị phòng học trò chơi...</h4>
        <p className="text-xs text-slate-400 mt-1">Trường Tiểu học Lạc Long Quân</p>
      </div>
    );
  }

  if (errorMsg || !game) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mb-4 shadow-xs">
          ⚠️
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">Không tìm thấy bài tập</h3>
        <p className="text-xs text-slate-600 max-w-sm mb-6">{errorMsg || "Mã bài tập hoặc đường link không chính xác."}</p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 rounded-full font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
        >
          Quay lại trang chính
        </button>
      </div>
    );
  }

  // SCREEN 1: Student Login / Input Name
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 text-center">
          {/* School Badge */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/assets/aistudio/Capture_ab0cddf9.PNG" 
              alt="Logo Trường Tiểu học Lạc Long Quân" 
              className="w-12 h-12 rounded-full object-contain bg-white shadow-md ring-2 ring-indigo-200 p-0.5"
            />
            <div className="text-left">
              <h4 className="text-xs font-black uppercase text-indigo-700 tracking-tight leading-tight">
                TRƯỜNG TIỂU HỌC LẠC LONG QUÂN
              </h4>
              <p className="text-[11px] font-bold text-slate-500">Mỗi tiết học là một niềm vui</p>
            </div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-black text-indigo-700 font-mono mb-3">
            MÃ PHÒNG: {game.pinCode}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2">
            {game.title}
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            Em hãy nhập tên để bắt đầu làm bài và lưu điểm số vào sổ học tập nhé!
          </p>

          <form onSubmit={handleStartPlay} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Họ và tên của em <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                autoFocus
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lớp học của em
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Ví dụ: 5A1"
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!studentName.trim()}
              className="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-xl shadow-purple-300/40 text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>VÀO CHƠI NGAY</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <button
            type="button"
            onClick={onExit}
            className="mt-6 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Quay lại trang chính
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 3: Result & Completion Celebration Card
  if (isCompleted && finalResult) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-4xl shadow-md mb-3 animate-bounce">
            🏆
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            Đã nộp bài thành công!
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Chúc mừng em, {studentName}!
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1 mb-5">
            Lớp {studentClass || "Lạc Long Quân"} • {game.title}
          </p>

          {/* Score Display Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white shadow-xl shadow-purple-300/30 mb-5">
            <div className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-1">
              Điểm Số Đạt Được
            </div>
            <div className="text-4xl font-black tracking-tight font-mono mb-2">
              {finalResult.score} <span className="text-xl text-indigo-200 font-normal">/ {finalResult.maxScore}</span>
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black">
              Đạt {finalResult.accuracy}% • {finalResult.gradeLabel}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mb-6">
            🎉 Kết quả học tập của em đã được ghi nhận tự động vào sổ điểm của giáo viên Trường Tiểu học Lạc Long Quân.
          </p>

          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại bài này</span>
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Gameplay Screen
  return (
    <div className="fixed inset-0 bg-[#f8fafc] flex flex-col z-50 overflow-hidden">
      {/* Top Student Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/aistudio/Capture_ab0cddf9.PNG" 
            alt="Logo" 
            className="w-8 h-8 rounded-full object-contain bg-white shadow-xs p-0.5"
          />
          <div>
            <h5 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
              {game.title}
            </h5>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
              <span className="text-indigo-600 font-bold">Học sinh: {studentName}</span>
              {studentClass && <span>• Lớp: {studentClass}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Allows student to finish early if needed
              submitResult(100, 100, startTime > 0 ? Math.round((Date.now() - startTime) / 1000) : 0);
            }}
            className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full transition-all shadow-2xs cursor-pointer"
            title="Bấm khi hoàn thành trò chơi nếu hệ thống chưa tự nộp"
          >
            <span>Nộp bài & Kết thúc ✓</span>
          </button>
          <button
            onClick={onExit}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100"
            title="Thoát trò chơi"
          >
            Thoát
          </button>
        </div>
      </header>

      {/* Main Game IFrame */}
      <main className="flex-1 w-full h-full bg-white relative">
        <iframe
          ref={iframeRef}
          srcDoc={game.htmlContent}
          className="w-full h-full border-none block"
          allow="fullscreen; autoplay; clipboard-write; cross-origin-isolated"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          title={game.title}
        />
      </main>
    </div>
  );
}
