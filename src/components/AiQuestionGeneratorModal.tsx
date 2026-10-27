import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Check, 
  Copy, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ArrowRight,
  Flame,
  Search,
  Dices,
  Layers,
  Filter
} from "lucide-react";
import { 
  fetchGeneratedQuestions, 
  GenerateQuestionsResult 
} from "../utils/geminiClient";
import { cn } from "../utils/cn";
import { 
  PRIMARY_SUBJECTS, 
  PRIMARY_GRADES, 
  CURRICULUM_BOOKS, 
  getTopicsForSubjectAndGrade, 
  getSubjectDisplayName,
  CurriculumTopicItem 
} from "../data/curriculumTopics";

export function AiQuestionGeneratorModal({
  onClose,
  onApplyQuestions,
  initialTopic,
  initialGrade,
  initialSubject,
}: {
  onClose: () => void;
  onApplyQuestions: (formattedText: string, questionCount: number, topic: string, grade: string) => void;
  initialTopic?: string;
  initialGrade?: string;
  initialSubject?: string;
}) {
  const [subject, setSubject] = useState(initialSubject || "Toán");
  const [grade, setGrade] = useState(initialGrade || "Lớp 4");
  const [topic, setTopic] = useState(initialTopic || "Phép cộng và phép trừ phân số");
  const [curriculumBook, setCurriculumBook] = useState("Kết nối tri thức với cuộc sống");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState("Hỗn hợp phong phú");
  const [questionType, setQuestionType] = useState("Trắc nghiệm 4 đáp án");
  const [customNotes, setCustomNotes] = useState("");

  // Filters for topic suggestions
  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<"all" | "hot" | 1 | 2>("all");

  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<GenerateQuestionsResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Play light sound
  const playPopSound = () => {
    try {
      const audioCtx = (window as any)._sharedAudioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  // Full curriculum topics for current Subject + Grade
  const rawTopics = useMemo(() => {
    return getTopicsForSubjectAndGrade(subject, grade);
  }, [subject, grade]);

  // Filtered topics based on search & semester/hot filter
  const filteredTopics = useMemo(() => {
    return rawTopics.filter(t => {
      // Semester / hot filter
      if (semesterFilter === "hot" && !t.isHot) return false;
      if (semesterFilter === 1 && t.semester !== 1) return false;
      if (semesterFilter === 2 && t.semester !== 2) return false;

      // Search query
      if (topicSearchQuery.trim()) {
        const q = topicSearchQuery.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      }

      return true;
    });
  }, [rawTopics, semesterFilter, topicSearchQuery]);

  // Categories present in this subject/grade
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    rawTopics.forEach(t => set.add(t.category));
    return Array.from(set);
  }, [rawTopics]);

  // Random topic selector
  const handleRandomTopic = () => {
    if (rawTopics.length === 0) return;
    playPopSound();
    const randomIndex = Math.floor(Math.random() * rawTopics.length);
    const chosen = rawTopics[randomIndex];
    setTopic(chosen.name);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg("Vui lòng nhập tên chủ đề bài học để AI biên soạn câu hỏi!");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await fetchGeneratedQuestions({
        topic: topic.trim(),
        grade,
        subject,
        questionCount,
        difficulty,
        questionType,
        curriculumBook,
        customNotes: customNotes.trim()
      });

      setResultData(res);
      playPopSound();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể sinh câu hỏi bằng AI. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = async () => {
    if (!resultData) return;
    try {
      await navigator.clipboard.writeText(resultData.formattedText);
      setCopied(true);
      playPopSound();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = () => {
    if (!resultData) return;
    playPopSound();
    onApplyQuestions(
      resultData.formattedText, 
      resultData.questionCount || questionCount,
      resultData.topic || topic,
      resultData.grade || grade
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col my-auto max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  AI Sinh Câu Hỏi Thông Minh Theo Chủ Đề & Cấp Lớp
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-wider hidden sm:inline shadow-2xs">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium">
                Ngân hàng chủ đề phong phú bám sát Sách giáo khoa GDPT 2018 - Trường Tiểu học Lạc Long Quân
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2 animate-shake">
              <span className="text-lg">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {!resultData ? (
            /* FORM INPUT MODE */
            <div className="space-y-4 sm:space-y-5">
              
              {/* 1. Môn học */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    1. Chọn Môn Học:
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {getSubjectDisplayName(subject, grade)}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIMARY_SUBJECTS.map((s) => {
                    const isSelected = subject === s.id;
                    const displayName = getSubjectDisplayName(s.id, grade);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          playPopSound();
                          setSubject(s.id);
                          setTopicSearchQuery("");
                          // Auto pick first topic for this subject+grade
                          const newTopics = getTopicsForSubjectAndGrade(s.id, grade);
                          if (newTopics && newTopics.length > 0) {
                            setTopic(newTopics[0].name);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs flex items-center gap-1.5",
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-sm scale-102"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300"
                        )}
                      >
                        <span>{s.icon}</span>
                        <span>{s.id === "Khoa học" && (grade === "Lớp 1" || grade === "Lớp 2" || grade === "Lớp 3") ? "Tự nhiên & Xã hội" : s.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Cấp lớp */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    2. Chọn Cấp Lớp:
                  </span>
                  <span className="text-[11px] font-bold text-purple-600">
                    Cấp Tiểu học Lạc Long Quân
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PRIMARY_GRADES.map((g) => {
                    const isSelected = grade === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          playPopSound();
                          setGrade(g.id);
                          setTopicSearchQuery("");
                          // Auto pick first topic for this subject+grade
                          const newTopics = getTopicsForSubjectAndGrade(subject, g.id);
                          if (newTopics && newTopics.length > 0) {
                            setTopic(newTopics[0].name);
                          }
                        }}
                        className={cn(
                          "p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between",
                          isSelected
                            ? "bg-purple-600 text-white border-purple-700 shadow-sm scale-102 font-bold"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300"
                        )}
                      >
                        <span className="text-xs font-black">{g.label}</span>
                        <span className={cn(
                          "text-[10px] mt-0.5",
                          isSelected ? "text-purple-100" : "text-slate-500"
                        )}>
                          {g.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Chủ đề bài học & Gợi ý phong phú bám sát SGK */}
              <div className="bg-gradient-to-br from-amber-50/60 via-indigo-50/30 to-purple-50/40 p-3.5 sm:p-4 rounded-2xl border-2 border-indigo-200/80 space-y-3 shadow-xs">
                
                {/* Topic Input Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                      3. Chủ Đề Bài Học Cần Tạo Câu Hỏi:
                    </label>
                    <button
                      type="button"
                      onClick={handleRandomTopic}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                      title="Chọn ngẫu nhiên 1 chủ đề hay bám sát SGK"
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-600" />
                      <span>Chọn ngẫu nhiên</span>
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={`Nhập chủ đề hoặc bấm chọn trong danh sách bám sát SGK bên dưới...`}
                    className="w-full p-3 sm:p-3.5 rounded-xl border-2 border-indigo-200 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal bg-white shadow-xs"
                  />
                </div>

                {/* Topic Explorer Toolbar: Search & Semester Filter */}
                <div className="space-y-2 pt-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-black text-slate-700 flex items-center gap-1 mr-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        Gợi ý SGK ({rawTopics.length} chủ đề):
                      </span>

                      {/* Semester Filters */}
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setSemesterFilter("all")}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                            semesterFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setSemesterFilter("hot")}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5",
                            semesterFilter === "hot" ? "bg-amber-500 text-white" : "text-amber-700 hover:bg-amber-50"
                          )}
                        >
                          ⭐ Trọng tâm
                        </button>
                        <button
                          type="button"
                          onClick={() => setSemesterFilter(1)}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                            semesterFilter === 1 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          Học kỳ 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setSemesterFilter(2)}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                            semesterFilter === 2 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          Học kỳ 2
                        </button>
                      </div>
                    </div>

                    {/* Quick Search */}
                    <div className="relative min-w-[160px] sm:w-48">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={topicSearchQuery}
                        onChange={(e) => setTopicSearchQuery(e.target.value)}
                        placeholder="Lọc nhanh chủ đề..."
                        className="w-full pl-7 pr-6 py-1 rounded-lg text-xs bg-white border border-slate-200 outline-none focus:border-indigo-500 placeholder:text-slate-400 font-medium"
                      />
                      {topicSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTopicSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Topic Chips Container */}
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 pt-1">
                    {filteredTopics.length > 0 ? (
                      filteredTopics.map((item, idx) => {
                        const isSelected = topic === item.name;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              playPopSound();
                              setTopic(item.name);
                            }}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer border text-left flex items-center gap-1.5 shadow-2xs group active:scale-97",
                              isSelected 
                                ? "bg-amber-100 text-amber-950 border-amber-400 font-black ring-1 ring-amber-400 shadow-xs" 
                                : "bg-white text-slate-700 border-slate-200/90 hover:border-amber-300 hover:bg-amber-50/60"
                            )}
                          >
                            {item.isHot && <span className="text-[10px]">⭐</span>}
                            <span className="font-medium text-xs">{item.name}</span>
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.2 rounded-md font-semibold",
                              isSelected ? "bg-amber-200/80 text-amber-900" : "bg-slate-100 text-slate-500 group-hover:bg-amber-100/70"
                            )}>
                              {item.category}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-3 px-4 text-center w-full text-xs text-slate-500 bg-white/70 rounded-xl border border-dashed border-slate-300">
                        Không tìm thấy chủ đề phù hợp với từ khóa "{topicSearchQuery}". Bạn có thể nhập trực tiếp tên bài học ở ô trên.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 4. Số lượng câu hỏi & Mức độ nhận thức */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Số lượng */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Số lượng câu hỏi:
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600">
                      {questionCount} câu (~{questionCount * 1} phút)
                    </span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[3, 5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          playPopSound();
                          setQuestionCount(num);
                        }}
                        className={cn(
                          "py-2 rounded-xl text-xs font-black transition-all cursor-pointer border text-center",
                          questionCount === num
                            ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                        )}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mức độ */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-600" />
                    Mức độ nhận thức:
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Hỗn hợp phong phú">Hỗn hợp phong phú (Đủ mức độ ⭐)</option>
                    <option value="Nhận biết">Cơ bản / Nhận biết (Dễ)</option>
                    <option value="Thông hiểu">Thông hiểu & Vận dụng vừa</option>
                    <option value="Vận dụng cao">Vận dụng cao (Thử thách khó)</option>
                  </select>
                </div>

              </div>

              {/* 5. Bộ sách & Ghi chú thêm (Tùy chọn) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Bộ sách tham khảo:
                  </label>
                  <select
                    value={curriculumBook}
                    onChange={(e) => setCurriculumBook(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {CURRICULUM_BOOKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Ghi chú sư phạm thêm (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="VD: Nhiều emoji vui, câu hỏi ngắn gọn..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

            </div>
          ) : (
            /* RESULTS PREVIEW MODE */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                    🎉
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Đã sinh thành công {resultData.questions.length} câu hỏi chuẩn SGK!
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      Chủ đề: <span className="font-bold underline">{resultData.topic}</span> • {resultData.subject} • {resultData.grade}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultData(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đổi chủ đề</span>
                  </button>
                </div>
              </div>

              {/* Danh sách câu hỏi chi tiết */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {resultData.questions.map((q, idx) => (
                  <div 
                    key={q.id || idx} 
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          Câu {idx + 1}
                        </span>
                      </div>
                      {q.difficulty && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          q.difficulty.includes("Nhận") ? "bg-sky-100 text-sky-800" :
                          q.difficulty.includes("Thông") ? "bg-amber-100 text-amber-800" :
                          "bg-purple-100 text-purple-800"
                        )}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-800 leading-snug">
                      {q.question}
                    </p>

                    {/* Options */}
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const optLetter = opt.trim().charAt(0).toUpperCase();
                          const isCorrect = q.correctAnswer?.toUpperCase().includes(optLetter) || opt.includes(q.correctAnswer);
                          return (
                            <div
                              key={optIdx}
                              className={cn(
                                "p-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between",
                                isCorrect
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold ring-1 ring-emerald-300"
                                  : "bg-slate-50/70 text-slate-700 border-slate-200"
                              )}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <span className="text-sm leading-none shrink-0 mt-0.5">💡</span>
                        <div>
                          <strong className="text-amber-950 font-black">Gợi ý & Hướng dẫn:</strong>{" "}
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            {!resultData ? (
              <span>💡 Thầy cô có thể chọn trực tiếp từ kho gợi ý hoặc gõ chủ đề bất kỳ.</span>
            ) : (
              <span>🎯 Bấm nút bên phải để áp dụng ngay bộ câu hỏi vào lập trình Game HTML5.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            >
              Đóng
            </button>

            {!resultData ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-indigo-200 flex items-center justify-center gap-2 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang biên soạn câu hỏi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>BẮT ĐẦU TẠO BẰNG AI 🚀</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-md shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98"
              >
                <ArrowRight className="w-4 h-4" />
                <span>ÁP DỤNG & TẠO GAME NGAY 🎮</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
