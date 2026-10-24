import React, { useCallback, useState } from "react";
import { UploadCloud, CheckCircle2, Images, Image as ImageIcon, X, Plus, FileText } from "lucide-react";
import { cn } from "../utils/cn";
import { parseFile, ParsedDocument } from "../utils/fileParser";
import { extractDocumentContent, FileUploadPayloadItem } from "../utils/geminiClient";

export interface FileMetadata {
  fileName: string;
  fileNames?: string[];
  isScanned?: boolean;
  numPages?: number;
  numFiles?: number;
  modelUsed?: string;
}

interface ImagePreviewItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: string;
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
  const [statusStep, setStatusStep] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannedDetected, setIsScannedDetected] = useState(false);
  
  // Multiple files state
  const [selectedImages, setSelectedImages] = useState<ImagePreviewItem[]>([]);
  const [processedSummary, setProcessedSummary] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleProcessMultipleFiles = async (filesList: File[]) => {
    if (!filesList || filesList.length === 0) return;

    setIsLoading(true);
    setIsScannedDetected(false);
    setProcessedSummary(null);

    try {
      // 1. If only 1 non-image file (e.g. PDF or DOCX)
      if (filesList.length === 1 && !filesList[0].type.startsWith("image/")) {
        const file = filesList[0];
        setStatusStep(`Đang đọc file ${file.name}...`);
        const parsed = await parseFile(file);

        if (parsed.isScannedOrImage) {
          setIsScannedDetected(true);
          setStatusStep("🔍 Phát hiện SGK dạng scan/ảnh - AI đang trích xuất câu hỏi bằng thị giác...");

          const extractRes = await extractDocumentContent({
            fileBase64: parsed.fileBase64,
            mimeType: parsed.mimeType,
            fileName: parsed.fileName,
          });

          if (!extractRes.extractedContent || !extractRes.extractedContent.trim()) {
            throw new Error("AI không tìm thấy nội dung bài tập trong file này. Vui lòng thử lại.");
          }

          setProcessedSummary(file.name);
          onFileProcessed(extractRes.extractedContent, {
            fileName: file.name,
            fileNames: [file.name],
            isScanned: true,
            numPages: parsed.numPages,
            numFiles: 1,
            modelUsed: extractRes.modelUsed,
          });
        } else {
          if (!parsed.text || parsed.text.trim().length === 0) {
            throw new Error("Không tìm thấy nội dung văn bản trong file.");
          }

          setStatusStep("✨ AI đang tổng hợp kiến thức & câu hỏi từ tài liệu...");
          try {
            const extractRes = await extractDocumentContent({
              textContent: parsed.text,
              fileName: parsed.fileName,
            });

            setProcessedSummary(file.name);
            onFileProcessed(extractRes.extractedContent, {
              fileName: file.name,
              fileNames: [file.name],
              isScanned: false,
              numPages: parsed.numPages,
              numFiles: 1,
              modelUsed: extractRes.modelUsed,
            });
          } catch {
            setProcessedSummary(file.name);
            onFileProcessed(parsed.text, {
              fileName: file.name,
              fileNames: [file.name],
              isScanned: false,
              numPages: parsed.numPages,
              numFiles: 1,
            });
          }
        }
        return;
      }

      // 2. Multiple files (multiple images or combination)
      setStatusStep(`Đang phân tích ${filesList.length} file tài liệu/ảnh đã chọn...`);
      setIsScannedDetected(true);

      const parsedItems: FileUploadPayloadItem[] = [];
      const imagePreviews: ImagePreviewItem[] = [];

      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        setStatusStep(`Đang tải ảnh ${i + 1}/${filesList.length}: ${file.name}...`);
        const parsed: ParsedDocument = await parseFile(file);

        if (file.type.startsWith("image/")) {
          imagePreviews.push({
            id: `img-${Date.now()}-${i}`,
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            size: formatFileSize(file.size),
          });
        }

        parsedItems.push({
          fileBase64: parsed.fileBase64,
          mimeType: parsed.mimeType,
          fileName: parsed.fileName,
          textContent: parsed.text,
        });
      }

      if (imagePreviews.length > 0) {
        setSelectedImages(imagePreviews);
      }

      setStatusStep(`✨ AI thị giác đang đọc đồng thời ${filesList.length} trang ảnh và trích xuất tất cả bài tập...`);

      const extractRes = await extractDocumentContent({
        files: parsedItems,
        fileName: `${filesList.length} ảnh sách giáo khoa`,
      });

      if (!extractRes.extractedContent || !extractRes.extractedContent.trim()) {
        throw new Error("AI không tìm thấy nội dung câu hỏi trong các ảnh đã gửi. Vui lòng thử lại với ảnh rõ nét hơn.");
      }

      const fileNames = filesList.map(f => f.name);
      const summaryText = `${filesList.length} file ảnh trang SGK (${fileNames.slice(0, 3).join(", ")}${filesList.length > 3 ? "..." : ""})`;
      setProcessedSummary(summaryText);

      onFileProcessed(extractRes.extractedContent, {
        fileName: summaryText,
        fileNames,
        isScanned: true,
        numFiles: filesList.length,
        modelUsed: extractRes.modelUsed,
      });

    } catch (err: any) {
      setProcessedSummary(null);
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
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      handleProcessMultipleFiles(filesArray);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      handleProcessMultipleFiles(filesArray);
    }
  };

  const activeLoading = isLoading || isProcessingExternal;

  return (
    <div className="w-full space-y-3">
      {/* Main Upload Area */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "w-full border-2 border-dashed rounded-3xl p-6 sm:p-7 transition-all duration-200 ease-in-out text-center cursor-pointer relative overflow-hidden group",
          isDragging ? "border-amber-500 bg-amber-50" : "border-amber-200 hover:border-amber-400 hover:bg-amber-50/40 bg-gradient-to-b from-white to-amber-50/20",
          processedSummary && !activeLoading && "border-emerald-300 bg-emerald-50/40"
        )}
      >
        <input 
          type="file" 
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
          onChange={onFileChange}
          disabled={activeLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          title="Chọn một hoặc nhiều file ảnh/PDF"
        />
        
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          {activeLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-amber-500"></div>
              <span className="text-xs font-black px-3.5 py-1 bg-amber-100 text-amber-800 rounded-full animate-pulse border border-amber-200">
                {isScannedDetected ? "AI Thị Giác Đang Đọc Nhiều Trang 📸" : "Đang xử lý tài liệu..."}
              </span>
            </div>
          ) : processedSummary ? (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm ring-4 ring-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-105 shadow-md shadow-rose-200 transition-transform">
              <Images className="w-8 h-8" />
            </div>
          )}
          
          <div className="max-w-md mx-auto">
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              {activeLoading
                ? (statusStep || "Đang xử lý tài liệu...")
                : processedSummary
                ? processedSummary
                : "Tải lên Ảnh SGK (Cho phép chọn nhiều ảnh cùng lúc) hoặc PDF"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {activeLoading
                ? "AI đang đọc từng trang ảnh và tự động tổng hợp toàn bộ câu hỏi..."
                : processedSummary
                ? "Đã trích xuất thành công toàn bộ câu hỏi từ các file!"
                : "💡 Bạn có thể giữ phím Ctrl (hoặc Cmd) để chọn nhiều ảnh chụp các trang sách cùng lúc"}
            </p>
          </div>

          {!activeLoading && !processedSummary && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-[11px] font-bold border border-amber-200">
              <span>📸 Chọn cùng lúc 2 - 10 ảnh các trang bài tập SGK</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Images Thumbnail Gallery */}
      {selectedImages.length > 1 && (
        <div className="p-3 bg-white rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5 text-indigo-600" />
              <span>Các trang ảnh đã tải ({selectedImages.length} trang):</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-600">Đã nhận diện thành công</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {selectedImages.map((img, idx) => (
              <div 
                key={img.id}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-3/4 flex flex-col justify-end p-1.5"
              >
                <img 
                  src={img.previewUrl} 
                  alt={img.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90"></div>
                <div className="relative z-10 text-white">
                  <span className="text-[9px] font-black uppercase bg-indigo-600/90 px-1 py-0.2 rounded">
                    Trang {idx + 1}
                  </span>
                  <p className="text-[10px] font-bold line-clamp-1 mt-0.5 leading-tight">
                    {img.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
