import React, { useCallback, useState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { cn } from "../utils/cn";
import { parseFile } from "../utils/fileParser";
import { extractDocumentContent } from "../utils/geminiClient";

export interface FileMetadata {
  fileName: string;
  isScanned?: boolean;
  numPages?: number;
  modelUsed?: string;
}

export function FileUploader({ 
  onFileProcessed, 
  onError,
  isProcessingExternal,
}: { 
  onFileProcessed: (text: string, meta: FileMetadata) => void;
  onError: (err: string) => void;
  isProcessingExternal?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [statusStep, setStatusStep] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannedDetected, setIsScannedDetected] = useState(false);

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    setStatusStep("Đang phân tích định dạng file...");
    setIsScannedDetected(false);

    try {
      const parsed = await parseFile(file);

      if (parsed.isScannedOrImage) {
        setIsScannedDetected(true);
        setStatusStep("🔍 Phát hiện SGK dạng scan/ảnh - AI đang trích xuất câu hỏi & bài tập bằng thị giác...");
        
        const extractRes = await extractDocumentContent({
          fileBase64: parsed.fileBase64,
          mimeType: parsed.mimeType,
          fileName: parsed.fileName,
        });

        if (!extractRes.extractedContent || !extractRes.extractedContent.trim()) {
          throw new Error("AI không tìm thấy nội dung bài tập trong file này. Vui lòng thử lại.");
        }

        onFileProcessed(extractRes.extractedContent, {
          fileName: file.name,
          isScanned: true,
          numPages: parsed.numPages,
          modelUsed: extractRes.modelUsed,
        });
      } else {
        // Document has selectable text layer
        if (!parsed.text || parsed.text.trim().length === 0) {
          throw new Error("Không tìm thấy nội dung văn bản trong file.");
        }

        setStatusStep("✨ AI đang tổng hợp kiến thức & câu hỏi từ tài liệu...");
        // Enhance text with structured question extraction
        try {
          const extractRes = await extractDocumentContent({
            textContent: parsed.text,
            fileName: parsed.fileName,
          });

          onFileProcessed(extractRes.extractedContent, {
            fileName: file.name,
            isScanned: false,
            numPages: parsed.numPages,
            modelUsed: extractRes.modelUsed,
          });
        } catch (enhanceErr) {
          console.warn("Dùng văn bản gốc trực tiếp do lỗi trích xuất:", enhanceErr);
          // Fallback to raw text if AI extraction times out
          onFileProcessed(parsed.text, {
            fileName: file.name,
            isScanned: false,
            numPages: parsed.numPages,
          });
        }
      }
    } catch (err: any) {
      setFileName(null);
      onError(err.message || "Đã xảy ra lỗi khi đọc và trích xuất file.");
    } finally {
      setIsLoading(false);
      setStatusStep("");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const activeLoading = isLoading || isProcessingExternal;

  return (
    <div className="w-full space-y-3">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "w-full border-2 border-dashed rounded-3xl p-6 sm:p-8 transition-all duration-200 ease-in-out text-center cursor-pointer relative overflow-hidden group",
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50",
          fileName && !activeLoading && "border-emerald-200 bg-emerald-50/40"
        )}
      >
        <input 
          type="file" 
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
          onChange={onFileChange}
          disabled={activeLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          {activeLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-11 w-11 border-b-3 border-indigo-600"></div>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full animate-pulse">
                {isScannedDetected ? "Thị giác AI (Multimodal OCR)" : "Đang xử lý..."}
              </span>
            </div>
          ) : fileName ? (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-400 text-white rounded-2xl flex items-center justify-center group-hover:scale-105 shadow-md transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
          )}
          
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              {activeLoading
                ? (statusStep || "Đang xử lý tài liệu...")
                : fileName
                ? fileName
                : "Tải lên File Sách Giáo Khoa / Giáo Án"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeLoading
                ? "AI đang đọc chi tiết từng trang và tìm tất cả câu hỏi, bài tập SGK..."
                : fileName
                ? "Tài liệu đã được trích xuất thành công!"
                : "Hỗ trợ file PDF (kể cả PDF scan sách), Word (.docx), văn bản hoặc ảnh bài tập"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
