import { useState, useEffect } from "react";
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Search,
  BookOpen,
  Eye,
  CheckCircle2,
  XCircle,
  Lightbulb,
  AlertTriangle,
  CheckSquare,
  Square
} from "lucide-react";

export interface StudentAnswerItem {
  questionIndex: number;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentClass: string;
  score: number;
  maxScore: number;
  accuracy: number;
  gradeLabel: string;
  correctCount?: number;
  wrongCount?: number;
  totalQuestions?: number;
  answers?: StudentAnswerItem[];
  timeSpentSeconds?: number;
  submittedAt: string;
}

export interface PublishedGameSummary {
  id: string;
  pinCode: string;
  title: string;
  className: string;
  gameType?: string;
  questionCount?: number;
  createdAt: string;
  submissionsCount: number;
  averageScore: number;
  highestScore: number;
}

export function TeacherResultsModal({
  onClose,
  initialGameId,
}: {
  onClose: () => void;
  initialGameId?: string;
}) {
  const [games, setGames] = useState<PublishedGameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGameId || null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedGameDetails, setSelectedGameDetails] = useState<any>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected submissions for batch delete
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  // Detailed view of a single student submission
  const [viewingSubmission, setViewingSubmission] = useState<StudentSubmission | null>(null);

  // Custom Confirmation Modal state (never window.confirm!)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Xóa",
    onConfirm: () => {},
  });

  const fetchGamesList = async () => {
    try {
      setIsLoadingList(true);
      const res = await fetch("/api/published-games");
      const data = await res.json();
      if (res.ok && data.success) {
        setGames(data.games || []);
        if (!selectedGameId && data.games && data.games.length > 0) {
          setSelectedGameId(data.games[0].id);
        }
      }
    } catch (e: any) {
      setErrorMsg("Không thể tải danh sách bài tập đã xuất bản");
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchGameDetails = async (id: string) => {
    try {
      setIsLoadingDetails(true);
      const res = await fetch(`/api/published-games/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedGameDetails(data.game);
        setSubmissions(data.game.submissions || []);
        setSelectedSubIds([]);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchGamesList();
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      fetchGameDetails(selectedGameId);
    }
  }, [selectedGameId]);

  // Action: Delete entire published game
  const handleDeleteGame = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa bài tập này?",
      message: "Bạn có chắc chắn muốn xóa bài tập này cùng toàn bộ kết quả của học sinh? Thao tác này không thể hoàn tác.",
      confirmText: "Xóa vĩnh viễn",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/published-games/${id}`, { method: "DELETE" });
          if (res.ok) {
            const remaining = games.filter(g => g.id !== id);
            setGames(remaining);
            if (remaining.length > 0) {
              setSelectedGameId(remaining[0].id);
            } else {
              setSelectedGameId(null);
              setSelectedGameDetails(null);
              setSubmissions([]);
            }
          }
        } catch (e) {
          console.error(e);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Action: Delete ALL student submissions for the current game
  const handleDeleteAllSubmissions = () => {
    if (!selectedGameDetails || submissions.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: "Xóa TẤT CẢ kết quả học sinh?",
      message: `Bạn có chắc muốn xóa sạch toàn bộ ${submissions.length} bài làm của học sinh trong bài tập "${selectedGameDetails.title}"?`,
      confirmText: "Xác nhận xóa tất cả",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/published-games/${selectedGameDetails.id}/submissions`, {
            method: "DELETE",
          });
          if (res.ok) {
            setSubmissions([]);
            setSelectedSubIds([]);
            fetchGamesList(); // update counters
          }
        } catch (e) {
          console.error(e);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Action: Delete selected student submissions (custom batch delete)
  const handleDeleteSelectedSubmissions = () => {
    if (!selectedGameDetails || selectedSubIds.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: `Xóa ${selectedSubIds.length} kết quả đã chọn?`,
      message: `Bạn có chắc chắn muốn xóa ${selectedSubIds.length} bài làm học sinh đã được tích chọn?`,
      confirmText: `Xóa ${selectedSubIds.length} mục`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/published-games/${selectedGameDetails.id}/submissions/delete-batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subIds: selectedSubIds }),
          });
          if (res.ok) {
            const remaining = submissions.filter(s => !selectedSubIds.includes(s.id));
            setSubmissions(remaining);
            setSelectedSubIds([]);
            fetchGamesList();
          }
        } catch (e) {
          console.error(e);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Action: Delete individual student submission
  const handleDeleteSingleSubmission = (sub: StudentSubmission) => {
    if (!selectedGameDetails) return;

    setConfirmModal({
      isOpen: true,
      title: "Xóa kết quả của học sinh?",
      message: `Xóa bài làm của em "${sub.studentName}" (${sub.score}/${sub.maxScore}đ)?`,
      confirmText: "Xóa kết quả này",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/published-games/${selectedGameDetails.id}/submissions/${sub.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            const remaining = submissions.filter(s => s.id !== sub.id);
            setSubmissions(remaining);
            setSelectedSubIds(prev => prev.filter(id => id !== sub.id));
            fetchGamesList();
          }
        } catch (e) {
          console.error(e);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Selection toggle handlers
  const toggleSelectAll = () => {
    if (selectedSubIds.length === filteredSubmissions.length) {
      setSelectedSubIds([]);
    } else {
      setSelectedSubIds(filteredSubmissions.map(s => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedSubIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportCsv = () => {
    if (!submissions || submissions.length === 0 || !selectedGameDetails) return;

    const headers = [
      "STT",
      "Họ và tên học sinh",
      "Lớp",
      "Điểm số",
      "Điểm tối đa",
      "Số câu đúng",
      "Số câu sai",
      "Tỉ lệ đúng (%)",
      "Xếp loại",
      "Thời gian nộp bài",
    ];

    const rows = submissions.map((s, idx) => {
      const correctCount = s.correctCount ?? (s.answers ? s.answers.filter(a => a.isCorrect).length : 0);
      const wrongCount = s.wrongCount ?? (s.answers ? s.answers.filter(a => !a.isCorrect).length : 0);

      return [
        idx + 1,
        `"${s.studentName.replace(/"/g, '""')}"`,
        `"${(s.studentClass || selectedGameDetails.className || "").replace(/"/g, '""')}"`,
        s.score,
        s.maxScore,
        correctCount,
        wrongCount,
        `${s.accuracy}%`,
        `"${s.gradeLabel}"`,
        `"${new Date(s.submittedAt).toLocaleString("vi-VN")}"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanTitle = (selectedGameDetails.title || "Game")
      .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, "_")
      .substring(0, 40);
    a.download = `Bang_Diem_${cleanTitle}_${selectedGameDetails.pinCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSubmissions = submissions.filter((s) =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.studentClass && s.studentClass.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getPlayUrl = (gameId: string) => {
    return `${window.location.origin}/?play=${gameId}`;
  };

  const copyLink = async (gameId: string) => {
    try {
      await navigator.clipboard.writeText(getPlayUrl(gameId));
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    } catch (e) {}
  };

  const copyPin = async (pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      setIsCopiedPin(true);
      setTimeout(() => setIsCopiedPin(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[94vh] max-h-[860px] shadow-2xl border-4 border-amber-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        
        {/* Top Header - Radiant Colorful Primary School Gradient */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner ring-2 ring-white/40">
              📊
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black tracking-tight leading-tight uppercase flex items-center gap-2 drop-shadow-xs">
                <span>Bảng Kết Quả & Sổ Điểm Học Sinh</span>
                <span className="text-[10px] font-black uppercase bg-amber-300 text-amber-950 px-2.5 py-0.5 rounded-full shadow-xs">
                  TH Lạc Long Quân
                </span>
              </h3>
              <p className="text-xs text-amber-100 font-bold">
                Mỗi tiết học là một niềm vui • Theo dõi chi tiết câu đúng, câu sai và lời giải
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer ring-1 ring-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Layout: Left Sidebar (Games List) + Right Content (Results Table) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Published Games List */}
          <div className="w-full md:w-72 bg-gradient-to-b from-amber-50/40 via-slate-50 to-indigo-50/30 border-r border-slate-200 p-3 sm:p-4 flex flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                Bài tập đã tạo ({games.length})
              </span>
              <button
                onClick={fetchGamesList}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoadingList ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-medium">
                Đang tải danh sách bài tập...
              </div>
            ) : games.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-2 text-slate-400">
                <BookOpen className="w-8 h-8 opacity-40 text-indigo-400" />
                <p className="text-xs font-bold text-slate-600">Chưa có bài tập nào được xuất bản.</p>
                <p className="text-[11px] text-slate-500">
                  Bấm nút <strong>"Xuất Bản & Tạo Link 🚀"</strong> khi tạo game để giao cho học sinh!
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {games.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGameId(g.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedGameId === g.id
                        ? "bg-white border-amber-400 shadow-md ring-2 ring-amber-200"
                        : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-2xs">
                        PIN: {g.pinCode}
                      </span>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {g.submissionsCount} bài nộp
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">
                      {g.title}
                    </h5>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span>{g.className || "Toàn trường"}</span>
                      {g.submissionsCount > 0 && (
                        <span className="text-emerald-600">
                          ĐTB: {g.averageScore}đ
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {selectedGameDetails ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Game Info Bar & Controls */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 via-pink-50/30 to-indigo-50/40 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black font-mono px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs">
                          MÃ PIN: {selectedGameDetails.pinCode}
                        </span>
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                          {selectedGameDetails.className || "Toàn trường"}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-xl font-black text-slate-900 leading-tight">
                        {selectedGameDetails.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyPin(selectedGameDetails.pinCode)}
                        className="text-xs font-bold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        {isCopiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Chép PIN</span>
                      </button>
                      <button
                        onClick={() => copyLink(selectedGameDetails.id)}
                        className="text-xs font-bold text-slate-700 bg-white hover:bg-indigo-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Chép Link</span>
                      </button>
                      <a
                        href={getPlayUrl(selectedGameDetails.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Mở tab giao diện học sinh"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở chơi ↗</span>
                      </a>
                      <button
                        onClick={handleExportCsv}
                        disabled={submissions.length === 0}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất Excel</span>
                      </button>

                      {/* XÓA TẤT CẢ KẾT QUẢ CỦA HỌC SINH */}
                      <button
                        onClick={handleDeleteAllSubmissions}
                        disabled={submissions.length === 0}
                        className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Xóa tất cả kết quả nộp bài của học sinh trong trò chơi này"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Xóa tất cả kết quả</span>
                      </button>

                      <button
                        onClick={() => handleDeleteGame(selectedGameDetails.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                        title="Xóa hoàn toàn trò chơi này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Badges - Colorful and Vivid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl bg-white border-2 border-indigo-100 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">Đã nộp bài</div>
                        <div className="text-lg font-black text-indigo-950">{submissions.length} em</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border-2 border-emerald-100 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">Điểm TB</div>
                        <div className="text-lg font-black text-emerald-600">
                          {submissions.length > 0
                            ? Math.round(submissions.reduce((a, b) => a + (b.score || 0), 0) / submissions.length)
                            : 0}đ
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border-2 border-amber-100 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">Điểm cao nhất</div>
                        <div className="text-lg font-black text-amber-600">
                          {submissions.length > 0 ? Math.max(...submissions.map(s => s.score || 0)) : 0}đ
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border-2 border-rose-100 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        🌟
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">Tỉ lệ Đạt</div>
                        <div className="text-lg font-black text-rose-600">
                          {submissions.length > 0
                            ? Math.round((submissions.filter(s => s.accuracy >= 50).length / submissions.length) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submissions Action Bar & Search */}
                <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-50/70">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên học sinh, lớp..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-400 bg-white"
                      />
                    </div>
                  </div>

                  {/* BATCH DELETE SELECTION BUTTON (XÓA KẾT QUẢ TÙY CHỌN) */}
                  <div className="flex items-center gap-2">
                    {selectedSubIds.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedSubmissions}
                        className="text-xs font-black text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 animate-in fade-in transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa ({selectedSubIds.length}) kết quả đã chọn</span>
                      </button>
                    )}

                    <button
                      onClick={() => selectedGameId && fetchGameDetails(selectedGameId)}
                      className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Làm mới</span>
                    </button>
                  </div>
                </div>

                {/* Submissions Table with Single Delete and Question Review Buttons */}
                <div className="flex-1 overflow-y-auto">
                  {isLoadingDetails ? (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-bold">
                      Đang tải bảng điểm học sinh...
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 gap-2 text-slate-400">
                      <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-3xl shadow-inner">
                        📝
                      </div>
                      <p className="text-xs font-black text-slate-700">
                        {searchQuery ? "Không tìm thấy học sinh phù hợp" : "Chưa có học sinh nào nộp bài"}
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        Hãy gửi mã PIN hoặc đường link cho học sinh để các em tham gia làm bài nhé!
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gradient-to-r from-amber-50/80 via-pink-50/50 to-indigo-50/70 text-slate-600 uppercase tracking-wider font-black text-[10px] sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={filteredSubmissions.length > 0 && selectedSubIds.length === filteredSubmissions.length}
                              onChange={toggleSelectAll}
                              className="rounded cursor-pointer accent-indigo-600"
                              title="Chọn tất cả để xóa"
                            />
                          </th>
                          <th className="py-2.5 px-2 w-10">STT</th>
                          <th className="py-2.5 px-3">Học sinh</th>
                          <th className="py-2.5 px-3">Lớp</th>
                          <th className="py-2.5 px-3 text-center">Điểm số</th>
                          <th className="py-2.5 px-3 text-center">Đúng / Sai</th>
                          <th className="py-2.5 px-3 text-center">Tỉ lệ</th>
                          <th className="py-2.5 px-3 text-center">Xếp loại</th>
                          <th className="py-2.5 px-3 text-center">Chi tiết</th>
                          <th className="py-2.5 px-3 text-right">Thời gian</th>
                          <th className="py-2.5 px-3 text-center w-12">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {filteredSubmissions.map((sub, index) => {
                          const isSelected = selectedSubIds.includes(sub.id);
                          const correctCount = sub.correctCount ?? (sub.answers ? sub.answers.filter(a => a.isCorrect).length : 0);
                          const wrongCount = sub.wrongCount ?? (sub.answers ? sub.answers.filter(a => !a.isCorrect).length : 0);

                          return (
                            <tr 
                              key={sub.id} 
                              className={`hover:bg-amber-50/40 transition-colors ${
                                isSelected ? "bg-indigo-50/50" : ""
                              }`}
                            >
                              {/* Checkbox for custom selection delete */}
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectRow(sub.id)}
                                  className="rounded cursor-pointer accent-indigo-600"
                                />
                              </td>
                              <td className="py-3 px-2 font-mono text-slate-400 text-[11px]">{index + 1}</td>
                              <td className="py-3 px-3 font-black text-slate-900">{sub.studentName}</td>
                              <td className="py-3 px-3 text-slate-500 font-bold">{sub.studentClass || "—"}</td>
                              <td className="py-3 px-3 text-center font-black font-mono text-indigo-700 text-sm">
                                {sub.score}/{sub.maxScore}
                              </td>
                              
                              {/* Đúng / Sai badges */}
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center gap-1 font-bold text-[11px]">
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                    {correctCount} đúng
                                  </span>
                                  {wrongCount > 0 ? (
                                    <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                                      {wrongCount} sai
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">0 sai</span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${
                                    sub.accuracy >= 80
                                      ? "bg-emerald-100 text-emerald-800"
                                      : sub.accuracy >= 50
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {sub.accuracy}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-xs">{sub.gradeLabel}</td>
                              
                              {/* XEM CHI TIẾT CÂU SAI & GỢI Ý */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => setViewingSubmission(sub)}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="Xem học sinh sai câu nào, đáp án đúng và gợi ý"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem bài</span>
                                </button>
                              </td>

                              <td className="py-3 px-3 text-right text-slate-400 text-[11px] font-medium">
                                {new Date(sub.submittedAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(sub.submittedAt).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </td>

                              {/* XÓA 1 KẾT QUẢ TÙY CHỌN */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteSingleSubmission(sub)}
                                  className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={`Xóa bài làm của ${sub.studentName}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center gap-3">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl">
                  👈
                </div>
                <h5 className="font-bold text-slate-700 text-sm">Chọn một trò chơi từ danh sách bên trái</h5>
                <p className="text-xs text-slate-400 max-w-sm">
                  Hoặc bấm "Xuất Bản & Tạo Link" khi tạo game mới để tạo đường link bài tập cho học sinh.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL 1: VIEWING STUDENT DETAILED SUBMISSION (CÂU SAI & GỢI Ý TRẢ LỜI) */}
        {viewingSubmission && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl border-4 border-amber-300 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center text-xl shadow-xs">
                    📝
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base leading-tight">
                      Bài làm của: {viewingSubmission.studentName}
                    </h4>
                    <p className="text-xs text-slate-500 font-bold">
                      Lớp: {viewingSubmission.studentClass || "Lạc Long Quân"} • Điểm: {viewingSubmission.score}/{viewingSubmission.maxScore}đ ({viewingSubmission.accuracy}%)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Answers Breakdown List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {(!viewingSubmission.answers || viewingSubmission.answers.length === 0) ? (
                  <div className="text-center p-6 text-xs text-slate-400">
                    Bài làm này được nộp với điểm số tổng kết {viewingSubmission.score}/{viewingSubmission.maxScore}đ.
                  </div>
                ) : (
                  viewingSubmission.answers.map((item, idx) => {
                    const isWrong = !item.isCorrect;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border ${
                          isWrong ? "bg-rose-50/70 border-rose-200" : "bg-emerald-50/60 border-emerald-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                              isWrong ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                            }`}
                          >
                            {item.questionIndex || idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-900 leading-snug">
                              {item.question || `Câu hỏi số ${idx + 1}`}
                            </p>
                            <span
                              className={`inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isWrong ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isWrong ? "❌ Học sinh làm sai" : "✅ Học sinh làm đúng"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs pl-8">
                          {isWrong && item.studentAnswer && (
                            <div className="flex items-start gap-1.5 text-rose-700">
                              <span className="font-bold min-w-[90px] shrink-0">Học sinh chọn:</span>
                              <span className="font-medium bg-rose-100 px-2 py-0.5 rounded line-through">
                                {item.studentAnswer}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-1.5 text-emerald-800">
                            <span className="font-bold min-w-[90px] shrink-0">Đáp án đúng:</span>
                            <span className="font-black bg-emerald-100 px-2 py-0.5 rounded">
                              {item.correctAnswer || "Chính xác"}
                            </span>
                          </div>

                          {item.explanation && (
                            <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                              <div className="font-black flex items-center gap-1 text-[10px] uppercase text-amber-800 mb-0.5">
                                <Lightbulb className="w-3 h-3 text-amber-600" />
                                Gợi ý & Giải thích:
                              </div>
                              <p className="text-[11px] leading-relaxed">{item.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: CUSTOM CONFIRMATION MODAL (Strictly NO window.confirm!) */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-rose-300 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-3xl shadow-xs">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 cursor-pointer"
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
