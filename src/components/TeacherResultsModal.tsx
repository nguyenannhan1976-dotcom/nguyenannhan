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
  BookOpen
} from "lucide-react";

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentClass: string;
  score: number;
  maxScore: number;
  accuracy: number;
  gradeLabel: string;
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

  const handleDeleteGame = async (id: string) => {
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
  };

  const handleExportCsv = () => {
    if (!submissions || submissions.length === 0 || !selectedGameDetails) return;

    const headers = [
      "STT",
      "Họ và tên học sinh",
      "Lớp",
      "Điểm số",
      "Điểm tối đa",
      "Tỉ lệ đúng (%)",
      "Xếp loại",
      "Thời gian nộp bài",
    ];

    const rows = submissions.map((s, idx) => [
      idx + 1,
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${(s.studentClass || selectedGameDetails.className || "").replace(/"/g, '""')}"`,
      s.score,
      s.maxScore,
      `${s.accuracy}%`,
      `"${s.gradeLabel}"`,
      `"${new Date(s.submittedAt).toLocaleString("vi-VN")}"`,
    ]);

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[92vh] max-h-[820px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-xs">
              📊
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight uppercase flex items-center gap-2">
                <span>Bảng Kết Quả Học Sinh</span>
                <span className="text-[10px] font-bold uppercase bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Trường TH Lạc Long Quân
                </span>
              </h3>
              <p className="text-xs text-indigo-100 font-medium">
                Theo dõi điểm số, xếp loại và xuất sổ điểm học sinh
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

        {/* Body Layout: Left Sidebar (Games List) + Right Content (Results Table) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Published Games List */}
          <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-3 sm:p-4 flex flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bài tập đã xuất bản ({games.length})
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
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Đang tải danh sách...
              </div>
            ) : games.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-2 text-slate-400">
                <BookOpen className="w-8 h-8 opacity-40" />
                <p className="text-xs">Chưa có trò chơi nào được xuất bản.</p>
                <p className="text-[11px] text-slate-400">
                  Hãy bấm <strong>"Xuất Bản & Tạo Link"</strong> ở màn hình chơi thử để bắt đầu!
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
                        ? "bg-white border-indigo-400 shadow-sm ring-2 ring-indigo-100"
                        : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        PIN: {g.pinCode}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {g.submissionsCount} bài nộp
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">
                      {g.title}
                    </h5>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{g.className || "Toàn trường"}</span>
                      {g.submissionsCount > 0 && (
                        <span className="text-emerald-600 font-bold">
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
                {/* Game Info Bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
                          MÃ PIN: {selectedGameDetails.pinCode}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {selectedGameDetails.className || "Lớp chung"}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {selectedGameDetails.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyPin(selectedGameDetails.pinCode)}
                        className="text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        {isCopiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Chép mã PIN</span>
                      </button>
                      <button
                        onClick={() => copyLink(selectedGameDetails.id)}
                        className="text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Chép Link</span>
                      </button>
                      <a
                        href={getPlayUrl(selectedGameDetails.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Mở giao diện làm bài như học sinh"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mở chơi ↗</span>
                      </a>
                      <button
                        onClick={handleExportCsv}
                        disabled={submissions.length === 0}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất Excel / CSV</span>
                      </button>
                      <button
                        onClick={() => handleDeleteGame(selectedGameDetails.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                        title="Xóa bài tập này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Đã nộp bài</div>
                        <div className="text-base font-black text-slate-800">{submissions.length} em</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Điểm TB</div>
                        <div className="text-base font-black text-emerald-700">
                          {submissions.length > 0
                            ? Math.round(submissions.reduce((a, b) => a + (b.score || 0), 0) / submissions.length)
                            : 0}đ
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Điểm cao nhất</div>
                        <div className="text-base font-black text-amber-700">
                          {submissions.length > 0 ? Math.max(...submissions.map(s => s.score || 0)) : 0}đ
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        🌟
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Tỉ lệ Đạt</div>
                        <div className="text-base font-black text-purple-700">
                          {submissions.length > 0
                            ? Math.round((submissions.filter(s => s.accuracy >= 50).length / submissions.length) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên học sinh, lớp..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-400 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <button
                    onClick={() => selectedGameId && fetchGameDetails(selectedGameId)}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Làm mới kết quả</span>
                  </button>
                </div>

                {/* Submissions Table */}
                <div className="flex-1 overflow-y-auto">
                  {isLoadingDetails ? (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                      Đang tải kết quả bài làm...
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 gap-2 text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                        📝
                      </div>
                      <p className="text-xs font-bold text-slate-600">
                        {searchQuery ? "Không tìm thấy học sinh phù hợp" : "Chưa có học sinh nào nộp bài"}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        Hãy sao chép link hoặc mã PIN bài tập gửi cho phụ huynh và học sinh để các em bắt đầu làm bài.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">STT</th>
                          <th className="py-2.5 px-3">Họ và tên học sinh</th>
                          <th className="py-2.5 px-3">Lớp</th>
                          <th className="py-2.5 px-3 text-center">Điểm số</th>
                          <th className="py-2.5 px-3 text-center">Tỉ lệ đúng</th>
                          <th className="py-2.5 px-3 text-center">Xếp loại</th>
                          <th className="py-2.5 px-3 text-right">Thời gian nộp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {filteredSubmissions.map((sub, index) => (
                          <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{index + 1}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{sub.studentName}</td>
                            <td className="py-3 px-3 text-slate-500">{sub.studentClass || "—"}</td>
                            <td className="py-3 px-3 text-center font-bold font-mono text-indigo-700 text-sm">
                              {sub.score}/{sub.maxScore}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
                            <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl">
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
      </div>
    </div>
  );
}
