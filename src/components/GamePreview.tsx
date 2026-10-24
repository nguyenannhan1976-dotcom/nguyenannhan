import { useCallback, useEffect, useState, useRef } from "react";
import { Download, RefreshCw, ArrowLeft, Maximize2, Minimize2, ExternalLink, Share2 } from "lucide-react";
import { cn } from "../utils/cn";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { fetchAdjustedGame } from "../utils/geminiClient";

export function GamePreview({ 
  htmlContent, 
  onRegenerate, 
  onBack,
  onPublish,
}: { 
  htmlContent: string;
  onRegenerate: (adjustment?: string) => void;
  onBack: () => void;
  onPublish?: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [adjustmentText, setAdjustmentText] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.log(`Lỗi khi mở toàn màn hình: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleExportScorm = async () => {
    try {
      setIsExporting(true);
      
      const scormPrompt = `
      Tôi có một đoạn code HTML trò chơi. Hãy thêm logic SCORM 1.2 vào file HTML này.
      
      YÊU CẦU:
      1. Viết code JS tự động dò tìm API SCORM 1.2 (\`window.API\`).
      2. Nếu tìm thấy, gọi \`LMSInitialize("")\`.
      3. Bắt sự kiện khi người chơi hoàn thành trò chơi, và lấy điểm số (tính scale 0-100).
      4. Gửi điểm số qua \`LMSSetValue("cmi.core.score.raw", score)\`.
      5. Gửi trạng thái qua \`LMSSetValue("cmi.core.lesson_status", "passed" hoặc "failed")\`.
      6. Cuối cùng gọi \`LMSCommit("")\` và \`LMSFinish("")\`.
      7. TRẢ VỀ TOÀN BỘ FILE HTML ĐÃ CẬP NHẬT. Trả về <!DOCTYPE html> KHÔNG BỌC TRONG \`\`\`html \`\`\`.
      8. KHÔNG DÙNG NÚT ALERT: BẮT BUỘC KHÔNG sử dụng window.alert, window.confirm, hay window.prompt. Nếu cần hiển thị thông báo, bắt buộc phải tạo Modal HTML/CSS/JS.
      
      MÃ HTML GỐC:
      ${htmlContent}
      `;
      
      const res = await fetchAdjustedGame(htmlContent, scormPrompt);
      const scormHtml = res.html;

      const zip = new JSZip();
      
      // index.html
      zip.file("index.html", scormHtml);
      
      // imsmanifest.xml
      const manifestUrl = "imsmanifest.xml";
      const manifestContent = `<?xml version="1.0" standalone="no" ?>
<manifest identifier="com.scorm.edugame" version="1"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>EduGame AI Module</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>EduGame</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`;
      
      zip.file(manifestUrl, manifestContent);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "edugame-scorm.zip");
    } catch (error) {
      console.error("Export SCORM error:", error);
      setErrorMsg("Đã có lỗi xảy ra khi tạo file SCORM");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4 flex flex-col h-full flex-1">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 px-4 py-2 hover:bg-white border rounded-full transition-all bg-slate-50 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Màn hình trước
        </button>

        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-100 bg-white px-5 py-2 rounded-full transition-all border border-slate-200 shadow-sm hidden md:flex cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          </button>
          <button 
            onClick={() => setShowRegenModal(true)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 bg-white px-5 py-2 rounded-full transition-all border border-indigo-200 shadow-sm hidden md:flex cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Tạo lại
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-full transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                title="Mở trò chơi trong tab riêng để chơi và trình chiếu mượt mà"
              >
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <span>Mở tab mới ↗</span>
              </a>
            )}
            {onPublish && (
              <button
                type="button"
                onClick={onPublish}
                className="flex items-center gap-2 text-sm font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-indigo-300/40 px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                title="Xuất bản bài tập và tạo đường link hoặc mã PIN cho học sinh làm bài"
              >
                <Share2 className="w-4 h-4" />
                <span>Xuất Bản & Tạo Link 🚀</span>
              </button>
            )}
            <a
              href={blobUrl || '#'}
              download="edugame.html"
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:scale-105 px-4 py-2 rounded-full transition-all whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" /> HTML
            </a>
            <button
              onClick={handleExportScorm}
              disabled={isExporting}
              className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 shadow-lg shadow-emerald-200 px-4 py-2 rounded-full transition-all disabled:opacity-75 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" /> {isExporting ? "Đang tạo..." : "SCORM (.zip)"}
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full flex-1 min-h-[480px] border-4 border-slate-900 rounded-3xl overflow-hidden shadow-2xl relative bg-white h-full flex flex-col z-50">
        {isFullscreen && (
          <button 
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full transition-all text-sm font-bold shadow-lg border border-white/10 opacity-60 hover:opacity-100 cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            Thoát toàn màn hình
          </button>
        )}
        {!htmlContent || !htmlContent.trim() ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 gap-3 p-6 text-center">
            <p className="text-slate-700 font-bold">Không tìm thấy mã HTML hợp lệ để hiển thị trò chơi.</p>
            <button
              onClick={() => onRegenerate()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Thử tạo lại trò chơi ✨
            </button>
          </div>
        ) : (
          <iframe 
            ref={iframeRef}
            srcDoc={htmlContent} 
            className="w-full h-full flex-1 border-none bg-white block" 
            allow="fullscreen; autoplay; clipboard-write; cross-origin-isolated"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            title="Game Preview"
          />
        )}
      </div>

      {showRegenModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tạo lại game</h3>
            <p className="text-slate-500 text-sm mb-4">
              Nhập yêu cầu điều chỉnh để AI cập nhật game hiện tại (giữ nguyên cấu trúc cũ nếu có thể) hoặc bỏ trống để làm mới hoàn toàn.
            </p>
            <textarea
              value={adjustmentText}
              onChange={(e) => setAdjustmentText(e.target.value)}
              placeholder="VD: Thêm hiệu ứng chúc mừng khi trả lời đúng..."
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm resize-none bg-slate-50 focus:bg-white mb-6"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRegenModal(false);
                  setAdjustmentText("");
                }}
                className="px-5 py-2.5 rounded-full font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowRegenModal(false);
                  onRegenerate(adjustmentText.trim() ? adjustmentText : undefined);
                  setAdjustmentText("");
                }}
                className="px-5 py-2.5 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                Xác nhận tạo lại
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-red-600 mb-2">Thông báo</h3>
            <p className="text-slate-600 text-sm mb-6">
              {errorMsg}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorMsg(null)}
                className="px-5 py-2.5 rounded-full font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
