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
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
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
  
  /* High performance button interaction */
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
  }

  /* Smooth progress bar */
  #progress-bar, .progress-fill {
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    will-change: width;
  }
</style>
<script id="game-performance-engine">
(function() {
  // Prevent any unhandled error from breaking the game experience
  window.addEventListener('error', function(e) {
    console.warn('[EduGame Notice]', e.message);
  });

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

  if (_NativeAudioContext) {
    var ProxiedAudioContext = function() {
      return getSharedAudioCtx();
    };
    ProxiedAudioContext.prototype = _NativeAudioContext.prototype;
    window.AudioContext = ProxiedAudioContext;
    window.webkitAudioContext = ProxiedAudioContext;
  }

  // 2. High-performance Cheerful Web Audio Sound Engine (100% offline, zero lag, joyful school sounds)
  window.__isGameMuted = false;

  window.playGameSound = function(type) {
    if (window.__isGameMuted) return;
    try {
      var ctx = getSharedAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function(){});
      }
      var now = ctx.currentTime;

      // Play helper: tone generator with envelope
      function playTone(freq, duration, delay, waveType, peakGain) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = waveType || 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(peakGain || 0.2, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.05);
      }

      var normType = String(type || '').toLowerCase();

      if (normType === 'correct' || normType === 'right' || normType === 'success') {
        // Joyful ascending arpeggio chime: C5 -> E5 -> G5 -> C6 (sparkling celebration bells)
        playTone(523.25, 0.16, 0, 'triangle', 0.22);
        playTone(659.25, 0.16, 0.07, 'triangle', 0.24);
        playTone(783.99, 0.18, 0.14, 'triangle', 0.26);
        playTone(1046.50, 0.40, 0.21, 'sine', 0.30);
        // Sparkle harmonic
        playTone(2093.00, 0.25, 0.25, 'sine', 0.10);
      } else if (normType === 'wrong' || normType === 'incorrect' || normType === 'error' || normType === 'fail') {
        // Cute cartoon boing / spring wobble (low pitch slide with funny vibrato, encouraging not harsh)
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.28);
        
        var lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(18, now);
        lfoGain.gain.setValueAtTime(22, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + 0.32);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (normType === 'start' || normType === 'intro' || normType === 'begin') {
        // Cheerful game intro fanfare: G4 -> C5 -> E5 -> G5
        playTone(392.00, 0.12, 0, 'triangle', 0.20);
        playTone(523.25, 0.14, 0.09, 'triangle', 0.22);
        playTone(659.25, 0.16, 0.18, 'triangle', 0.24);
        playTone(783.99, 0.45, 0.27, 'sine', 0.28);
      } else if (normType === 'win' || normType === 'victory' || normType === 'complete' || normType === 'finish') {
        // Grand victory celebration fanfare (Tadaaa! C5-E5-G5-C6 with confetti chime chords)
        playTone(523.25, 0.20, 0, 'triangle', 0.22);
        playTone(659.25, 0.20, 0.06, 'triangle', 0.22);
        playTone(783.99, 0.22, 0.14, 'triangle', 0.25);
        playTone(1046.50, 0.65, 0.22, 'sine', 0.32);
        playTone(1318.51, 0.65, 0.26, 'triangle', 0.22);
        playTone(1567.98, 0.40, 0.45, 'sine', 0.16);
        playTone(2093.00, 0.50, 0.55, 'sine', 0.20);
      } else if (normType === 'streak' || normType === 'combo') {
        // Rapid magical sparkle chime for streak
        playTone(659.25, 0.10, 0, 'sine', 0.18);
        playTone(783.99, 0.10, 0.06, 'sine', 0.20);
        playTone(1046.50, 0.12, 0.12, 'sine', 0.22);
        playTone(1318.51, 0.25, 0.18, 'sine', 0.24);
      } else if (normType === 'tick') {
        // Gentle woodblock clock tick
        playTone(1200, 0.04, 0, 'sine', 0.08);
      } else {
        // Default 'click' / 'pop' / 'tap' / 'select': Juicy cute bubble pop!
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch(e) {}
  };

  window.playSound = window.playGameSound;
  window.playSoundSafely = window.playGameSound;
  window.playAudio = window.playGameSound;
  window.playSfx = window.playGameSound;
  window.sfx = {
    correct: function() { window.playGameSound('correct'); },
    wrong: function() { window.playGameSound('wrong'); },
    click: function() { window.playGameSound('click'); },
    pop: function() { window.playGameSound('click'); },
    start: function() { window.playGameSound('start'); },
    win: function() { window.playGameSound('win'); },
    victory: function() { window.playGameSound('win'); },
    streak: function() { window.playGameSound('streak'); },
    tick: function() { window.playGameSound('tick'); }
  };

  // 3. Question & Answer Detailed Tracker
  window.__eduAnswersHistory = [];

  window.recordAnswer = function(question, studentAnswer, correctAnswer, isCorrect, explanation) {
    try {
      window.__eduAnswersHistory.push({
        questionIndex: window.__eduAnswersHistory.length + 1,
        question: question || "",
        studentAnswer: studentAnswer || "",
        correctAnswer: correctAnswer || "",
        isCorrect: !!isCorrect,
        explanation: explanation || ""
      });
    } catch(e) {}
  };

  // 4. Standard Game Result Reporter
  window.reportGameResult = function(score, maxScore, customAnswers) {
    try {
      var answers = customAnswers || window.__eduAnswersHistory || [];
      var totalQ = answers.length;
      var correctQ = answers.filter(function(a){ return a.isCorrect; }).length;
      var wrongQ = totalQ - correctQ;

      window.parent.postMessage({
        type: 'GAME_COMPLETE',
        score: Number(score) || 0,
        maxScore: Number(maxScore) || 100,
        totalQuestions: totalQ,
        correctCount: correctQ,
        wrongCount: wrongQ,
        answers: answers
      }, '*');
    } catch(e) {
      console.warn('postMessage error', e);
    }
  };

  // Pre-warm audio on first interaction & Auto Attach Click Sounds
  function warmUp() {
    getSharedAudioCtx();
    window.removeEventListener('pointerdown', warmUp);
    window.removeEventListener('keydown', warmUp);
  }
  window.addEventListener('pointerdown', warmUp, { passive: true });
  window.addEventListener('keydown', warmUp, { passive: true });

  // Floating Sound Toggle & Auto Click Sounds when DOM is ready
  function initGameAudioUI() {
    try {
      // Auto attach joyful pop sound to any button click
      document.addEventListener('click', function(e) {
        var target = e.target;
        if (target && (target.tagName === 'BUTTON' || target.closest('button') || target.classList.contains('option-btn') || target.getAttribute('role') === 'button')) {
          if (target.id !== 'edu-sound-toggle') {
            window.playGameSound('click');
          }
        }
      }, true);

      // Create cute floating sound toggle (🔊 / 🔇)
      if (!document.getElementById('edu-sound-toggle')) {
        var btn = document.createElement('button');
        btn.id = 'edu-sound-toggle';
        btn.type = 'button';
        btn.title = 'Bật / Tắt âm thanh trò chơi';
        btn.innerHTML = '🔊';
        btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.95);border:2px solid #f59e0b;box-shadow:0 3px 10px rgba(0,0,0,0.15);font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.15s ease;outline:none;user-select:none;backdrop-filter:blur(4px);';
        btn.onmouseenter = function() { btn.style.transform = 'scale(1.12)'; };
        btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; };
        btn.onclick = function(e) {
          e.stopPropagation();
          window.__isGameMuted = !window.__isGameMuted;
          btn.innerHTML = window.__isGameMuted ? '🔇' : '🔊';
          btn.style.borderColor = window.__isGameMuted ? '#94a3b8' : '#f59e0b';
          btn.style.opacity = window.__isGameMuted ? '0.7' : '1';
          if (!window.__isGameMuted) {
            window.playGameSound('click');
          }
        };
        document.body.appendChild(btn);
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGameAudioUI);
  } else {
    initGameAudioUI();
  }
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
  systemInstruction?: string,
  extraConfig?: any
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
        ...extraConfig,
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

export interface StudentAnswerItem {
  questionIndex: number;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface StudentSubmission {
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

// Direct HTML delivery (guarantees zero-friction execution in any browser/iframe)
app.get("/api/published-games/:id/raw", (req, res) => {
  const games = loadPublishedGames();
  const game = games.find((g) => g.id === req.params.id);
  if (!game) {
    return res.status(404).send("Không tìm thấy trò chơi");
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(game.htmlContent);
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
    const { 
      studentName, 
      studentClass, 
      score = 0, 
      maxScore = 100, 
      timeSpentSeconds = 0,
      correctCount,
      wrongCount,
      totalQuestions,
      answers = []
    } = req.body;

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

    const totalQ = totalQuestions !== undefined ? Number(totalQuestions) : (Array.isArray(answers) ? answers.length : 0);
    const correctQ = correctCount !== undefined ? Number(correctCount) : (Array.isArray(answers) ? answers.filter((a: any) => a.isCorrect).length : 0);
    const wrongQ = wrongCount !== undefined ? Number(wrongCount) : (totalQ > 0 ? totalQ - correctQ : 0);

    const submission: StudentSubmission = {
      id: "sub-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
      studentName: studentName.trim(),
      studentClass: studentClass && studentClass.trim() ? studentClass.trim() : (game.className || ""),
      score: numScore,
      maxScore: numMaxScore,
      accuracy,
      gradeLabel,
      correctCount: correctQ,
      wrongCount: wrongQ,
      totalQuestions: totalQ,
      answers: Array.isArray(answers) ? answers : [],
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

// Xóa tất cả kết quả của 1 trò chơi
app.delete("/api/published-games/:id/submissions", (req, res) => {
  try {
    const games = loadPublishedGames();
    const game = games.find((g) => g.id === req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: "Không tìm thấy trò chơi" });
    }
    const count = (game.submissions || []).length;
    game.submissions = [];
    savePublishedGames(games);
    res.json({ success: true, message: `Đã xóa tất cả ${count} kết quả học sinh`, deletedCount: count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Lỗi khi xóa kết quả" });
  }
});

// Xóa kết quả tùy chọn (batch delete by subIds)
app.post("/api/published-games/:id/submissions/delete-batch", (req, res) => {
  try {
    const { subIds } = req.body;
    if (!Array.isArray(subIds) || subIds.length === 0) {
      return res.status(400).json({ success: false, error: "Danh sách kết quả cần xóa rỗng" });
    }
    const games = loadPublishedGames();
    const game = games.find((g) => g.id === req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: "Không tìm thấy trò chơi" });
    }

    const set = new Set(subIds);
    const beforeCount = (game.submissions || []).length;
    game.submissions = (game.submissions || []).filter((s) => !set.has(s.id));
    const deletedCount = beforeCount - game.submissions.length;
    savePublishedGames(games);

    res.json({ success: true, message: `Đã xóa ${deletedCount} kết quả được chọn`, deletedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Lỗi khi xóa kết quả đã chọn" });
  }
});

// Xóa 1 kết quả cụ thể theo subId
app.delete("/api/published-games/:id/submissions/:subId", (req, res) => {
  try {
    const games = loadPublishedGames();
    const game = games.find((g) => g.id === req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: "Không tìm thấy trò chơi" });
    }
    const beforeCount = (game.submissions || []).length;
    game.submissions = (game.submissions || []).filter((s) => s.id !== req.params.subId);
    if (game.submissions.length === beforeCount) {
      return res.status(404).json({ success: false, error: "Không tìm thấy kết quả để xóa" });
    }
    savePublishedGames(games);
    res.json({ success: true, message: "Đã xóa kết quả thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Lỗi khi xóa kết quả" });
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
    const { fileBase64, mimeType, fileName, textContent, files } = req.body;

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

    if (Array.isArray(files) && files.length > 0) {
      const inlineParts = files
        .filter((f: any) => f.fileBase64 && f.mimeType)
        .map((f: any) => ({
          inlineData: {
            mimeType: f.mimeType === "application/pdf" ? "application/pdf" : f.mimeType,
            data: f.fileBase64,
          },
        }));

      const textParts = files
        .filter((f: any) => f.textContent && f.textContent.trim())
        .map((f: any, idx: number) => `\n[Trang/Tài liệu ${idx + 1}: ${f.fileName || ""}]\n${f.textContent}\n`)
        .join("\n");

      if (inlineParts.length === 0 && !textParts.trim()) {
        return res.status(400).json({ error: "Không tìm thấy dữ liệu ảnh hoặc chữ trong các file đã tải lên." });
      }

      const multiPrompt = `${extractionPrompt}\n\nCHÚ Ý ĐẶC BIỆT: Giáo viên đã tải lên ${files.length} ảnh/tài liệu trang sách giáo khoa. Hãy đọc kỹ TẤT CẢ ${inlineParts.length} trang/ảnh được đính kèm ở trên và tổng hợp toàn bộ câu hỏi, bài tập có trong tất cả các trang sách đó.${textParts ? `\n\nNỘI DUNG VĂN BẢN ĐÍNH KÈM:\n${textParts}` : ""}`;

      contents = [
        ...inlineParts,
        { text: multiPrompt },
      ];
    } else if (fileBase64 && mimeType) {
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
      return res.status(400).json({ error: "Thiếu dữ liệu fileBase64, textContent hoặc danh sách files" });
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

function getSmartFallbackSuggestions(lessonText: string) {
  const lower = (lessonText || "").toLowerCase();
  
  if (lower.includes("toán") || lower.includes("phép") || lower.includes("phân số") || lower.includes("cộng") || lower.includes("trừ") || lower.includes("nhân") || lower.includes("chia") || lower.includes("hình") || lower.includes("diện tích") || lower.includes("chu vi") || lower.includes("số học") || lower.includes("phương trình") || lower.includes("mệnh đề")) {
    return [
      {
        loai: "Trắc nghiệm Tính Nhanh SGK",
        moTa: "Thử thách trắc nghiệm 4 phương án tương tác nhanh, có âm thanh chuông đúng và giải thích bước giải chi tiết bám sát SGK.",
        doKho: "Dễ",
        thoiGian: "5 phút",
        icon: "⚡",
        mauSac: "from-amber-400 to-orange-500",
      },
      {
        loai: "Nối Cặp Phép Tính & Kết Quả",
        moTa: "Nối phép tính với kết quả hoặc công thức tương ứng ở hai cột bằng cơ chế Click-to-Pair mượt mà 60 FPS.",
        doKho: "Trung bình",
        thoiGian: "6 phút",
        icon: "🗂️",
        mauSac: "from-emerald-400 to-teal-500",
      },
      {
        loai: "Đúng hay Sai Thử Thách",
        moTa: "Phân tích nhanh các mệnh đề toán học, bấm Đúng hoặc Sai trong 1 chạm kèm tiếng boing hoạt hình và gợi ý khắc phục.",
        doKho: "Dễ",
        thoiGian: "4 phút",
        icon: "⚖️",
        mauSac: "from-indigo-500 to-purple-600",
      },
    ];
  }

  if (lower.includes("tiếng việt") || lower.includes("danh từ") || lower.includes("động từ") || lower.includes("tính từ") || lower.includes("so sánh") || lower.includes("nhân hóa") || lower.includes("chính tả") || lower.includes("văn") || lower.includes("đọc") || lower.includes("từ vựng")) {
    return [
      {
        loai: "Trắc nghiệm Tiếng Việt & Từ Vựng",
        moTa: "Đố vui trắc nghiệm nhận diện biện pháp tu từ, từ loại, mở rộng vốn từ bám sát bài đọc SGK sinh động.",
        doKho: "Dễ",
        thoiGian: "5 phút",
        icon: "📖",
        mauSac: "from-rose-400 to-pink-500",
      },
      {
        loai: "Điền Từ Vào Chỗ Trống",
        moTa: "Ngân hàng từ khóa sinh động, học sinh bấm chọn từ thích hợp để hoàn thiện câu thơ, thành ngữ chuẩn xác.",
        doKho: "Trung bình",
        thoiGian: "6 phút",
        icon: "📝",
        mauSac: "from-indigo-500 to-purple-600",
      },
      {
        loai: "Phân Loại Từ Ngữ & Ngữ Pháp",
        moTa: "Phân chia các từ vào nhóm Danh từ, Động từ, Tính từ hoặc Từ đồng nghĩa - trái nghĩa mượt mà trực quan.",
        doKho: "Trung bình",
        thoiGian: "7 phút",
        icon: "🧩",
        mauSac: "from-emerald-400 to-teal-500",
      },
    ];
  }

  if (lower.includes("khoa học") || lower.includes("tự nhiên") || lower.includes("nước") || lower.includes("không khí") || lower.includes("ánh sáng") || lower.includes("sinh vật") || lower.includes("thực vật") || lower.includes("động vật") || lower.includes("môi trường")) {
    return [
      {
        loai: "Khám Phá Khoa Học Tương Tác",
        moTa: "Hệ thống câu hỏi trắc nghiệm khám phá quy luật tự nhiên, vòng tuần hoàn của nước và thế giới sinh vật xung quanh.",
        doKho: "Dễ",
        thoiGian: "5 phút",
        icon: "🔬",
        mauSac: "from-emerald-400 to-teal-500",
      },
      {
        loai: "Đúng hay Sai Khoa Học Thường Thức",
        moTa: "Phán đoán hiện tượng khoa học Đúng hay Sai, củng cố kiến thức thực tế với giải thích khoa học dễ hiểu.",
        doKho: "Dễ",
        thoiGian: "4 phút",
        icon: "🌱",
        mauSac: "from-blue-400 to-indigo-500",
      },
      {
        loai: "Nối Cặp Khái Niệm & Hiện Tượng",
        moTa: "Nối đặc tính của chất, nguồn năng lượng và hiện tượng tự nhiên tương ứng với hình ảnh minh họa sinh động.",
        doKho: "Trung bình",
        thoiGian: "6 phút",
        icon: "🌍",
        mauSac: "from-amber-400 to-orange-500",
      },
    ];
  }

  return [
    {
      loai: "Trắc nghiệm Vui Nhộn Bám Sát SGK",
      moTa: "Hệ thống câu hỏi 4 lựa chọn trực quan, âm thanh vui tươi, phản hồi tức thì và chỉ rõ câu sai kèm gợi ý giải.",
      doKho: "Dễ",
      thoiGian: "5 phút",
      icon: "🎯",
      mauSac: "from-indigo-500 to-purple-600",
    },
    {
      loai: "Nối Cặp Thuật Ngữ & Khái Niệm",
      moTa: "Ghép đôi các thẻ từ khóa, kiến thức cốt lõi và bài tập bằng cơ chế Click-to-Pair mượt mà 60 FPS.",
      doKho: "Trung bình",
      thoiGian: "6 phút",
      icon: "🧩",
      mauSac: "from-emerald-400 to-teal-500",
    },
    {
      loai: "Đúng hay Sai & Khám Phá Bài Học",
      moTa: "Đọc nhận định từ bài học SGK và đưa ra quyết định Đúng / Sai trong 1 chạm kèm lời giải thích khắc sâu kiến thức.",
      doKho: "Dễ",
      thoiGian: "4 phút",
      icon: "⚖️",
      mauSac: "from-amber-400 to-rose-500",
    },
  ];
}

// 3. Generate suggestions (Ultra-fast & Fail-proof)
app.post("/api/generate-suggestions", async (req, res) => {
  try {
    const { lessonText } = req.body;
    if (!lessonText || !lessonText.trim()) {
      return res.status(400).json({ error: "Thiếu nội dung giáo án" });
    }

    const trimmedLesson = lessonText.trim().substring(0, 1500);

    const prompt = `Bạn là Chuyên gia Giáo dục Tiểu học tại Trường Tiểu học Lạc Long Quân.
Dựa vào nội dung giáo án và câu hỏi bên dưới, hãy đề xuất đúng 3 loại mini game HTML5 vui nhộn, hấp dẫn và phù hợp nhất cho học sinh.
Trả về đúng 1 JSON array gồm đúng 3 object:
[
  {
    "loai": "Tên loại game ngắn gọn (vd: Trắc nghiệm Tính Nhanh, Nối Cặp Khái Niệm, Đúng/Sai Thử Thách, Điền Từ)",
    "moTa": "Mô tả ngắn gọn cách chơi hấp dẫn (1-2 câu)",
    "doKho": "Dễ" | "Trung bình" | "Khó",
    "thoiGian": "4 phút" | "5 phút" | "7 phút",
    "icon": "1 emoji vui nhộn",
    "mauSac": "from-amber-400 to-orange-500" hoặc "from-emerald-400 to-teal-500" hoặc "from-indigo-500 to-purple-600" hoặc "from-rose-400 to-pink-500"
  }
]
BẮT BUỘC CHỈ TRẢ VỀ JSON ARRAY HỢP LỆ.

NỘI DUNG GIÁO ÁN VÀ BÀI TẬP:
${trimmedLesson}`;

    try {
      // 4.5s timeout race for ultra-smooth instant user experience
      const aiPromise = callGemini([{ text: prompt }], "Bạn là Chuyên gia Giáo dục đề xuất mini game dạng JSON array.", {
        temperature: 0.5,
        maxOutputTokens: 500,
      });

      const timeoutPromise = new Promise<{ text: string; modelUsed: string }>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout AI suggestion")), 4500)
      );

      const result = await Promise.race([aiPromise, timeoutPromise]);
      let cleanJson = result.text.trim();
      cleanJson = cleanJson.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

      const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
      let data = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);

      if (!Array.isArray(data) || data.length === 0) {
        data = getSmartFallbackSuggestions(lessonText);
      }

      return res.json({ success: true, suggestions: data, modelUsed: result.modelUsed });
    } catch (aiErr: any) {
      console.warn("[generate-suggestions] Fast fallback triggered:", aiErr.message || aiErr);
      const fallback = getSmartFallbackSuggestions(lessonText);
      return res.json({ success: true, suggestions: fallback, modelUsed: "smart-educational-fallback" });
    }
  } catch (err: any) {
    console.error("[API generate-suggestions error]", err);
    const fallback = getSmartFallbackSuggestions(req.body?.lessonText || "");
    res.json({ success: true, suggestions: fallback, modelUsed: "smart-educational-fallback" });
  }
});

function getSmartFallbackQuestions(topic: string, grade: string, subject: string, count: number): any[] {
  const safeTopic = topic || "Kiến thức bài học SGK";
  const safeGrade = grade || "Tiểu học";
  const safeSubject = subject || "Toán";
  const lowerSub = safeSubject.toLowerCase();
  
  let sampleTemplates: any[] = [];

  if (lowerSub.includes("toán")) {
    sampleTemplates = [
      {
        q: `Trong bài học "${safeTopic}" (${safeSubject} ${safeGrade}), khi thực hiện giải bài toán, bước đầu tiên quan trọng nhất là gì?`,
        opts: [
          "A. Đọc kỹ đề bài, xác định dữ kiện đã cho và câu hỏi cần tìm",
          "B. Đoán kết quả mà không cần tính toán",
          "C. Chỉ quan sát các số liệu cuối cùng",
          "D. Bỏ qua bước kiểm tra lại kết quả"
        ],
        ans: "A",
        exp: "Đọc kỹ đề và xác định đúng dữ kiện đã cho cùng yêu cầu bài toán là nền tảng cốt lõi của môn Toán.",
        diff: "Nhận biết"
      },
      {
        q: `Áp dụng quy tắc của chủ đề "${safeTopic}", phương án nào dưới đây là ĐÚNG về phương pháp tính?`,
        opts: [
          "A. Thực hiện theo đúng thứ tự phép tính và quy tắc toán học chuẩn",
          "B. Có thể tính tùy tiện từ phải sang trái",
          "C. Không cần đưa về cùng một đơn vị đo khi tính",
          "D. Luôn làm tròn số ngay từ bước đầu tiên"
        ],
        ans: "A",
        exp: "Tuân thủ thứ tự thực hiện phép tính và cùng đơn vị đo giúp kết quả luôn chính xác 100%.",
        diff: "Thông hiểu"
      },
      {
        q: `Em hãy chọn khẳng định ĐÚNG nhất về ý nghĩa thực tế của chủ đề "${safeTopic}":`,
        opts: [
          "A. Giúp học sinh tính toán chuẩn xác, ứng dụng vào mua sắm, đo lường và đời sống",
          "B. Chỉ dùng để ghi chép vào vở mà không áp dụng được vào thực tế",
          "C. Kết quả tính toán không cần độ chính xác cao",
          "D. Không liên quan gì đến các lớp học tiếp theo"
        ],
        ans: "A",
        exp: "Toán học tiểu học gắn liền mật thiết với các hoạt động đời sống thực tế của học sinh.",
        diff: "Thông hiểu"
      },
      {
        q: `Khi gặp một bài toán nâng cao liên quan đến "${safeTopic}", cách tư duy hiệu quả nhất là:`,
        opts: [
          "A. Tóm tắt bài toán bằng sơ đồ đoạn thẳng hoặc bảng số liệu rồi tìm lời giải",
          "B. Bỏ cuộc ngay khi chưa thử tính toán",
          "C. Chọn một đáp án bất kỳ mà không cần suy luận",
          "D. Đổi đề bài sang bài toán khác dễ hơn"
        ],
        ans: "A",
        exp: "Tóm tắt bài toán bằng sơ đồ đoạn thẳng hoặc bảng giúp học sinh nhìn rõ mối quan hệ giữa các đại lượng.",
        diff: "Vận dụng"
      },
      {
        q: `Sau khi giải xong bài tập về "${safeTopic}", thao tác nào sau đây thể hiện học sinh cẩn thận?`,
        opts: [
          "A. Thử lại kết quả vào đề bài và ghi rõ danh số (đơn vị đo) kèm đáp số",
          "B. Đóng vở ngay lập tức mà không cần rà soát lại",
          "C. Tẩy xóa lung tung trên bài làm",
          "D. Không cần ghi đáp số"
        ],
        ans: "A",
        exp: "Kiểm tra lại bài làm và ghi đầy đủ đơn vị đo là thói quen học tập rất đáng khen của học sinh Lạc Long Quân.",
        diff: "Vận dụng"
      }
    ];
  } else if (lowerSub.includes("tiếng việt") || lowerSub.includes("văn")) {
    sampleTemplates = [
      {
        q: `Trong bài học "${safeTopic}" (${safeSubject} ${safeGrade}), nội dung kiến thức trọng tâm là gì?`,
        opts: [
          "A. Nắm vững quy tắc chính tả, nghĩa của từ ngữ và cách diễn đạt trong sáng",
          "B. Chỉ cần nhớ mặt chữ mà không cần hiểu nghĩa",
          "C. Viết hoa tùy ý không theo quy tắc ngữ pháp",
          "D. Dùng từ ngữ thiếu lịch sự khi giao tiếp"
        ],
        ans: "A",
        exp: "Môn Tiếng Việt rèn luyện khả năng dùng từ, đặt câu chuẩn xác và bồi dưỡng tình yêu tiếng mẹ đẻ.",
        diff: "Nhận biết"
      },
      {
        q: `Để câu văn trở nên sinh động và giàu hình ảnh khi học về "${safeTopic}", em nên:`,
        opts: [
          "A. Vận dụng linh hoạt các từ ngữ gợi cảm và biện pháp tu từ phù hợp (so sánh, nhân hóa)",
          "B. Chỉ dùng các câu ngắn cụt lủn không có cảm xúc",
          "C. Lặp lại một từ nhiều lần trong cùng một câu",
          "D. Không sử dụng dấu câu ngăn cách các vế"
        ],
        ans: "A",
        exp: "Sử dụng từ ngữ gợi tả và hình ảnh so sánh, nhân hóa giúp bài văn thêm sinh động và giàu cảm xúc.",
        diff: "Thông hiểu"
      },
      {
        q: `Khi viết câu liên quan đến chủ đề "${safeTopic}", việc sử dụng dấu câu đúng có tác dụng gì?`,
        opts: [
          "A. Giúp câu văn rõ ràng, mạch lạc, người đọc hiểu đúng ý người viết",
          "B. Dấu câu chỉ dùng để trang trí không có ý nghĩa gì",
          "C. Có thể bỏ qua dấu chấm ở cuối câu",
          "D. Đặt dấu câu ngẫu nhiên ở vị trí bất kỳ"
        ],
        ans: "A",
        exp: "Dấu câu giúp ngắt nghỉ nhịp nhàng và thể hiện đúng mục đích nói của câu (kể, hỏi, cảm thán, cầu khiến).",
        diff: "Thông hiểu"
      },
      {
        q: `Áp dụng chủ đề "${safeTopic}", từ ngữ nào sau đây thể hiện thái độ tích cực và chuẩn mực?`,
        opts: [
          "A. Lễ phép, chăm chỉ, yêu thương bạn bè và kính trọng thầy cô",
          "B. Lười biếng, hay cãi lời người lớn",
          "C. Tự ti, ngại giao tiếp với mọi người",
          "D. Nói trống không khi nói chuyện với người lớn"
        ],
        ans: "A",
        exp: "Vốn từ ngữ bồi dưỡng nhân cách tốt đẹp và giao tiếp văn minh cho học sinh.",
        diff: "Vận dụng"
      },
      {
        q: `Tìm cách diễn đạt đúng và hay nhất về chủ đề "${safeTopic}":`,
        opts: [
          "A. Câu văn đầy đủ thành phần chủ ngữ - vị ngữ, dùng từ chuẩn xác",
          "B. Câu thiếu chủ ngữ không rõ ai thực hiện hành động",
          "C. Câu sai quy tắc chính tả cơ bản",
          "D. Dùng từ địa phương gây hiểu nhầm trong văn bản chung"
        ],
        ans: "A",
        exp: "Một câu văn chuẩn mực cần có đầy đủ thành phần ngữ pháp và dùng từ đúng ngữ cảnh.",
        diff: "Vận dụng"
      }
    ];
  } else if (lowerSub.includes("khoa học") || lowerSub.includes("tự nhiên")) {
    sampleTemplates = [
      {
        q: `Trong chủ đề "${safeTopic}" (${safeSubject} ${safeGrade}), hiện tượng tự nhiên hoặc quy luật nào sau đây là ĐÚNG?`,
        opts: [
          "A. Các sự vật, hiện tượng trong tự nhiên luôn có mối liên hệ mật thiết và vận động không ngừng",
          "B. Tự nhiên tồn tại độc lập hoàn toàn và không chịu tác động nào",
          "C. Con người không cần phải bảo vệ môi trường xung quanh",
          "D. Nguồn tài nguyên thiên nhiên là vô tận không bao giờ cạn kiệt"
        ],
        ans: "A",
        exp: "Khoa học chứng minh mọi sinh vật và môi trường sống luôn có sự gắn kết và tương tác lẫn nhau.",
        diff: "Nhận biết"
      },
      {
        q: `Để bảo vệ sức khỏe và môi trường sống liên quan đến chủ đề "${safeTopic}", hành động nào là đúng đắn?`,
        opts: [
          "A. Giữ gìn vệ sinh sạch sẽ, tiết kiệm tài nguyên và bảo vệ cây xanh",
          "B. Xả rác bừa bãi ra sông ngòi và đường phố",
          "C. Lãng phí nước sạch và điện sinh hoạt",
          "D. Bẻ cành hái hoa nơi công cộng"
        ],
        ans: "A",
        exp: "Bảo vệ môi trường và sử dụng tiết kiệm tài nguyên là trách nhiệm của mỗi công dân nhỏ tuổi.",
        diff: "Thông hiểu"
      },
      {
        q: `Hiện tượng khoa học nào sau đây diễn ra đúng như đã học trong chủ đề "${safeTopic}"?`,
        opts: [
          "A. Tuân theo các quy luật vật lý, hóa học hoặc sinh học tự nhiên",
          "B. Tự nhiên thay đổi do các yếu tố mê tín dị đoan",
          "C. Mọi chất đều có tính chất giống hệt nhau",
          "D. Nhiệt độ không ảnh hưởng đến sự biến đổi trạng thái của chất"
        ],
        ans: "A",
        exp: "Kiến thức khoa học giúp các em hiểu rõ bản chất của các hiện tượng diễn ra xung quanh mình.",
        diff: "Thông hiểu"
      },
      {
        q: `Khi tiến hành quan sát hoặc làm thí nghiệm đơn giản về "${safeTopic}", em cần chú ý điều gì?`,
        opts: [
          "A. Tuân thủ hướng dẫn an toàn của thầy cô, quan sát cẩn thận và ghi chép trung thực",
          "B. Tự ý chạm vào hóa chất hoặc nguồn nhiệt khi chưa được phép",
          "C. Vừa làm thí nghiệm vừa đùa nghịch với bạn",
          "D. Bịa đặt số liệu khi chưa quan sát thực tế"
        ],
        ans: "A",
        exp: "An toàn và trung thực là hai phẩm chất cốt lõi khi học tập và thực hành khoa học.",
        diff: "Vận dụng"
      }
    ];
  } else if (lowerSub.includes("lịch sử") || lowerSub.includes("địa lý") || lowerSub.includes("địa lí")) {
    sampleTemplates = [
      {
        q: `Nội dung cốt lõi của chủ đề "${safeTopic}" (${safeSubject} ${safeGrade}) nhắc nhở chúng ta điều gì?`,
        opts: [
          "A. Tự hào về truyền thống yêu nước, cội nguồn dân tộc và vẻ đẹp gấm vóc của quê hương Việt Nam",
          "B. Lịch sử là những câu chuyện không còn giá trị trong hiện tại",
          "C. Không cần tìm hiểu về các vùng miền trên đất nước",
          "D. Quên đi công lao của thế hệ cha ông đi trước"
        ],
        ans: "A",
        exp: "Lịch sử và Địa lý bồi dưỡng lòng yêu nước, niềm tự hào dân tộc và ý thức bảo vệ chủ quyền Tổ quốc.",
        diff: "Nhận biết"
      },
      {
        q: `Khi tìm hiểu về địa lý hoặc di tích lịch sử trong "${safeTopic}", phương tiện trực quan nào hỗ trợ tốt nhất?`,
        opts: [
          "A. Bản đồ, lược đồ, quả Địa cầu và tranh ảnh tư liệu lịch sử",
          "B. Chỉ dùng trí tưởng tượng mà không cần bản đồ",
          "C. Đọc các thông tin chưa được kiểm chứng trên mạng xã hội",
          "D. Bỏ qua các mốc thời gian lịch sử quan trọng"
        ],
        ans: "A",
        exp: "Bản đồ và hiện vật lịch sử giúp chúng ta hình dung chính xác không gian và thời gian diễn ra sự kiện.",
        diff: "Thông hiểu"
      },
      {
        q: `Học sinh Trường Tiểu học Lạc Long Quân thể hiện lòng biết ơn các thế hệ cha anh qua chủ đề "${safeTopic}" bằng cách nào?`,
        opts: [
          "A. Chăm ngoan, học giỏi, giữ gìn cảnh quan di tích và rèn luyện đạo đức tốt",
          "B. Vẽ bậy lên các bia đá và di tích lịch sử",
          "C. Không tham gia các hoạt động đền ơn đáp nghĩa",
          "D. Thờ ơ với các ngày lễ kỷ niệm của dân tộc"
        ],
        ans: "A",
        exp: "Học tập tốt và gìn giữ truyền thống là hành động thiết thực nhất để tri ân các thế hệ tiền nhân.",
        diff: "Vận dụng"
      }
    ];
  } else if (lowerSub.includes("tiếng anh") || lowerSub.includes("english")) {
    sampleTemplates = [
      {
        q: `Which sentence is CORRECT regarding the topic "${safeTopic}" (${safeSubject} - ${safeGrade})?`,
        opts: [
          "A. Using correct vocabulary and sentence patterns in everyday communication.",
          "B. English words do not follow any spelling or pronunciation rules.",
          "C. We only need to memorize grammar without practicing speaking.",
          "D. Pronunciation does not matter when talking to others."
        ],
        ans: "A",
        exp: "Practicing correct pronunciation and sentence structures helps students communicate confidently.",
        diff: "Nhận biết"
      },
      {
        q: `Choose the best response when practicing "${safeTopic}":`,
        opts: [
          "A. Practice speaking fluently and listening attentively to teachers and friends.",
          "B. Stay quiet and never try to speak English.",
          "C. Guess words randomly without looking at pictures.",
          "D. Speak very fast without clear pronunciation."
        ],
        ans: "A",
        exp: "Listening and repeating actively is the most effective way to master primary English.",
        diff: "Thông hiểu"
      },
      {
        q: `In the lesson "${safeTopic}", which activity helps you remember words longer?`,
        opts: [
          "A. Playing interactive vocabulary games and using flashcards with pictures.",
          "B. Copying words without understanding their meanings.",
          "C. Forgetting to review new words after class.",
          "D. Refusing to sing English songs."
        ],
        ans: "A",
        exp: "Games and visual flashcards create joy and long-term memory for young language learners.",
        diff: "Vận dụng"
      }
    ];
  } else if (lowerSub.includes("tin học")) {
    sampleTemplates = [
      {
        q: `Trong bài học "${safeTopic}" (${safeSubject} ${safeGrade}), quy tắc an toàn và văn minh khi dùng máy tính là gì?`,
        opts: [
          "A. Giữ đúng tư thế ngồi, bảo vệ mắt và không truy cập vào các trang web lạ",
          "B. Ngồi quá sát màn hình và chơi game liên tục nhiều giờ",
          "C. Chia sẻ mật khẩu tài khoản cho người lạ trên mạng",
          "D. Đập mạnh tay lên bàn phím khi máy tính bị chậm"
        ],
        ans: "A",
        exp: "Tuân thủ an toàn vệ sinh lao động số và bảo mật thông tin cá nhân là kỹ năng sống rất quan trọng.",
        diff: "Nhận biết"
      },
      {
        q: `Khi thực hành phần mềm trong chủ đề "${safeTopic}", thao tác nào giúp em không bị mất dữ liệu bài tập?`,
        opts: [
          "A. Thường xuyên nhấn nút Lưu (Save / Ctrl+S) vào đúng thư mục của mình",
          "B. Tắt máy đột ngột bằng cách rút dây cắm điện",
          "C. Xóa các tệp tin trong thư mục của bạn khác",
          "D. Đặt tên tệp tùy tiện có dấu cách không kiểm soát"
        ],
        ans: "A",
        exp: "Thói quen lưu bài (Save) thường xuyên giúp học sinh bảo vệ thành quả học tập của mình.",
        diff: "Thông hiểu"
      },
      {
        q: `Tư duy máy tính và lập trình trong "${safeTopic}" rèn luyện cho học sinh điều gì?`,
        opts: [
          "A. Khả năng tư duy logic, giải quyết vấn đề theo từng bước rõ ràng và sáng tạo",
          "B. Chỉ phục vụ cho việc giải trí đơn thuần",
          "C. Không cần suy nghĩ trước khi thao tác",
          "D. Làm cho học sinh lười suy nghĩ"
        ],
        ans: "A",
        exp: "Tin học giúp phát triển năng lực tư duy sáng tạo và giải quyết vấn đề có phương pháp.",
        diff: "Vận dụng"
      }
    ];
  } else {
    // Đạo đức & Hoạt động trải nghiệm
    sampleTemplates = [
      {
        q: `Thông điệp ý nghĩa nhất mà bài học "${safeTopic}" (${safeSubject} ${safeGrade}) muốn gửi gắm là:`,
        opts: [
          "A. Rèn luyện phẩm chất tốt đẹp: Lễ phép, trung thực, trách nhiệm và yêu thương mọi người",
          "B. Chỉ quan tâm đến bản thân mà không cần giúp đỡ ai",
          "C. Không cần tuân theo nội quy trường lớp",
          "D. Nói lời không giữ lời hứa"
        ],
        ans: "A",
        exp: "Mỗi bài học Đạo đức giúp các em hoàn thiện nhân cách, trở thành con ngoan trò giỏi của trường Lạc Long Quân.",
        diff: "Nhận biết"
      },
      {
        q: `Khi gặp tình huống thực tế liên quan đến "${safeTopic}", cách xử sự văn minh và đúng đắn nhất là:`,
        opts: [
          "A. Bình tĩnh lắng nghe, cư xử hòa nhã, biết nói lời 'Cảm ơn' và 'Xin lỗi'",
          "B. To tiếng tranh cãi và đổ lỗi cho người khác",
          "C. Lờ đi như không có chuyện gì xảy ra",
          "D. Dùng vũ lực để giải quyết mâu thuẫn"
        ],
        ans: "A",
        exp: "Biết lắng nghe và chân thành xin lỗi khi có lỗi là biểu hiện của người có văn hóa và tự trọng.",
        diff: "Thông hiểu"
      },
      {
        q: `Hành động cụ thể của em ở lớp để thực hiện tốt chủ đề "${safeTopic}" là:`,
        opts: [
          "A. Giúp đỡ bạn cùng tiến bộ, giữ gìn vệ sinh lớp học và đoàn kết với bạn bè",
          "B. Phân biệt đối xử và trêu chọc bạn bè",
          "C. Không tham gia vào các hoạt động tập thể",
          "D. Để rác bừa bãi dưới ngăn bàn"
        ],
        ans: "A",
        exp: "Đoàn kết và giúp đỡ nhau trong học tập tạo nên một tập thể lớp hạnh phúc và tiến bộ.",
        diff: "Vận dụng"
      }
    ];
  }

  const results = [];
  const targetCount = Math.min(30, Math.max(1, count || 5));
  for (let i = 0; i < targetCount; i++) {
    const tmpl = sampleTemplates[i % sampleTemplates.length];
    results.push({
      id: i + 1,
      question: `Câu ${i + 1}: ${tmpl.q}`,
      options: tmpl.opts,
      correctAnswer: tmpl.ans,
      explanation: tmpl.exp,
      difficulty: tmpl.diff,
    });
  }
  return results;
}

function buildFormattedTextFromQuestions(topic: string, grade: string, subject: string, questions: any[]): string {
  let text = `BÀI HỌC: ${topic.toUpperCase()}\nMôn: ${subject} - Cấp lớp: ${grade} (Trường Tiểu học Lạc Long Quân)\n\nDANH SÁCH CÂU HỎI & BÀI TẬP TỰ ĐỘNG BIÊN SOẠN BỞI AI:\n`;
  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const diff = q.difficulty ? ` [${q.difficulty}]` : "";
    text += `\nBài ${qNum}${diff}: ${q.question}\n`;
    if (Array.isArray(q.options)) {
      q.options.forEach((opt: string) => {
        text += `  ${opt}\n`;
      });
    }
    text += `=> Đáp án đúng: ${q.correctAnswer}\n`;
    if (q.explanation) {
      text += `=> Gợi ý & Hướng dẫn giải: ${q.explanation}\n`;
    }
  });
  return text;
}

// 3.5. Smart Question Generator by AI (Topic & Grade Level)
app.post("/api/generate-questions", async (req, res) => {
  try {
    const keyCheck = checkGeminiApiKey();
    if (!keyCheck.valid) {
      return res.status(401).json({ success: false, error: keyCheck.error });
    }

    const {
      topic,
      grade = "Lớp 3",
      subject = "Toán",
      questionCount = 5,
      questionType = "Trắc nghiệm 4 đáp án",
      difficulty = "Hỗn hợp phong phú",
      curriculumBook = "Chuẩn Bộ GD&ĐT",
      customNotes = "",
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập chủ đề bài học để AI sinh câu hỏi." });
    }

    const safeCount = Math.min(30, Math.max(1, Number(questionCount) || 5));

    const prompt = `Bạn là Chuyên gia Giáo dục Tiểu học và Biên soạn Đề thi Sách giáo khoa Việt Nam (Bộ GD&ĐT), thuộc Trường Tiểu học Lạc Long Quân.
Nhiệm vụ của bạn: Tự động biên soạn một bộ CHÍNH XÁC ${safeCount} câu hỏi bài tập chất lượng cao, đúng chuẩn kiến thức và kỹ năng cho học sinh tiểu học.

THÔNG TIN BÀI HỌC:
- Môn học: ${subject}
- Cấp lớp: ${grade}
- Chủ đề bài học: "${topic.trim()}"
- Số lượng câu hỏi cần tạo: ${safeCount} câu
- Dạng câu hỏi: ${questionType}
- Mức độ nhận thức: ${difficulty}
- Bộ sách tham chiếu: ${curriculumBook}
${customNotes && customNotes.trim() ? `- Ghi chú thêm từ giáo viên: ${customNotes.trim()}` : ""}

QUY CHUẨN NỘI DUNG SƯ PHẠM (RẤT QUAN TRỌNG):
1. Đúng chuẩn kiến thức và tâm lý lứa tuổi học sinh ${grade}. Từ ngữ trong sáng, chuẩn mực, giàu tính giáo dục, vui tươi, tích cực.
2. Với môn Toán: các phép tính, phân số, hình học, số đo PHẢI chuẩn xác 100%, số liệu thực tế, không sai sót toán học.
3. Với Tiếng Việt: các câu văn, thành ngữ, từ ngữ phải chuẩn chính tả tiếng Việt, giàu hình ảnh, nuôi dưỡng tâm hồn học sinh.
4. Với môn Khoa học / Tự nhiên & Xã hội / Lịch sử & Địa lý: kiến thức khoa học chuẩn mực, gần gũi thực tế.
5. Mỗi câu hỏi BẮT BUỘC có:
   - Đề bài rõ ràng, mạch lạc, có thể kèm 1 emoji minh hoạ ngộ nghĩnh
   - 4 phương án lựa chọn A, B, C, D rõ ràng. Vị trí đáp án đúng PHẢI xáo trộn ngẫu nhiên (không được luôn luôn là A).
   - "correctAnswer": ghi rõ ký tự đáp án đúng ("A", "B", "C" hoặc "D")
   - "explanation": Lời giải & Gợi ý trả lời sư phạm chi tiết từng bước, thân thiện, dễ hiểu để học sinh đọc là hiểu ngay.
   - "difficulty": Ghi rõ "Nhận biết", "Thông hiểu", hoặc "Vận dụng".

BẮT BUỘC TRẢ VỀ DUY NHẤT 1 MẢNG JSON HỢP LỆ (Không viết lời chào, không kèm text ngoài markdown):
\`\`\`json
[
  {
    "id": 1,
    "question": "Đề bài câu hỏi...",
    "options": [
      "A. Phương án 1",
      "B. Phương án 2",
      "C. Phương án 3",
      "D. Phương án 4"
    ],
    "correctAnswer": "A",
    "explanation": "Gợi ý trả lời & lời giải chi tiết cho học sinh...",
    "difficulty": "Nhận biết"
  }
]
\`\`\``;

    try {
      const result = await callGemini([{ text: prompt }], "Bạn là Chuyên gia Giáo dục Tiểu học biên soạn câu hỏi chuẩn JSON.", {
        temperature: 0.6,
      });

      let cleanJson = result.text.trim();
      cleanJson = cleanJson.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

      const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
      let questionsData = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);

      if (!Array.isArray(questionsData) || questionsData.length === 0) {
        questionsData = getSmartFallbackQuestions(topic, grade, subject, safeCount);
      }

      // Build textbook-style formatted text
      const formattedText = buildFormattedTextFromQuestions(topic, grade, subject, questionsData);

      return res.json({
        success: true,
        topic: topic.trim(),
        grade,
        subject,
        questionCount: questionsData.length,
        questions: questionsData,
        formattedText,
        modelUsed: result.modelUsed,
      });
    } catch (aiErr: any) {
      console.warn("[generate-questions] AI call failed, using smart educational fallback:", aiErr.message || aiErr);
      const fallbackQuestions = getSmartFallbackQuestions(topic, grade, subject, safeCount);
      const formattedText = buildFormattedTextFromQuestions(topic, grade, subject, fallbackQuestions);
      return res.json({
        success: true,
        topic: topic.trim(),
        grade,
        subject,
        questionCount: fallbackQuestions.length,
        questions: fallbackQuestions,
        formattedText,
        modelUsed: "smart-educational-fallback",
      });
    }
  } catch (err: any) {
    console.error("[API generate-questions error]", err);
    res.status(500).json({ success: false, error: err.message || "Lỗi khi sinh câu hỏi bằng AI" });
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

    const prompt = `Dựa vào chuyên môn của một Senior Game Developer và UI/UX Designer, hãy lập trình một file HTML5 hoàn chỉnh chứa mini game giáo dục tương tác đỉnh cao.
${gameNameStr}
NỘI DUNG SÁCH GIÁO KHOA / GIÁO ÁN VÀ CÁC CÂU HỎI BÀI TẬP ĐÃ TRÍCH XUẤT:
---
${lessonText}
---

${targetGameDesc}
${customReqStr}

YÊU CẦU GIAO DIỆN & MÀU SẮC (SẶC SỠ, TƯƠI SÁNG, PHÙ HỢP TIỂU HỌC):
- GIAO DIỆN SẶC SỠ, VUI NHỘN: Phối hợp các dải màu tươi sáng, rực rỡ (gradient vàng cam ấm áp, xanh ngọc bích tươi, tím violet phấn khởi, xanh dương biển, hồng phấn), bo góc tròn lớn mượt mà (rounded-3xl, rounded-2xl), bóng đổ mềm mại, các thẻ câu hỏi và nút bấm to bản, nổi bật.
- Màu chủ đạo (Primary Color Tailwind): màu ${themeColor}-500 (Tự động phối hợp hài hòa và rực rỡ với các shade ${themeColor}-100 đến ${themeColor}-900)
- Font chữ: '${themeFont}' (hỗ trợ tiếng Việt đầy đủ)
- Nhiều Emoji ngộ nghĩnh, hoạt hình, tạo cảm giác như một ngày hội học tập!

QUY TẮC NỘI DUNG BẮT BUỘC (RẤT QUAN TRỌNG):
1. BẮT BUỘC PHẢI DÙNG CÁC CÂU HỎI VÀ BÀI TẬP CÓ TRONG NỘI DUNG SGK Ở TRÊN:
   - Ưu tiên tối đa việc sử dụng các bài tập, câu hỏi trắc nghiệm, bài tập luyện tập, bài tập tính toán từ tài liệu SGK đã trích xuất.
   - Tuyệt đối không được tự bịa các câu hỏi chung chung trừ khi tài liệu không có bài tập.
   - Sinh CHÍNH XÁC ${questionCount} câu hỏi/thử thách phong phú, bám sát các câu hỏi bài tập SGK đã cung cấp.
   - BẮT BUỘC xáo trộn ngẫu nhiên vị trí đáp án đúng, không để đáp án đúng luôn nằm ở lựa chọn đầu tiên (A).
2. QUY CHUẨN THIẾT KẾ CHO TỪNG THỂ LOẠI GAME ĐẢM BẢO CHẠY MƯỢT 60 FPS:
   - TRẮC NGHIỆM: Các phương án lựa chọn A, B, C, D to rõ, bấm phản hồi tức thì trong 0ms, đổi màu xanh lá/đỏ ngay lập tức và chuyển câu sau 800ms.
   - NỐI CẶP (MATCHING): Hiển thị 2 cột song song (Cột Trái: Đề bài/Thuật ngữ; Cột Phải: Định nghĩa/Đáp án). Sử dụng cơ chế CLICK-TO-PAIR mượt mà (Bấm 1 thẻ cột trái -> thẻ sáng viền xanh -> Bấm 1 thẻ cột phải -> nếu đúng thì cả 2 thẻ xanh lá và khóa lại, nếu sai thì nhấp nháy đỏ 400ms và bỏ chọn). Tuyệt đối KHÔNG dùng HTML5 drag-and-drop.
   - ĐÚNG / SAI: Thẻ câu hỏi to ở giữa, 2 nút bấm nổi bật "✅ ĐÚNG" (xanh lá) và "❌ SAI" (đỏ). Nhận click tức thì, giải thích ngắn gọn và chuyển câu sau 800ms.
   - ĐIỀN TỪ (FILL IN THE BLANK): Câu văn có chỗ khuyết [ _____ ], phía dưới là Ngân hàng từ (Word Bank) gồm các thẻ từ bấm được. Học sinh bấm thẻ từ nào thì từ đó tự điền vào chỗ khuyết ngay lập tức, có nút "Xóa" và "Kiểm tra".
   - PHÂN LOẠI NHÓM: Dùng cơ chế Click-to-Sort (Hiển thị thẻ cần xếp, bên dưới là 2-3 Hộp danh mục; học sinh bấm vào Hộp nào thì thẻ tự chuyển vào hộp đó kèm animation trượt mượt mà).
   - SẮP XẾP THỨ TỰ: Danh sách các thẻ cần xếp thứ tự, mỗi thẻ có nút ⬆️ Lên và ⬇️ Xuống hoặc bấm 2 thẻ để hoán đổi vị trí, kèm nút "Kiểm tra kết quả".
   - LẬT THẺ GHI NHỚ: Lưới 6 - 12 thẻ úp, bấm lật mở có hiệu ứng 3D CSS mượt mà. Lật đúng cặp thì giữ nguyên, sai thì tự úp lại sau 750ms.
   - ĐOÁN TỪ: Ô chữ _ _ _ _, gợi ý từ bài học, bàn phím chữ cái A-Z dạng nút bấm và số lượt chơi (trái tim ❤️❤️❤️❤️❤️).
3. CHỈ RA CÂU SAI & GỢI Ý TRẢ LỜI CHI TIẾT (ĐẶC BIỆT QUAN TRỌNG):
   - BẮT BUỘC tạo biến \`userAnswersHistory = []\` ghi nhận lại toàn bộ bài làm:
     \`\`\`javascript
     // Mỗi khi học sinh trả lời 1 câu:
     userAnswersHistory.push({
       questionIndex: currentQuestionIndex + 1,
       question: "Đề bài câu hỏi...",
       studentAnswer: "Phương án học sinh đã chọn...",
       correctAnswer: "Đáp án đúng chính xác...",
       isCorrect: isCorrect, // boolean
       explanation: "Gợi ý trả lời & giải thích chi tiết dễ hiểu cho học sinh..."
     });
     \`\`\`
   - Tại Màn hình Kết quả (id="screen-result"):
     * Hiển thị: Tổng số câu đúng (màu xanh lá) và Tổng số câu sai (màu đỏ).
     * Bảng/Danh sách 'GỢI Ý & ÔN TẬP CÂU SAI': Nếu học sinh có câu sai, hiển thị rõ từng câu sai, em đã chọn gì, đáp án đúng là gì và hộp gợi ý: "💡 Gợi ý giải: [lời giải]".
   - Khi hoàn thành trò chơi, gọi:
     \`\`\`javascript
     window.parent.postMessage({
       type: 'GAME_COMPLETE',
       score: score,
       maxScore: maxScore,
       totalQuestions: totalQuestions,
       correctCount: correctCount,
       wrongCount: wrongCount,
       answers: userAnswersHistory
     }, '*');
     \`\`\`
4. BẮT BUỘC CÓ HIỆU ỨNG ÂM THANH VUI NHỘN (SOUND EFFECTS):
   - Trò chơi BẮT BUỘC phát âm thanh vui nhộn cho mọi hành động tương tác của học sinh bằng cách gọi:
     + Bắt đầu chơi: phát âm thanh khởi động playSound('start')
     + Bấm nút / chọn phương án: phát âm thanh bong bóng lách cách playSound('click')
     + Trả lời ĐÚNG: phát tiếng chuông leng keng vui mừng playSound('correct')
     + Trả lời SAI: phát tiếng boing hoạt hình vui nhộn playSound('wrong')
     + Chuỗi câu đúng liên tiếp (Streak): phát tiếng thần kỳ playSound('streak')
     + Hoàn thành bài / Màn hình kết quả: phát nhạc chiến thắng rộn rã playSound('win') và bắn pháo hoa confetti!
5. CHỈ TRẢ VỀ code HTML thuần túy, bắt đầu bằng <!DOCTYPE html>. Không bọc trong \`\`\`html \`\`\`. Không giải thích.
6. KHÔNG LỖI JS: Mọi hàm và biến được gọi PHẢI được định nghĩa đầy đủ (tránh ReferenceError).
6. ĐỘC LẬP: Mọi CSS/JS/HTML phải nằm trong cùng 1 file. ĐƯỢC PHÉP dùng các CDN:
   - Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
   - Canvas Confetti: <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
   - Google Fonts (import font ${themeFont} vào CSS).
   Tuyệt đối KHÔNG dùng CDN hình ảnh bên ngoài, chỉ dùng Emoji hoặc SVG inline.
7. BỐ CỤC 3 MÀN HÌNH CHUYỂN ĐỔI TIN CẬY:
   - Màn hình Bắt đầu (id="screen-start"): Hiển thị tên trò chơi và nút "BẮT ĐẦU CHƠI" (onclick="startGame()").
   - Màn hình Chơi chính (id="screen-game"): Mặc định có class "hidden". Khi bấm Bắt đầu, hàm startGame() ẩn screen-start và hiện screen-game.
   - Màn hình Kết quả (id="screen-result"): Mặc định có class "hidden".
8. TỐI ƯU MOBILE & SCROLL: Container chính PHẢI có \`min-height: 100vh; overflow-y: auto; padding-bottom: 2rem;\` để đảm bảo luôn cuộn được và nhìn thấy nút bấm.
${useIconsStr}
9. TUYỆT ĐỐI CẤM DÙNG ALERT/CONFIRM/PROMPT: KHÔNG BAO GIỜ sử dụng window.alert, alert(...), window.confirm hay window.prompt.
10. TIÊU ĐỀ: Ở Màn hình Bắt đầu (Start Screen), hiển thị trang trọng: "TRƯỜNG TIỂU HỌC LẠC LONG QUÂN" và thông điệp "Mỗi tiết học là một niềm vui".

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
