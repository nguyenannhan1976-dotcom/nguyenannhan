import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ROOT_DIR = process.cwd();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-4-argon",
  "gemini-3.1-pro-preview"
];

function checkGeminiApiKey(): { valid: boolean; error?: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    return {
      valid: false,
      error: "Hệ thống chưa được cấp GEMINI_API_KEY. Vui lòng thiết lập biến môi trường GEMINI_API_KEY trong phần Settings > Secrets.",
    };
  }
  return { valid: true };
}

function formatGeminiError(err: any): string {
  const rawMsg = err?.message || String(err || "");
  const msg = rawMsg.toLowerCase();
  if (msg.includes("api_key_invalid") || msg.includes("api key not valid") || msg.includes("invalid api key")) {
    return "API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại GEMINI_API_KEY trong Settings > Secrets.";
  }
  if (msg.includes("resource_exhausted") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("429")) {
    return "Đã vượt quá giới hạn lượt gọi API (Quota Exceeded / Rate Limit). Vui lòng đợi 1-2 phút rồi thử lại.";
  }
  if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand")) {
    return "Mô hình AI đang quá tải hoặc tạm thời không khả dụng. Vui lòng thử lại sau giây lát.";
  }
  if (msg.includes("timeout") || msg.includes("etimedout") || msg.includes("econnreset")) {
    return "Quá thời gian kết nối hoặc gián đoạn mạng khi gọi API. Vui lòng thử lại.";
  }
  return rawMsg || "Đã xảy ra lỗi khi giao tiếp với mô hình AI.";
}

export function cleanAndValidateHtml(raw: string): { html: string; isValid: boolean; reason?: string } {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { html: "", isValid: false, reason: "AI trả về dữ liệu rỗng." };
  }

  let text = raw.trim();

  // 1. Remove markdown code blocks ```html ... ``` or ``` ... ```
  const codeBlockMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  } else {
    text = text.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  // 2. Extract strictly from <!DOCTYPE html> or <html> up to </html>
  const docTypeIdx = text.toLowerCase().indexOf("<!doctype html");
  const htmlStartIdx = text.toLowerCase().indexOf("<html");
  let startIdx = -1;
  if (docTypeIdx !== -1) {
    startIdx = docTypeIdx;
  } else if (htmlStartIdx !== -1) {
    startIdx = htmlStartIdx;
  }

  if (startIdx !== -1) {
    const endIdx = text.toLowerCase().lastIndexOf("</html>");
    if (endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 7).trim();
    } else {
      text = text.substring(startIdx).trim();
    }
  }

  // 3. Validation: Must contain minimal essential HTML elements
  const lower = text.toLowerCase();
  const hasDoctype = lower.includes("<!doctype html");
  const hasHtml = lower.includes("<html");
  const hasBody = lower.includes("<body") || lower.includes("</body");

  if (!hasDoctype && !hasHtml && !hasBody) {
    return {
      html: text,
      isValid: false,
      reason: "AI không trả về mã HTML hợp lệ (thiếu thẻ <!DOCTYPE html> hoặc <html>/<body>).",
    };
  }

  // Ensure it has <!DOCTYPE html> at the beginning
  if (!lower.startsWith("<!doctype html")) {
    text = `<!DOCTYPE html>\n${text}`;
  }

  // Extra safety: neutralize any stray window.alert or alert calls
  text = text.replace(/window\.alert\s*\(/g, "console.log(");
  text = text.replace(/(?<!\w)alert\s*\(/g, "console.log(");

  // Inject critical guaranteed styling & performance booster so screens hide/show reliably at 60fps
  const performanceBooster = `
<style id="game-critical-styles">
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    scroll-behavior: smooth;
    -webkit-tap-highlight-color: transparent;
  }
  .hidden { display: none !important; }
  
  /* High performance button interaction (zero delay, GPU-accelerated) */
  button, [role="button"], .option-btn {
    cursor: pointer !important;
    touch-action: manipulation;
    transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;
    will-change: transform;
    outline: none !important;
    user-select: none;
  }
  button:hover:not(:disabled), .option-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  button:active:not(:disabled), .option-btn:active:not(:disabled) {
    transform: scale(0.97) translateY(0) !important;
  }

  /* Smooth 60fps screen transitions */
  @keyframes gameFadeIn {
    0% { opacity: 0; transform: translateY(8px) scale(0.99); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  #screen-start:not(.hidden), #screen-game:not(.hidden), #screen-result:not(.hidden) {
    animation: gameFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform, opacity;
  }

  /* Smooth progress bar */
  #progress-bar, .progress-fill {
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    will-change: width;
  }
</style>
<script id="game-performance-engine">
(function() {
  // 1. AudioContext Singleton Proxy (prevents AudioContext exhaustion & frame drops)
  var _NativeAudioContext = window.AudioContext || window.webkitAudioContext;
  var _sharedAudioCtx = null;

  function getSharedAudioCtx() {
    try {
      if (!_sharedAudioCtx && _NativeAudioContext) {
        _sharedAudioCtx = new _NativeAudioContext();
      }
      if (_sharedAudioCtx && _sharedAudioCtx.state === 'suspended') {
        _sharedAudioCtx.resume().catch(function(){});
      }
    } catch(e) {}
    return _sharedAudioCtx;
  }

  // Intercept constructor so ANY new AudioContext() in generated code reuses the single fast instance
  if (_NativeAudioContext) {
    var ProxiedAudioContext = function() {
      return getSharedAudioCtx();
    };
    ProxiedAudioContext.prototype = _NativeAudioContext.prototype;
    window.AudioContext = ProxiedAudioContext;
    window.webkitAudioContext = ProxiedAudioContext;
  }

  // 2. High-performance Instant Sound Engine
  window.playGameSound = function(type) {
    try {
      var ctx = getSharedAudioCtx();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      var now = ctx.currentTime;

      if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(220, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        osc.start(now);
        osc.stop(now + 0.26);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    } catch(e) {}
  };

  window.playSound = window.playGameSound;
  window.playSoundSafely = window.playGameSound;

  // 3. Smart Question Advance Accelerator:
  // Clamps overlong 1.2s - 2s timeouts down to snappy 600ms, and allows instant tap-to-advance!
  var _origSetTimeout = window.setTimeout;
  var _pendingAdvanceTimer = null;
  var _pendingAdvanceCallback = null;

  window.setTimeout = function(fn, delay) {
    var args = Array.prototype.slice.call(arguments, 2);
    var tunedDelay = delay;

    // Check if this is an auto-advance transition timeout (800ms - 3000ms)
    if (typeof delay === 'number' && delay >= 800 && delay <= 3000) {
      tunedDelay = 600; // Crisp, fast 600ms transition
      var wrappedFn = function() {
        _pendingAdvanceTimer = null;
        _pendingAdvanceCallback = null;
        if (typeof fn === 'function') fn.apply(window, args);
      };
      _pendingAdvanceCallback = wrappedFn;
      _pendingAdvanceTimer = _origSetTimeout(wrappedFn, tunedDelay);
      return _pendingAdvanceTimer;
    }

    return _origSetTimeout.apply(window, [fn, delay].concat(args));
  };

  // Instant Advance on Click/Tap: If user clicks or taps while waiting for next question, trigger immediately!
  function triggerInstantAdvance() {
    if (_pendingAdvanceTimer && _pendingAdvanceCallback) {
      clearTimeout(_pendingAdvanceTimer);
      var cb = _pendingAdvanceCallback;
      _pendingAdvanceTimer = null;
      _pendingAdvanceCallback = null;
      cb();
    }
  }

  window.addEventListener('click', triggerInstantAdvance, true);
  window.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') triggerInstantAdvance();
  }, true);

  // Pre-warm audio on first interaction
  function warmUp() {
    getSharedAudioCtx();
    window.removeEventListener('pointerdown', warmUp);
    window.removeEventListener('keydown', warmUp);
  }
  window.addEventListener('pointerdown', warmUp, { passive: true });
  window.addEventListener('keydown', warmUp, { passive: true });
})();
</script>`;

  if (text.includes("</head>")) {
    text = text.replace("</head>", `${performanceBooster}\n</head>`);
  } else if (text.includes("<body")) {
    text = text.replace("<body", `${performanceBooster}\n<body`);
  }

  // Wrap raw .play() calls safely to prevent unhandled promise rejections on audio
  text = text.replace(/(\w+)\.play\(\)/g, "try { $1.play().catch(function(){}) } catch(e){}");

  return { html: text, isValid: true };
}

function getGeminiClient(): GoogleGenAI {
  const keyCheck = checkGeminiApiKey();
  if (!keyCheck.valid) {
    throw new Error(keyCheck.error);
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
      timeout: 60000,
    },
  });
}

async function callGemini(
  contents: any,
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  const keyCheck = checkGeminiApiKey();
  if (!keyCheck.valid) {
    throw new Error(keyCheck.error);
  }

  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`[Gemini] Calling model: ${model}`);
      const config: any = {
        temperature: 0.7,
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      const text = response.text || "";
      if (!text.trim()) {
        throw new Error(`Mô hình ${model} trả về nội dung rỗng`);
      }
      console.log(`[Gemini] Model ${model} succeeded! Output length: ${text.length}`);
      return { text, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Gemini] Model ${model} failed: ${err.message || err}`);
      lastError = err;

      const errMsg = (err?.message || "").toLowerCase();
      // If API key is definitely invalid, stop immediately without wasting time on fallbacks
      if (errMsg.includes("api_key_invalid") || errMsg.includes("api key not valid")) {
        throw new Error("API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại GEMINI_API_KEY.");
      }
      // Continue to try next fallback model
    }
  }

  throw new Error(formatGeminiError(lastError));
}

// Published Games & Student Submissions Persistence
const GAMES_FILE = path.join(ROOT_DIR, "data", "published_games.json");

interface StudentSubmission {
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

interface PublishedGame {
  id: string;
  pinCode: string;
  title: string;
  className: string;
  gameType?: string;
  questionCount?: number;
  htmlContent: string;
  createdAt: string;
  submissions: StudentSubmission[];
}

function loadPublishedGames(): PublishedGame[] {
  try {
    if (fs.existsSync(GAMES_FILE)) {
      const raw = fs.readFileSync(GAMES_FILE, "utf-8");
      return JSON.parse(raw) || [];
    }
  } catch (err) {
    console.error("[loadPublishedGames error]", err);
  }
  return [];
}

function savePublishedGames(games: PublishedGame[]) {
  try {
    fs.mkdirSync(path.dirname(GAMES_FILE), { recursive: true });
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), "utf-8");
  } catch (err) {
    console.error("[savePublishedGames error]", err);
  }
}

// Published Games APIs
app.get("/api/published-games", (_req, res) => {
  const games = loadPublishedGames();
  const summaries = games.map((g) => {
    const subs = Array.isArray(g.submissions) ? g.submissions : [];
    const avgScore = subs.length > 0 ? Math.round(subs.reduce((acc, s) => acc + (s.score || 0), 0) / subs.length) : 0;
    const maxScoreVal = subs.length > 0 ? Math.max(...subs.map((s) => s.score || 0)) : 0;
    return {
      id: g.id,
      pinCode: g.pinCode,
      title: g.title,
      className: g.className,
      gameType: g.gameType,
      questionCount: g.questionCount,
      createdAt: g.createdAt,
      submissionsCount: subs.length,
      averageScore: avgScore,
      highestScore: maxScoreVal,
    };
  });
  res.json({ success: true, games: summaries });
});

app.post("/api/published-games", (req, res) => {
  try {
    const { title, className, htmlContent, gameType, questionCount, pinCode } = req.body;
    if (!htmlContent || !htmlContent.trim()) {
      return res.status(400).json({ success: false, error: "Thiếu mã HTML trò chơi để xuất bản" });
    }

    const games = loadPublishedGames();
    const id = "game-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
    const assignedPin =
      pinCode && pinCode.trim()
        ? pinCode.trim().toUpperCase()
        : "LLQ-" + Math.floor(1000 + Math.random() * 9000);

    const newGame: PublishedGame = {
      id,
      pinCode: assignedPin,
      title: title && title.trim() ? title.trim() : "Trò chơi học tập Lạc Long Quân",
      className: className && className.trim() ? className.trim() : "Toàn trường",
      gameType: gameType || "Trắc nghiệm",
      questionCount: Number(questionCount) || 5,
      htmlContent: htmlContent.trim(),
      createdAt: new Date().toISOString(),
      submissions: [],
    };

    games.unshift(newGame);
    savePublishedGames(games);

    res.json({ success: true, game: newGame });
  } catch (err: any) {
    console.error("[POST /api/published-games error]", err);
    res.status(500).json({ success: false, error: err.message || "Lỗi khi xuất bản game" });
  }
});

app.get("/api/published-games/:id", (req, res) => {
  const games = loadPublishedGames();
  const game = games.find((g) => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ success: false, error: "Không tìm thấy trò chơi" });
  }
  res.json({ success: true, game });
});

app.get("/api/published-games/by-pin/:pin", (req, res) => {
  const games = loadPublishedGames();
  const targetPin = req.params.pin.trim().toUpperCase().replace(/\s+/g, "");
  const game = games.find(
    (g) => g.pinCode.toUpperCase().replace(/\s+/g, "") === targetPin
  );
  if (!game) {
    return res.status(404).json({ success: false, error: "Không tìm thấy trò chơi với mã PIN này" });
  }
  res.json({ success: true, game });
});

app.post("/api/published-games/:id/submit", (req, res) => {
  try {
    const { studentName, studentClass, score = 0, maxScore = 100, timeSpentSeconds = 0 } = req.body;
    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập họ và tên học sinh" });
    }

    const games = loadPublishedGames();
    const game = games.find((g) => g.id === req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: "Không tìm thấy trò chơi để nộp bài" });
    }

    if (!Array.isArray(game.submissions)) {
      game.submissions = [];
    }

    const numScore = Number(score) || 0;
    const numMaxScore = Number(maxScore) || 100;
    const accuracy = numMaxScore > 0 ? Math.round((numScore / numMaxScore) * 100) : 0;

    let gradeLabel = "Cần cố gắng 💪";
    if (accuracy >= 90) gradeLabel = "Xuất sắc 🌟";
    else if (accuracy >= 75) gradeLabel = "Giỏi 👏";
    else if (accuracy >= 50) gradeLabel = "Đạt 👍";

    const submission: StudentSubmission = {
      id: "sub-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
      studentName: studentName.trim(),
      studentClass: studentClass && studentClass.trim() ? studentClass.trim() : (game.className || ""),
      score: numScore,
      maxScore: numMaxScore,
      accuracy,
      gradeLabel,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      submittedAt: new Date().toISOString(),
    };

    game.submissions.unshift(submission);
    savePublishedGames(games);

    res.json({ success: true, submission });
  } catch (err: any) {
    console.error("[POST submit error]", err);
    res.status(500).json({ success: false, error: err.message || "Lỗi khi lưu kết quả học sinh" });
  }
});

app.delete("/api/published-games/:id", (req, res) => {
  try {
    let games = loadPublishedGames();
    const beforeCount = games.length;
    games = games.filter((g) => g.id !== req.params.id);
    if (games.length === beforeCount) {
      return res.status(404).json({ success: false, error: "Không tìm thấy trò chơi để xóa" });
    }
    savePublishedGames(games);
    res.json({ success: true, message: "Đã xóa trò chơi thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Lỗi khi xóa trò chơi" });
  }
});

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Sample SGK file endpoint for quick testing
app.get("/api/sample-sgk", (_req, res) => {
  const samplePath = path.join(ROOT_DIR, "sgk Toán 10, trang 2 đến trang 21.pdf");
  if (fs.existsSync(samplePath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sgk_toan_10_trang_2_den_21.pdf"');
    res.sendFile(samplePath);
  } else {
    res.status(404).json({ error: "Không tìm thấy file mẫu SGK" });
  }
});

// 2. Extract content & questions from PDF / Image / Text
app.post("/api/extract-pdf", async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, textContent } = req.body;

    const extractionPrompt = `Bạn là chuyên gia giáo dục và sư phạm hàng đầu.
Nhiệm vụ của bạn là đọc và phân tích kỹ tài liệu học tập / sách giáo khoa (SGK) được cung cấp dưới đây.

BẮT BUỘC PHẢI TRÍCH XUẤT VÀ TẬP HỢP TẤT CẢ CÂU HỎI VÀ BÀI TẬP CÓ TRONG TÀI LIỆU NÀY:
1. Xác định tên môn học, lớp, chương, và tên bài học cụ thể.
2. Tóm tắt ngắn gọn các khái niệm, định nghĩa, công thức hoặc quy tắc cốt lõi (3 - 5 ý chính).
3. DANH SÁCH CHI TIẾT CÁC CÂU HỎI & BÀI TẬP TRONG TÀI LIỆU:
   - Hãy tìm tất cả các bài tập, câu hỏi trong tài liệu: bao gồm câu hỏi khởi động, hoạt động khám phá (HĐ), câu hỏi luyện tập, câu hỏi vận dụng, tranh luận, và đặc biệt là CÁC BÀI TẬP VÀ CÂU HỎI TRẮC NGHIỆM/TỰ LUẬN ở cuối bài hoặc cuối chương (ví dụ: Bài 1.1, Bài 1.2... hoặc Bài 1.17, 1.18, 1.19...).
   - Với mỗi bài tập/câu hỏi, ghi rõ:
     + Mã/Số hiệu bài (Ví dụ: "Bài 1.17 (Trang 20)", "Luyện tập 1", "Bài tập 1.1"...)
     + Đề bài đầy đủ (giữ nguyên các mệnh đề, biểu thức, câu hỏi)
     + Các phương án lựa chọn A, B, C, D (nếu là trắc nghiệm) hoặc yêu cầu giải (nếu là tự luận)
     + Đáp án gợi ý hoặc lời giải ngắn gọn để hệ thống dùng lập trình game tương tác.
   - Hãy trích xuất càng nhiều câu hỏi cụ thể càng tốt (ít nhất 5 - 15 câu hỏi/bài tập nếu tài liệu có).

Hãy trình bày rõ ràng, mạch lạc, dễ đọc bằng tiếng Việt.`;

    let contents: any;

    if (fileBase64 && mimeType) {
      contents = [
        {
          inlineData: {
            mimeType: mimeType === "application/pdf" ? "application/pdf" : mimeType,
            data: fileBase64,
          },
        },
        { text: extractionPrompt },
      ];
    } else if (textContent) {
      contents = [
        {
          text: `${extractionPrompt}\n\nNỘI DUNG TÀI LIỆU:\n---\n${textContent}\n---`,
        },
      ];
    } else {
      return res.status(400).json({ error: "Thiếu dữ liệu fileBase64 hoặc textContent" });
    }

    const result = await callGemini(contents);
    res.json({
      success: true,
      extractedContent: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error("[API extract-pdf error]", err);
    res.status(500).json({ error: err.message || "Lỗi khi trích xuất tài liệu" });
  }
});

// 3. Generate suggestions
app.post("/api/generate-suggestions", async (req, res) => {
  try {
    const { lessonText } = req.body;
    if (!lessonText) {
      return res.status(400).json({ error: "Thiếu nội dung giáo án" });
    }

    const prompt = `Dựa vào nội dung giáo án và các câu hỏi đã trích xuất bên dưới, hãy đề xuất 3 loại mini game giáo dục (HTML5) phù hợp nhất.
Điền đầy đủ thông tin vào JSON array (gồm đúng 3 object).
Mỗi object chứa cấu trúc sau:
{
  "loai": string,
  "moTa": string,
  "doKho": "Dễ" | "Trung bình" | "Khó",
  "thoiGian": string,
  "icon": string (1 emoji),
  "mauSac": string (vd: "from-emerald-400 to-teal-500")
}

Một số loại game gợi ý: Trắc nghiệm, Đúng/Sai, Nối ý, Flashcard, Điền vào chỗ trống, Sắp xếp thứ tự, Phân loại...
CHÚ Ý QUAN TRỌNG: Bắt buộc CHỈ trả về đúng 1 JSON array hợp lệ, không bọc trong markdown \`\`\`json ... \`\`\`, không có bất kỳ văn bản giải thích nào khác.

NỘI DUNG GIÁO ÁN VÀ BÀI TẬP:
${lessonText}`;

    const result = await callGemini(prompt);
    let cleanJson = result.text.trim();
    cleanJson = cleanJson.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();

    const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);
    res.json({ success: true, suggestions: data, modelUsed: result.modelUsed });
  } catch (err: any) {
    console.error("[API generate-suggestions error]", err);
    res.status(500).json({ success: false, error: formatGeminiError(err) });
  }
});

// 4. Generate Game HTML
app.post("/api/generate-game", async (req, res) => {
  try {
    const keyCheck = checkGeminiApiKey();
    if (!keyCheck.valid) {
      return res.status(401).json({ success: false, error: keyCheck.error });
    }

    const {
      lessonText,
      targetGameDesc,
      gameName,
      customPrompt,
      themeColor = "blue",
      themeFont = "Inter",
      questionCount = 5,
      useIcons = false,
    } = req.body;

    if (!lessonText || !lessonText.trim()) {
      return res.status(400).json({ success: false, error: "Thiếu nội dung tài liệu SGK hoặc giáo án để lập trình game." });
    }

    const gameNameStr = gameName && gameName.trim()
      ? `\nTÊN TRÒ CHƠI: "${gameName.trim()}" (Hãy hiển thị tên này lớn ở màn hình Start).\n`
      : "";

    const customReqStr = customPrompt && customPrompt.trim()
      ? `\nYÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN (PHẢI TUÂN THỦ):\n${customPrompt.trim()}\n`
      : "";

    const useIconsStr = useIcons
      ? `9. SỬ DỤNG EMOJI/BIỂU TƯỢNG VUI NHỘN: BẮT BUỘC sử dụng nhiều Emoji vui nhộn cỡ lớn để minh hoạ, hoặc thay thế chữ viết trong câu hỏi/đáp án nếu phù hợp.`
      : "";

    const prompt = `Dựa vào chuyên môn của một Senior Game Developer và UI/UX Designer, hãy lập trình một file HTML5 hoàn chỉnh chứa mini game giáo dục tương tác.
${gameNameStr}
NỘI DUNG SÁCH GIÁO KHOA / GIÁO ÁN VÀ CÁC CÂU HỎI BÀI TẬP ĐÃ TRÍCH XUẤT:
---
${lessonText}
---

${targetGameDesc}
${customReqStr}

YÊU CẦU GIAO DIỆN TỪ THEME BUILDER:
- Màu chủ đạo (Primary Color Tailwind): màu ${themeColor}-500 (Tự động phối hợp hài hòa với các shade ${themeColor}-100 đến ${themeColor}-900)
- Font chữ: '${themeFont}' (hỗ trợ tiếng Việt đầy đủ)

QUY TẮC NỘI DUNG BẮT BUỘC (RẤT QUAN TRỌNG):
1. BẮT BUỘC PHẢI DÙNG CÁC CÂU HỎI VÀ BÀI TẬP CÓ TRONG NỘI DUNG SGK Ở TRÊN:
   - Ưu tiên tối đa việc sử dụng các bài tập, câu hỏi trắc nghiệm, bài tập luyện tập, bài tập tính toán từ tài liệu SGK đã trích xuất.
   - Tuyệt đối không được tự bịa các câu hỏi chung chung trừ khi tài liệu không có bài tập.
   - Sinh CHÍNH XÁC ${questionCount} câu hỏi/thử thách phong phú, bám sát các câu hỏi bài tập SGK đã cung cấp.
   - BẮT BUỘC xáo trộn ngẫu nhiên vị trí đáp án đúng, không để đáp án đúng luôn nằm ở lựa chọn đầu tiên (A).
2. QUY CHUẨN THIẾT KẾ CHO TỪNG THỂ LOẠI GAME ĐẢM BẢO CHẠY MƯỢT 60 FPS:
   - TRẮC NGHIỆM: Các phương án lựa chọn A, B, C, D to rõ, bấm phản hồi tức thì trong 0ms, đổi màu xanh lá/đỏ ngay lập tức và chuyển câu sau 700ms - 800ms.
   - NỐI CẶP (MATCHING): Hiển thị 2 cột song song (Cột Trái: Đề bài/Thuật ngữ; Cột Phải: Định nghĩa/Đáp án). Sử dụng cơ chế CLICK-TO-PAIR mượt mà (Bấm 1 thẻ cột trái -> thẻ sáng viền xanh -> Bấm 1 thẻ cột phải -> nếu đúng thì cả 2 thẻ xanh lá và khóa lại, nếu sai thì nhấp nháy đỏ 400ms và bỏ chọn). Tuyệt đối KHÔNG dùng HTML5 drag-and-drop.
   - ĐÚNG / SAI: Thẻ câu hỏi to ở giữa, 2 nút bấm nổi bật "✅ ĐÚNG" (xanh lá) và "❌ SAI" (đỏ). Nhận click tức thì, giải thích ngắn gọn và chuyển câu sau 750ms.
   - ĐIỀN TỪ (FILL IN THE BLANK): Câu văn có chỗ khuyết [ _____ ], phía dưới là Ngân hàng từ (Word Bank) gồm các thẻ từ bấm được. Học sinh bấm thẻ từ nào thì từ đó tự điền vào chỗ khuyết ngay lập tức, có nút "Xóa" và "Kiểm tra".
   - PHÂN LOẠI NHÓM: Dùng cơ chế Click-to-Sort (Hiển thị thẻ cần xếp, bên dưới là 2-3 Hộp danh mục; học sinh bấm vào Hộp nào thì thẻ tự chuyển vào hộp đó kèm animation trượt mượt mà).
   - SẮP XẾP THỨ TỰ: Danh sách các thẻ cần xếp thứ tự, mỗi thẻ có nút ⬆️ Lên và ⬇️ Xuống hoặc bấm 2 thẻ để hoán đổi vị trí, kèm nút "Kiểm tra kết quả".
   - LẬT THẺ GHI NHỚ: Lưới 6 - 12 thẻ úp, bấm lật mở có hiệu ứng 3D CSS mượt mà. Lật đúng cặp thì giữ nguyên, sai thì tự úp lại sau 750ms.
   - ĐOÁN TỪ: Ô chữ _ _ _ _, gợi ý từ bài học, bàn phím chữ cái A-Z dạng nút bấm và số lượt chơi (trái tim ❤️❤️❤️❤️❤️).
3. CHỈ TRẢ VỀ code HTML thuần túy, bắt đầu bằng <!DOCTYPE html>. Không bọc trong \`\`\`html \`\`\`. Không giải thích.
4. KHÔNG LỖI JS: Mọi hàm và biến được gọi PHẢI được định nghĩa đầy đủ (tránh ReferenceError).
5. ĐỘC LẬP: Mọi CSS/JS/HTML phải nằm trong cùng 1 file. ĐƯỢC PHÉP dùng các CDN:
   - Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
   - Canvas Confetti: <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
   - Google Fonts (import font ${themeFont} vào CSS).
   Tuyệt đối KHÔNG dùng CDN hình ảnh bên ngoài, chỉ dùng Emoji hoặc SVG inline.
6. TIÊU CHUẨN GIAO DIỆN & GAMEPLAY BẮT BUỘC CHƠI ĐƯỢC 100%:
   - Bố cục 3 màn hình chuyển đổi tin cậy:
     + Màn hình Bắt đầu (id="screen-start"): Hiển thị tên trò chơi và nút "BẮT ĐẦU CHƠI" (onclick="startGame()").
     + Màn hình Chơi chính (id="screen-game"): Mặc định có class "hidden". Khi bấm Bắt đầu, hàm startGame() ẩn screen-start và hiện screen-game.
     + Màn hình Kết quả (id="screen-result"): Mặc định có class "hidden". Khi trả lời xong câu cuối, ẩn screen-game và hiện screen-result kèm tổng điểm, số câu đúng và nút "CHƠI LẠI" (onclick="restartGame()").
   - TƯƠNG TÁC BẤM CHỌN CÂU TRẢ LỜI:
     + Các phương án phải là thẻ <button class="option-btn" onclick="..."> rõ ràng, nhận sự kiện click nhạy bén.
     + Khi học sinh bấm chọn:
       * Nếu ĐÚNG: Nút đổi sang màu xanh lá (bg-emerald-500 text-white), cộng điểm, hiển thị lời khen.
       * Nếu SAI: Nút đổi sang màu đỏ (bg-rose-500 text-white), đồng thời làm nổi bật đáp án đúng màu xanh để học sinh nắm bài.
       * Chuyển sang câu hỏi kế tiếp sau 1.2 - 1.5 giây hoặc bấm nút Next.
   - ÂM THANH AN TOÀN: Mọi lệnh phát âm thanh phải bọc trong try { ...play().catch(e => {}) } catch(e){} để không bao giờ bị nghẽn lệnh Javascript.
   - Thanh tiến trình (Progress bar), Bảng điểm số, Nút "Chơi Lại" kèm hiệu ứng Confetti.
   - Nút "Toàn màn hình" (🔲) ở góc trên để phóng to qua requestFullscreen.
   - Nút "Bỏ qua" (Skip) ở mỗi câu hỏi để bỏ qua không tính điểm.
7. TÍCH HỢP HỆ THỐNG: Gửi event \`window.parent.postMessage({ type: 'GAME_COMPLETE', score, maxScore }, '*');\` khi hoàn thành trò chơi.
8. TỐI ƯU MOBILE & SCROLL: Container chính PHẢI có \`min-height: 100vh; overflow-y: auto; padding-bottom: 2rem;\` để đảm bảo luôn cuộn được và nhìn thấy nút bấm.
${useIconsStr}
10. TUYỆT ĐỐI CẤM DÙNG ALERT/CONFIRM/PROMPT: KHÔNG BAO GIỜ sử dụng window.alert, alert(...), window.confirm hay window.prompt trong bất kỳ hàm nào (kể cả hàm kết thúc finishGame). Luôn dùng Modal UI bằng thẻ <div> hoặc Toast tùy chỉnh để hiển thị thông báo.
11. NÚT HOÀN THÀNH: Ở màn hình kết quả cuối cùng, BẮT BUỘC có nút "HOÀN THÀNH" to rõ ràng để kết thúc game.
12. TIÊU ĐỀ: Ở Màn hình Bắt đầu (Start Screen), hiển thị trang trọng: "TRƯỜNG TIỂU HỌC LẠC LONG QUÂN" và thông điệp "Mỗi tiết học là một niềm vui".

BẮT ĐẦU VỚI <!DOCTYPE html> VÀ THỂ HIỆN TRÌNH ĐỘ CODE ĐỈNH CAO NHẤT!`;

    const result = await callGemini(prompt);
    const cleaned = cleanAndValidateHtml(result.text);

    if (!cleaned.isValid) {
      console.error("[generate-game] Invalid HTML generated:", cleaned.reason);
      return res.status(502).json({
        success: false,
        error: cleaned.reason || "AI không trả về mã HTML hợp lệ để hiển thị trò chơi. Vui lòng bấm thử lại!",
      });
    }

    res.json({ success: true, html: cleaned.html, modelUsed: result.modelUsed });
  } catch (err: any) {
    console.error("[API generate-game error]", err);
    res.status(500).json({ success: false, error: formatGeminiError(err) });
  }
});

// 5. Adjust Game HTML
app.post("/api/adjust-game", async (req, res) => {
  try {
    const keyCheck = checkGeminiApiKey();
    if (!keyCheck.valid) {
      return res.status(401).json({ success: false, error: keyCheck.error });
    }

    const { currentHtml, adjustment } = req.body;
    if (!currentHtml || !adjustment) {
      return res.status(400).json({ success: false, error: "Thiếu code HTML cũ hoặc yêu cầu điều chỉnh" });
    }

    const adjustmentPrompt = `BẠN LÀ CHUYÊN GIA LẬP TRÌNH GAME HTML5.
DƯỚI ĐÂY LÀ CODE HTML GAME HIỆN TẠI.
HÃY CẬP NHẬT CODE THEO YÊU CẦU ĐIỀU CHỈNH SAU: "${adjustment}"
Vui lòng giữ nguyên các tính năng đang hoạt động tốt nếu phần cập nhật không đụng đến (Đặc biệt không được làm mất nút HOÀN THÀNH trò chơi).
TUYỆT ĐỐI KHÔNG sử dụng window.alert, window.confirm, hay window.prompt.
CHỈ TRẢ VỀ code HTML thuần túy, bắt đầu bằng <!DOCTYPE html>. Không bọc trong markdown \`\`\`html \`\`\`.

CODE CŨ:
\`\`\`html
${currentHtml}
\`\`\``;

    const result = await callGemini(adjustmentPrompt);
    const cleaned = cleanAndValidateHtml(result.text);

    if (!cleaned.isValid) {
      return res.status(502).json({
        success: false,
        error: "AI không trả về mã HTML hợp lệ khi điều chỉnh. Vui lòng thử lại với yêu cầu ngắn gọn hơn.",
      });
    }

    res.json({ success: true, html: cleaned.html, modelUsed: result.modelUsed });
  } catch (err: any) {
    console.error("[API adjust-game error]", err);
    res.status(500).json({ success: false, error: formatGeminiError(err) });
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
