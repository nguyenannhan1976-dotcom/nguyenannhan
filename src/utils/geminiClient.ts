export interface GameSuggestionObj {
  loai: string;
  moTa: string;
  doKho: "Dễ" | "Trung bình" | "Khó";
  thoiGian: string;
  icon: string;
  mauSac: string;
}

export interface ExtractResult {
  extractedContent: string;
  modelUsed?: string;
}

/**
 * An toàn gọi API server-side với Timeout, xử lý mã lỗi HTTP,
 * và bảo vệ chống crash khi phản hồi không phải là JSON.
 */
async function safeApiFetch<T = any>(
  url: string,
  payload: any,
  timeoutMs: number = 90000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    const rawText = await res.text();
    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      if (res.status === 504 || res.status === 408) {
        throw new Error("Quá thời gian xử lý từ phía máy chủ (Gateway Timeout). Vui lòng thử lại với nội dung ngắn gọn hơn.");
      }
      if (res.status === 502 || res.status === 503) {
        throw new Error("Máy chủ đang khởi động lại hoặc tạm thời không khả dụng. Vui lòng bấm thử lại sau vài giây.");
      }
      throw new Error(`Máy chủ trả về phản hồi không hợp lệ (HTTP ${res.status}). Vui lòng thử lại.`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || `Yêu cầu thất bại với mã lỗi HTTP ${res.status}`);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timer);

    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      throw new Error(
        "Quá thời gian chờ (Timeout sau 90 giây). Hệ thống AI đang phản hồi chậm hoặc giáo án có nội dung quá dài. Vui lòng bấm thử lại!"
      );
    }

    const msg = (err.message || "").toLowerCase();
    if (msg.includes("failed to fetch") || err.name === "TypeError") {
      throw new Error("Lỗi kết nối mạng: Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền mạng.");
    }

    throw err;
  }
}

export interface FileUploadPayloadItem {
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  textContent?: string;
}

export async function extractDocumentContent(payload: {
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  textContent?: string;
  files?: FileUploadPayloadItem[];
}): Promise<ExtractResult> {
  const data = await safeApiFetch<ExtractResult>("/api/extract-pdf", payload, 90000);

  if (!data.extractedContent || !data.extractedContent.trim()) {
    throw new Error("Không thể trích xuất nội dung từ tài liệu này.");
  }

  return {
    extractedContent: data.extractedContent,
    modelUsed: data.modelUsed,
  };
}

export async function fetchGameSuggestions(
  lessonText: string
): Promise<{ suggestions: GameSuggestionObj[]; modelUsed?: string }> {
  const data = await safeApiFetch<{ suggestions: GameSuggestionObj[]; modelUsed?: string }>(
    "/api/generate-suggestions",
    { lessonText },
    60000
  );

  if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
    throw new Error("AI không trả về danh sách gợi ý hợp lệ.");
  }

  return {
    suggestions: data.suggestions,
    modelUsed: data.modelUsed,
  };
}

export async function fetchGeneratedGame(payload: {
  lessonText: string;
  targetGameDesc: string;
  gameName?: string;
  customPrompt?: string;
  themeColor?: string;
  themeFont?: string;
  questionCount?: number;
  useIcons?: boolean;
}): Promise<{ html: string; modelUsed?: string }> {
  const data = await safeApiFetch<{ html: string; modelUsed?: string }>(
    "/api/generate-game",
    payload,
    100000 // 100 seconds timeout
  );

  const html = data.html?.trim();
  if (!html || (!html.toLowerCase().includes("<html") && !html.toLowerCase().includes("<!doctype html"))) {
    throw new Error("AI không trả về mã HTML hợp lệ để hiển thị trò chơi. Vui lòng bấm thử lại!");
  }

  return {
    html,
    modelUsed: data.modelUsed,
  };
}

export async function fetchAdjustedGame(
  currentHtml: string,
  adjustment: string
): Promise<{ html: string; modelUsed?: string }> {
  const data = await safeApiFetch<{ html: string; modelUsed?: string }>(
    "/api/adjust-game",
    { currentHtml, adjustment },
    100000
  );

  const html = data.html?.trim();
  if (!html || (!html.toLowerCase().includes("<html") && !html.toLowerCase().includes("<!doctype html"))) {
    throw new Error("AI không trả về mã HTML hợp lệ khi điều chỉnh trò chơi. Vui lòng thử lại!");
  }

  return {
    html,
    modelUsed: data.modelUsed,
  };
}

export interface GeneratedQuestionItem {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty?: string;
}

export interface GenerateQuestionsPayload {
  topic: string;
  grade?: string;
  subject?: string;
  questionCount?: number;
  questionType?: string;
  difficulty?: string;
  curriculumBook?: string;
  customNotes?: string;
}

export interface GenerateQuestionsResult {
  success: boolean;
  topic: string;
  grade: string;
  subject: string;
  questionCount: number;
  questions: GeneratedQuestionItem[];
  formattedText: string;
  modelUsed?: string;
}

export async function fetchGeneratedQuestions(
  payload: GenerateQuestionsPayload
): Promise<GenerateQuestionsResult> {
  const data = await safeApiFetch<GenerateQuestionsResult>(
    "/api/generate-questions",
    payload,
    90000
  );

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("AI không trả về danh sách câu hỏi hợp lệ. Vui lòng thử lại!");
  }

  return data;
}

