import React, { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  RotateCcw, 
  Home, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  ArrowRight,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export interface StudentAnswerItem {
  questionIndex: number;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

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
    correctCount: number;
    wrongCount: number;
    totalQuestions: number;
    answers: StudentAnswerItem[];
  } | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [expandedAnswerIdx, setExpandedAnswerIdx] = useState<number | null>(null);

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
        const correctCount = event.data.correctCount;
        const wrongCount = event.data.wrongCount;
        const totalQ = event.data.totalQuestions;
        const answers = Array.isArray(event.data.answers) ? event.data.answers : [];
        const timeSpent = startTime > 0 ? Math.round((Date.now() - startTime) / 1000) : 0;

        await submitResult(rawScore, rawMax, timeSpent, correctCount, wrongCount, totalQ, answers);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [game, studentName, studentClass, startTime]);

  const submitResult = async (
    score: number, 
    maxScore: number, 
    timeSpent: number,
    correctCount?: number,
    wrongCount?: number,
    totalQuestions?: number,
    answers: StudentAnswerItem[] = []
  ) => {
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
          correctCount,
          wrongCount,
          totalQuestions,
          answers,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.submission) {
        const sub = data.submission;
        setFinalResult({
          score: sub.score,
          maxScore: sub.maxScore,
          accuracy: sub.accuracy,
          gradeLabel: sub.gradeLabel,
          correctCount: sub.correctCount ?? (answers.filter(a => a.isCorrect).length),
          wrongCount: sub.wrongCount ?? (answers.filter(a => !a.isCorrect).length),
          totalQuestions: sub.totalQuestions ?? (answers.length || 1),
          answers: sub.answers || answers,
        });
      } else {
        const acc = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
        const corr = correctCount ?? (answers.filter(a => a.isCorrect).length);
        const wr = wrongCount ?? (answers.filter(a => !a.isCorrect).length);
        setFinalResult({
          score,
          maxScore,
          accuracy: acc,
          gradeLabel: acc >= 80 ? "Xuất sắc 🌟" : acc >= 50 ? "Đạt 👍" : "Cần cố gắng 💪",
          correctCount: corr,
          wrongCount: wr,
          totalQuestions: totalQuestions ?? (answers.length || 1),
          answers,
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
        correctCount: answers.filter(a => a.isCorrect).length,
        wrongCount: answers.filter(a => !a.isCorrect).length,
        totalQuestions: answers.length || 1,
        answers,
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
      iframeRef.current.src = `/api/published-games/${game.id}/raw?t=${Date.now()}`;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-pink-50 to-indigo-50 flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center animate-bounce shadow-xl text-3xl mb-4">
          🎮
        </div>
        <h4 className="text-lg font-black text-slate-800">Đang chuẩn bị phòng học trò chơi...</h4>
        <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">
          Trường Tiểu học Lạc Long Quân • Mỗi tiết học là một niềm vui
        </p>
      </div>
    );
  }

  if (errorMsg || !game) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mb-4 shadow-sm">
          ⚠️
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Không tìm thấy bài tập</h3>
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
      <div className="fixed inset-0 bg-gradient-to-br from-amber-100 via-rose-100 to-indigo-100 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 text-center">
          {/* School Badge */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/assets/aistudio/Capture_ab0cddf9.PNG" 
              alt="Logo Trường Tiểu học Lạc Long Quân" 
              className="w-14 h-14 rounded-full object-contain bg-white shadow-lg ring-4 ring-amber-300 p-0.5"
            />
            <div className="text-left">
              <h4 className="text-xs font-black uppercase text-indigo-700 tracking-tight leading-tight">
                TRƯỜNG TIỂU HỌC LẠC LONG QUÂN
              </h4>
              <p className="text-[11px] font-black text-rose-500">Mỗi tiết học là một niềm vui 🎈</p>
            </div>
          </div>

          <div className="inline-block px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-white text-xs font-black font-mono shadow-sm mb-3">
            MÃ PHÒNG: {game.pinCode}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2">
            {game.title}
          </h2>
          <p className="text-xs text-slate-600 mb-6 font-medium">
            Em hãy nhập tên để bắt đầu chơi, trả lời các câu hỏi và nhận huy hiệu nhé! 🌟
          </p>

          <form onSubmit={handleStartPlay} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>👤 Họ và tên của em</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                autoFocus
                className="w-full p-3.5 rounded-2xl border-2 border-indigo-200 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 bg-amber-50/30"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider mb-1.5">
                🏫 Lớp học của em
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Ví dụ: 5A1"
                className="w-full p-3.5 rounded-2xl border-2 border-indigo-200 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-amber-50/30"
              />
            </div>

            <button
              type="submit"
              disabled={!studentName.trim()}
              className="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-xl shadow-rose-300/40 text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>VÀO CHƠI NGAY THÔI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <button
            type="button"
            onClick={onExit}
            className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Quay lại trang chính
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 3: Result & Completion Celebration Card (with wrong questions breakdown and hints!)
  if (isCompleted && finalResult) {
    const wrongAnswers = finalResult.answers.filter(a => !a.isCorrect);
    const correctAnswers = finalResult.answers.filter(a => a.isCorrect);

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-100 via-rose-100 to-indigo-100 flex flex-col items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-4 my-auto max-h-[95vh] overflow-y-auto">
          
          {/* Header Trophy & Badge */}
          <div className="text-center mb-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-white mx-auto flex items-center justify-center text-4xl shadow-xl shadow-amber-200 mb-3 animate-bounce">
              🏆
            </div>

            <span className="inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-2 shadow-xs">
              🎉 ĐÃ NỘP BÀI THÀNH CÔNG!
            </span>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              Chúc mừng em, {studentName}!
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Lớp: {studentClass || "Lạc Long Quân"} • Bài: {game.title}
            </p>
          </div>

          {/* Score & Summary Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-center shadow-md">
              <div className="text-[10px] font-black uppercase tracking-wider text-indigo-100">Điểm Số</div>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
                {finalResult.score} <span className="text-xs font-normal opacity-80">/ {finalResult.maxScore}</span>
              </div>
              <div className="text-[11px] font-bold mt-0.5 text-indigo-200">{finalResult.gradeLabel}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-center shadow-md">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Số Câu Đúng</div>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
                {finalResult.correctCount}
              </div>
              <div className="text-[11px] font-bold mt-0.5 text-emerald-100">✅ Rất tốt!</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white text-center shadow-md">
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-100">Số Câu Sai</div>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
                {finalResult.wrongCount}
              </div>
              <div className="text-[11px] font-bold mt-0.5 text-rose-100">
                {finalResult.wrongCount === 0 ? "🌟 Hoàn hảo!" : "Cần xem lại"}
              </div>
            </div>
          </div>

          {/* DETAILED QUESTION BREAKDOWN & HINTS (CHỈ RA CÂU SAI & GỢI Ý TRẢ LỜI) */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Chi Tiết Câu Hỏi & Gợi Ý Trả Lời</span>
              </h4>
              <span className="text-xs font-bold text-slate-500">
                Tổng cộng {finalResult.answers.length} câu
              </span>
            </div>

            {finalResult.answers.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Điểm số đã được ghi nhận vào hệ thống.
              </div>
            ) : (
              <div className="space-y-2.5">
                {finalResult.answers.map((item, idx) => {
                  const isWrong = !item.isCorrect;
                  const isExpanded = expandedAnswerIdx === idx || isWrong;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isWrong
                          ? "bg-rose-50/60 border-rose-200 shadow-xs"
                          : "bg-emerald-50/50 border-emerald-200"
                      }`}
                    >
                      <div 
                        className="flex items-start justify-between gap-2 cursor-pointer select-none"
                        onClick={() => setExpandedAnswerIdx(expandedAnswerIdx === idx ? null : idx)}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                              isWrong
                                ? "bg-rose-500 text-white"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            {item.questionIndex || idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-black text-slate-900 leading-snug">
                              {item.question || `Câu hỏi số ${idx + 1}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isWrong
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {isWrong ? "❌ Em làm sai" : "✅ Em làm đúng"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button className="text-slate-400 hover:text-slate-700 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                          {isWrong && item.studentAnswer && (
                            <div className="flex items-start gap-1.5 text-rose-700">
                              <span className="font-bold min-w-[90px] shrink-0">👉 Em đã chọn:</span>
                              <span className="font-medium bg-rose-100/80 px-2 py-0.5 rounded-lg line-through">
                                {item.studentAnswer}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-1.5 text-emerald-800">
                            <span className="font-bold min-w-[90px] shrink-0">🎯 Đáp án đúng:</span>
                            <span className="font-black bg-emerald-100/90 px-2 py-0.5 rounded-lg">
                              {item.correctAnswer || "Chính xác"}
                            </span>
                          </div>

                          {item.explanation && (
                            <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                              <div className="font-black flex items-center gap-1 text-[11px] uppercase tracking-wider mb-0.5 text-amber-800">
                                💡 Gợi ý trả lời & Giải thích:
                              </div>
                              <p className="text-xs font-medium leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 justify-center pt-2">
            <button
              onClick={handleRestart}
              className="flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại bài này</span>
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3.5 px-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Gameplay Screen (Direct, smooth, 100% playable)
  return (
    <div className="fixed inset-0 bg-[#f8fafc] flex flex-col z-50 overflow-hidden">
      {/* Top Student Header Bar */}
      <header className="h-14 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-md z-10">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/aistudio/Capture_ab0cddf9.PNG" 
            alt="Logo" 
            className="w-8 h-8 rounded-full object-contain bg-white shadow-xs p-0.5 ring-2 ring-white/50"
          />
          <div>
            <h5 className="text-xs sm:text-sm font-black line-clamp-1 drop-shadow-xs">
              {game.title}
            </h5>
            <div className="flex items-center gap-2 text-[10px] text-amber-100 font-bold">
              <span>👤 {studentName}</span>
              {studentClass && <span>• Lớp: {studentClass}</span>}
              <span className="hidden sm:inline font-mono">• PIN: {game.pinCode}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Allows student to finish and review anytime
              submitResult(100, 100, startTime > 0 ? Math.round((Date.now() - startTime) / 1000) : 0);
            }}
            className="text-[11px] font-black text-amber-900 bg-amber-300 hover:bg-amber-200 px-3.5 py-1.5 rounded-full transition-all shadow-sm cursor-pointer"
            title="Bấm khi hoàn thành trò chơi để xem điểm và gợi ý câu sai"
          >
            <span>Nộp bài & Xem kết quả ✓</span>
          </button>
          <button
            onClick={onExit}
            className="text-xs font-bold text-white/80 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/20 transition-colors"
            title="Thoát trò chơi"
          >
            Thoát
          </button>
        </div>
      </header>

      {/* Main Game IFrame - Loads directly via /raw with zero sandbox restrictions */}
      <main className="flex-1 w-full h-full bg-white relative">
        <iframe
          ref={iframeRef}
          src={`/api/published-games/${game.id}/raw`}
          className="w-full h-full border-none block"
          allow="fullscreen; autoplay; clipboard-write; cross-origin-isolated"
          title={game.title}
        />
      </main>
    </div>
  );
}
