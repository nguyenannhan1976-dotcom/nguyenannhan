import { useState, useEffect } from "react";
import { 
  Gamepad2, 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  Edit3, 
  RotateCcw, 
  GraduationCap, 
  BarChart3, 
  Share2, 
  KeyRound, 
  Users 
} from "lucide-react";
import { FileUploader, FileMetadata } from "./components/FileUploader";
import { GameSuggestions, GameSuggestionObj } from "./components/GameSuggestions";
import { GamePreview } from "./components/GamePreview";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { Toast } from "./components/Toast";
import { PublishModal, PublishedGameData } from "./components/PublishModal";
import { TeacherResultsModal } from "./components/TeacherResultsModal";
import { StudentPlayer } from "./components/StudentPlayer";
import { 
  fetchGameSuggestions, 
  fetchGeneratedGame, 
  fetchAdjustedGame 
} from "./utils/geminiClient";
import { cn } from "./utils/cn";

const GAME_TYPES = [
  { id: 'auto', label: 'AI tự động chọn (Khuyên dùng)', icon: '🌟' },
  { id: 'suggest', label: 'Xem 3 gợi ý từ AI', icon: '💡' },
  { id: 'quiz', label: 'Trắc nghiệm', icon: '✅' },
  { id: 'matching', label: 'Nối cặp', icon: '🗂️' },
  { id: 'fill_blank', label: 'Điền từ', icon: '📝' },
  { id: 'drag_drop', label: 'Kéo thả phân loại', icon: '👐' },
  { id: 'sequencing', label: 'Sắp xếp thứ tự', icon: '🧩' },
  { id: 'true_false', label: 'Đúng / Sai', icon: '⚖️' },
  { id: 'memory', label: 'Lật hình ghi nhớ', icon: '🧠' },
  { id: 'word_search', label: 'Tìm chữ', icon: '🔍' },
  { id: 'crossword', label: 'Giải ô chữ', icon: '➕' },
  { id: 'hangman', label: 'Đoán từ', icon: '🎯' },
];

const THEME_COLORS = [
  { id: 'blue', class: 'bg-blue-500', hex: '#3b82f6', label: 'Xanh dương' },
  { id: 'emerald', class: 'bg-emerald-500', hex: '#10b981', label: 'Xanh ngọc' },
  { id: 'violet', class: 'bg-violet-500', hex: '#8b5cf6', label: 'Tím violet' },
  { id: 'rose', class: 'bg-rose-500', hex: '#f43f5e', label: 'Hồng rose' },
  { id: 'amber', class: 'bg-amber-500', hex: '#f59e0b', label: 'Vàng hổ phách' },
  { id: 'cyan', class: 'bg-cyan-500', hex: '#06b6d4', label: 'Xanh cyan' },
];

const THEME_FONTS = [
  { id: 'Inter', label: 'Inter (Hiện đại)' },
  { id: 'Quicksand', label: 'Quicksand (Mềm mại)' },
  { id: 'Nunito', label: 'Nunito (Đáng yêu)' },
  { id: 'Roboto', label: 'Roboto (Cơ bản)' },
];

function App() {
  const [step, setStep] = useState(1);
  const [lessonText, setLessonText] = useState("");
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['auto']);
  const [customPrompt, setCustomPrompt] = useState("");
  const [gameName, setGameName] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [themeColor, setThemeColor] = useState('blue');
  const [themeFont, setThemeFont] = useState('Inter');
  const [useIcons, setUseIcons] = useState<boolean>(false);
  
  const [suggestions, setSuggestions] = useState<GameSuggestionObj[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameSuggestionObj | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Workflow State: Publish, Student Play, Teacher Results
  const [studentPlayId, setStudentPlayId] = useState<string | null>(null);
  const [studentPin, setStudentPin] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [publishedCount, setPublishedCount] = useState<number>(0);

  const refreshPublishedCount = () => {
    fetch("/api/published-games")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.games)) {
          setPublishedCount(data.games.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const playParam = urlParams.get("play");
    const pinParam = urlParams.get("pin");
    const resultsParam = urlParams.get("results");

    if (playParam) {
      setStudentPlayId(playParam);
    } else if (pinParam) {
      setStudentPin(pinParam);
    }

    if (resultsParam === "true") {
      setShowResultsModal(true);
    }

    refreshPublishedCount();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const toggleType = (id: string) => {
    // If clicking auto or suggest or any specific game type, select it directly
    setSelectedTypes([id]);
  };

  const handleNextStep1 = async () => {
    if (!lessonText || !lessonText.trim()) {
      showToast("Vui lòng tải lên tài liệu SGK hoặc bấm 'Dùng thử file mẫu' / dán câu hỏi để tạo game!", "error");
      return;
    }
    
    if (selectedTypes.includes('suggest')) {
      await handleGenerateSuggestions();
    } else {
      await handleGenerateGame();
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setLoadingText("🧠 Đang phân tích nội dung & câu hỏi để đề xuất loại game phù hợp...");

    try {
      const res = await fetchGameSuggestions(lessonText);
      if (Array.isArray(res.suggestions) && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
        setStep(2);
      } else {
        throw new Error("Không nhận được danh sách gợi ý hợp lệ từ AI");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi tạo gợi ý", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGame = async (adjustment?: string) => {
    setIsLoading(true);
    
    // Adjustment mode
    if (adjustment && generatedHtml) {
      setLoadingText("🔄 Đang điều chỉnh game theo yêu cầu của bạn...");
      try {
        const res = await fetchAdjustedGame(generatedHtml, adjustment);
        setGeneratedHtml(res.html);
        setLoadingText("✨ Hoàn thiện chi tiết...");
        setTimeout(() => setStep(3), 400);
      } catch (err: any) {
        showToast(err.message || "Lỗi cập nhật game", "error");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setLoadingText("🎮 Đang lập trình game HTML5 từ câu hỏi và nội dung SGK...");
    
    let targetGameDesc = "";
    if (selectedTypes.includes('auto')) {
      targetGameDesc = "LOẠI GAME: Tự động phân tích câu hỏi và bài tập SGK để CHỌN 1 LOẠI mini-game giáo dục phù hợp nhất (Trắc nghiệm, Đúng/Sai, Nối cặp, v.v.).";
    } else if (selectedTypes.includes('suggest')) {
      if (!selectedGame) return;
      targetGameDesc = `LOẠI GAME: ${selectedGame.loai} - ${selectedGame.moTa}`;
    } else if (selectedTypes.length === 1) {
      const typeId = selectedTypes[0];
      const typeObj = GAME_TYPES.find(t => t.id === typeId);
      const label = typeObj?.label || typeId;
      targetGameDesc = `LOẠI GAME: ${label.toUpperCase()} (MÃ: ${typeId}).
      BẮT BUỘC: Toàn bộ trò chơi sử dụng ĐỒNG NHẤT DUY NHẤT 1 THỂ LOẠI LÀ "${label}" cho tất cả các câu hỏi/thử thách từ đầu đến cuối. Lập trình đúng chuẩn thể loại này, thao tác mượt mà 60 FPS, phản hồi tức thì và không dùng cơ chế kéo thả lỗi.`;
    } else {
      const selectedLabels = selectedTypes.map(id => GAME_TYPES.find(t => t.id === id)?.label).join(', ');
      targetGameDesc = `LOẠI GAME KẾT HỢP: (${selectedLabels}). Trò chơi bao gồm các thử thách liên tiếp, mỗi câu hỏi chọn 1 dạng phù hợp trong các loại đã chọn, đảm bảo gameplay mượt mà và trực quan.`;
    }

    try {
      const res = await fetchGeneratedGame({
        lessonText,
        targetGameDesc,
        gameName,
        customPrompt,
        themeColor,
        themeFont,
        questionCount,
        useIcons,
      });

      setGeneratedHtml(res.html);
      setLoadingText("✨ Game đã sẵn sàng!");
      setTimeout(() => setStep(3), 400);
    } catch (err: any) {
      showToast(err.message || "Lỗi tạo game", "error");
      if (step !== 2) setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  if (studentPlayId || studentPin) {
    return (
      <StudentPlayer
        gameId={studentPlayId || undefined}
        pinCode={studentPin || undefined}
        onExit={() => {
          window.history.replaceState({}, "", "/");
          setStudentPlayId(null);
          setStudentPin(null);
          refreshPublishedCount();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 font-sans text-slate-800 bg-[#f8fafc] flex flex-col overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-8 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img 
              src="/assets/aistudio/Capture_ab0cddf9.PNG" 
              alt="Logo Trường Tiểu học Lạc Long Quân" 
              className="w-10 sm:w-11 h-10 sm:h-11 rounded-full object-contain bg-white shadow-md ring-2 ring-indigo-200/80 p-0.5"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs border border-white">
              <Gamepad2 className="w-3 h-3" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base md:text-xl font-black tracking-tight leading-tight uppercase">
              <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent">
                TRƯỜNG TIỂU HỌC
              </span>{" "}
              <span className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                LẠC LONG QUÂN
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Button: Học sinh vào chơi */}
          <button
            onClick={() => setShowPinModal(true)}
            className="text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Dành cho học sinh: Nhập mã PIN để vào phòng chơi"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Học sinh vào chơi</span>
            <span className="sm:hidden">Vào chơi</span>
          </button>

          {/* Button: Bảng kết quả học sinh */}
          <button
            onClick={() => setShowResultsModal(true)}
            className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-sm px-3 sm:px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
            title="Xem kết quả, điểm số và bảng xếp loại của học sinh"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kết Quả Học Sinh</span>
            <span className="sm:hidden">Kết Quả</span>
            {publishedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white/25 text-white rounded-full text-[10px] font-black">
                {publishedCount}
              </span>
            )}
          </button>

          {step > 1 && (
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tạo mới</span>
            </button>
          )}
        </div>
      </header>

      <main className={cn("flex-1 flex flex-col mx-auto w-full", step === 3 ? "p-2 sm:p-4 max-w-6xl h-[calc(100vh-4rem)] overflow-hidden" : "p-4 sm:p-8 max-w-5xl overflow-y-auto")}>
        <div className={cn("w-full flex-1 flex flex-col", step === 3 ? "h-full" : "")}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <LoadingSpinner text={loadingText} />
              <button
                type="button"
                onClick={() => {
                  setIsLoading(false);
                  showToast("Đã dừng quá trình tạo game. Bạn có thể bấm thử lại bất kỳ lúc nào.", "error");
                }}
                className="mt-6 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full shadow-2xs transition-all cursor-pointer"
              >
                Hủy bỏ & quay lại
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1">
              
              {/* STEP 1 */}
              {step === 1 && (
                <div className="max-w-3xl mx-auto space-y-6 pb-8">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight uppercase mb-2">
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        TẠO TRÒ CHƠI
                      </span>{" "}
                      <span className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                        TỪ SÁCH GIÁO KHOA
                      </span>
                    </h2>
                    <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Mỗi tiết học là một niềm vui
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-7">
                    {/* Mục 1: Tải file & Xem câu hỏi trích xuất */}
                    <div>
                      <label className="flex items-center gap-2.5 text-base font-bold tracking-tight mb-3">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">1</span>
                        <span className="text-slate-900 font-black">
                          Tải lên File Sách Giáo Khoa <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">(PDF Scan / Ảnh / Word)</span>
                        </span>
                        {lessonText && (
                          <span className="text-emerald-700 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Đã lấy câu hỏi SGK
                          </span>
                        )}
                      </label>

                      <FileUploader 
                        onFileProcessed={(text, meta) => { 
                          setLessonText(text); 
                          setFileMetadata(meta);
                          showToast("Đã trích xuất thành công nội dung và câu hỏi từ tài liệu!", "success");
                        }} 
                        onError={(err) => showToast(err, "error")} 
                      />

                      {!lessonText && (
                        <div className="mt-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditingExtracted ? "Đóng ô dán chữ" : "Hoặc bấm vào đây để dán trực tiếp câu hỏi / đề bài SGK"}</span>
                          </button>
                        </div>
                      )}

                      {!lessonText && isEditingExtracted && (
                        <div className="mt-3 p-4 bg-white border border-indigo-200 rounded-2xl shadow-xs space-y-2">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                            Dán nội dung câu hỏi, bài tập SGK hoặc giáo án vào đây:
                          </label>
                          <textarea
                            rows={6}
                            placeholder="Nhập hoặc dán các câu hỏi, bài tập có đáp án..."
                            onChange={(e) => setLessonText(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none leading-relaxed text-slate-800"
                          />
                        </div>
                      )}

                      {/* Extracted Questions & Content Inspector Card */}
                      {lessonText && (
                        <div className="mt-4 p-4 sm:p-5 bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100 rounded-2xl">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base shadow-xs">
                                📖
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <span>Nội dung & Câu hỏi đã trích xuất từ SGK</span>
                                  {fileMetadata?.isScanned && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                      AI OCR Thị Giác
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {fileMetadata?.fileName || "Tài liệu SGK"} {fileMetadata?.numPages ? `(${fileMetadata.numPages} trang)` : ""}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-all flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{isEditingExtracted ? "Xong (Lưu)" : "Xem / Chỉnh sửa"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLessonText("");
                                  setFileMetadata(null);
                                }}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-white px-2.5 py-1.5 rounded-lg border border-rose-200 shadow-2xs hover:bg-rose-50 transition-all"
                              >
                                Đổi file khác
                              </button>
                            </div>
                          </div>

                          {isEditingExtracted ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-slate-600 font-medium">
                                Giáo viên có thể chỉnh sửa, xóa bớt hoặc bổ sung thêm câu hỏi/đáp án theo ý muốn:
                              </p>
                              <textarea
                                rows={10}
                                value={lessonText}
                                onChange={(e) => setLessonText(e.target.value)}
                                className="w-full p-3.5 rounded-xl border border-indigo-200 text-xs font-mono bg-white focus:ring-2 focus:ring-indigo-300 outline-none leading-relaxed text-slate-800"
                              />
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-slate-700 bg-white/90 p-3.5 rounded-xl border border-slate-200/80 max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-2xs font-mono">
                              {lessonText.slice(0, 1000)}
                              {lessonText.length > 1000 && "\n... (Bấm 'Xem / Chỉnh sửa' để xem toàn bộ câu hỏi và đáp án)"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mục 2: Chọn loại trò chơi */}
                    <div>
                      <label className="flex items-center gap-2.5 text-base font-bold tracking-tight mb-3">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-xs">2</span>
                        <span className="text-slate-900 font-black">
                          Chọn thể loại trò chơi <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-extrabold">(Đa dạng & Vui nhộn)</span>
                        </span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {GAME_TYPES.map(type => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => toggleType(type.id)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-2 p-3.5 text-center rounded-2xl border-2 transition-all cursor-pointer",
                              type.id === 'auto' ? "col-span-2 md:col-span-2 bg-gradient-to-br from-indigo-50/90 to-purple-50/90" : "",
                              type.id === 'suggest' ? "col-span-2 md:col-span-2 bg-slate-50" : "",
                              selectedTypes.includes(type.id) 
                                ? "border-indigo-500 bg-indigo-50/80 shadow-md transform scale-[1.01]" 
                                : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                            )}
                          >
                            <span className="text-2xl mb-0.5">{type.icon}</span>
                            <span className={cn(
                              "text-xs sm:text-sm font-bold leading-tight",
                              selectedTypes.includes(type.id) 
                                ? type.id === 'auto'
                                  ? "bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent font-black"
                                  : "text-indigo-900 font-black"
                                : "text-slate-700"
                            )}>{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mục 3: Theme Builder */}
                    <div>
                      <label className="flex items-center gap-2.5 text-base font-bold tracking-tight mb-3">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white flex items-center justify-center text-xs font-black shadow-xs">3</span>
                        <span className="text-slate-900 font-black">
                          Giao diện & Màu sắc trò chơi <span className="bg-gradient-to-r from-fuchsia-600 to-rose-600 bg-clip-text text-transparent font-extrabold">(Theme Sắc Màu)</span>
                        </span>
                      </label>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-black bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent uppercase tracking-wider mb-2">Màu chủ đạo</p>
                          <div className="flex flex-wrap gap-2">
                            {THEME_COLORS.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setThemeColor(c.id)}
                                className={cn(
                                  "px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all flex items-center cursor-pointer",
                                  themeColor === c.id ? "border-slate-800 bg-slate-50 font-bold text-slate-900 shadow-2xs" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                <span className="inline-block w-3 h-3 rounded-full mr-2 shadow-xs" style={{ backgroundColor: c.hex }}></span>
                                <span>{c.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-black bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent uppercase tracking-wider mb-2">Kiểu chữ</p>
                          <div className="flex flex-wrap gap-2">
                            {THEME_FONTS.map(f => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setThemeFont(f.id)}
                                className={cn(
                                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer",
                                  themeFont === f.id ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-2xs" : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50"
                                )}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mục 4: Số lượng câu hỏi */}
                    <div>
                      <label className="flex items-center gap-2.5 text-base font-bold tracking-tight mb-2">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center text-xs font-black shadow-xs">4</span>
                        <span className="text-slate-900 font-black">
                          Số lượng câu hỏi bài tập đưa vào game <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-extrabold">(Tối ưu SGK)</span>
                        </span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          min={1}
                          max={30}
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 5)))}
                          className="w-24 p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-center text-sm"
                        />
                        <span className="text-xs font-medium text-slate-500">
                          (Ưu tiên lấy đúng số lượng câu hỏi từ SGK đã trích xuất)
                        </span>
                      </div>
                    </div>

                    {/* Mục 5: Tên trò chơi (Tùy chọn) */}
                    <div>
                      <label className="flex items-center gap-2.5 text-base font-bold tracking-tight mb-2">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-black shadow-xs">5</span>
                        <span className="text-slate-900 font-black">
                          Tên trò chơi <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-extrabold">(Tùy chọn)</span>
                        </span>
                      </label>
                      <input 
                        type="text"
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        placeholder="Ví dụ: Đấu Trí Mệnh Đề - Toán 10..."
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                      />
                    </div>

                    {/* Mục 6: Yêu cầu sư phạm thêm (Tùy chọn) */}
                    <div>
                      <label className="flex items-center gap-2.5 text-base font-bold tracking-tight mb-1">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">6</span>
                        <span className="text-slate-900 font-black">
                          Yêu cầu sư phạm thêm <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-extrabold">(Dành cho Giáo viên)</span>
                        </span>
                      </label>
                      <p className="text-xs text-slate-500 mb-2">
                        Ví dụ: Giới hạn 20s mỗi câu, giải thích đáp án chi tiết khi học sinh chọn sai, v.v.
                      </p>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={2}
                        placeholder="Nhập yêu cầu đặc biệt của giáo viên..."
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-xs resize-none bg-slate-50 focus:bg-white"
                      />
                    </div>

                    {/* Mục 7: Tùy chọn Emoji */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50">
                        <input 
                          type="checkbox" 
                          checked={useIcons}
                          onChange={(e) => setUseIcons(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center text-xs font-black shadow-2xs shrink-0">7</span>
                          <div>
                            <div className="text-slate-900 text-xs font-black">
                              Thêm biểu tượng & <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 bg-clip-text text-transparent font-black">Emoji sinh động</span>
                            </div>
                            <div className="text-[11px] text-slate-500">Giúp giao diện trò chơi trực quan, hấp dẫn học sinh hơn.</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-2 text-center sm:text-right">
                    <button 
                      type="button"
                      onClick={handleNextStep1}
                      className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-xl shadow-purple-300/40 transition-all hover:scale-[1.03] active:scale-95 text-base cursor-pointer"
                    >
                      {selectedTypes.includes('suggest') ? "Xem 3 Gợi Ý Từ AI ✨" : "Lập Trình Game HTML5 Ngay 🚀"}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Suggestions */}
              {step === 2 && (
                <div className="space-y-6 flex flex-col flex-1 max-w-4xl mx-auto w-full pb-8">
                  <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-black mb-2">
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Chọn Loại Game
                      </span>{" "}
                      <span className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 bg-clip-text text-transparent">
                        Bạn Thích Nhất
                      </span>
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      AI đã phân tích nội dung SGK và gợi ý 3 cấu trúc mini-game tối ưu nhất cho bài học này:
                    </p>
                  </div>

                  <GameSuggestions 
                    suggestions={suggestions} 
                    selected={selectedGame} 
                    onSelect={setSelectedGame} 
                  />

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-auto">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      ← Quay lại chỉnh sửa
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => handleGenerateGame()}
                      disabled={!selectedGame}
                      className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-black rounded-full shadow-xl shadow-purple-300/40 flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-base cursor-pointer"
                    >
                      Lập Trình Game Này ✨
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Game Preview, Test Play & Publish */}
              {step === 3 && (
                <GamePreview 
                  htmlContent={generatedHtml} 
                  onRegenerate={handleGenerateGame} 
                  onBack={() => {
                    if (selectedTypes.includes('suggest')) setStep(2);
                    else setStep(1);
                  }}
                  onPublish={() => setShowPublishModal(true)}
                />
              )}

            </div>
          )}
        </div>
      </main>

      {/* Publish & Create Link Modal */}
      {showPublishModal && (
        <PublishModal
          htmlContent={generatedHtml}
          initialTitle={gameName || "Trò chơi học tập SGK"}
          initialClass="Lớp 5A1"
          gameType={selectedTypes[0] || "Trắc nghiệm"}
          questionCount={questionCount}
          onClose={() => setShowPublishModal(false)}
          onPublishedSuccess={(game) => {
            refreshPublishedCount();
            showToast(`Đã xuất bản thành công! Mã PIN bài tập: ${game.pinCode}`);
          }}
        />
      )}

      {/* Teacher Live Results Modal */}
      {showResultsModal && (
        <TeacherResultsModal
          onClose={() => setShowResultsModal(false)}
        />
      )}

      {/* Quick PIN Modal for Students */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center text-3xl shadow-xs">
              🎮
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">Học Sinh Vào Chơi</h3>
              <p className="text-xs text-slate-500 mt-1">Nhập mã PIN bài tập do thầy cô cung cấp</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!pinInput.trim()) return;
              setShowPinModal(false);
              setStudentPin(pinInput.trim().toUpperCase());
            }}>
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                placeholder="VD: LLQ-1234"
                autoFocus
                className="w-full p-3.5 rounded-2xl border-2 border-indigo-200 text-center text-xl font-black font-mono tracking-widest text-indigo-700 bg-indigo-50/50 focus:bg-white focus:border-indigo-500 outline-none uppercase mb-4"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="flex-1 py-2.5 rounded-full text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-200"
                >
                  Vào chơi 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
