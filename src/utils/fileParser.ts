import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure the worker for pdfjs-dist via CDN using the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedDocument {
  text: string;
  isScannedOrImage: boolean;
  fileBase64?: string;
  mimeType: string;
  fileName: string;
  numPages?: number;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export async function parseFile(file: File): Promise<ParsedDocument> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  
  if (!fileExt) throw new Error('Không xác định được định dạng file');

  const arrayBuffer = await file.arrayBuffer();
  const fileBase64 = arrayBufferToBase64(arrayBuffer);

  switch (fileExt) {
    case 'pdf': {
      let extractedText = '';
      let numPages = 0;

      try {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        numPages = pdf.numPages;
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          if (pageText.trim()) {
            extractedText += `\n[Trang ${i}]\n` + pageText.trim() + '\n';
          }
        }
      } catch (err: any) {
        console.warn('Lỗi đọc lớp chữ PDF qua pdfjs:', err);
      }

      // Clean excessive whitespace
      const cleanText = extractedText.replace(/\s+/g, ' ').trim();
      
      // If extracted text has fewer than 150 characters, it is a scanned/image PDF
      const isScannedOrImage = cleanText.length < 150;

      return {
        text: cleanText,
        isScannedOrImage,
        fileBase64,
        mimeType: 'application/pdf',
        fileName: file.name,
        numPages,
      };
    }

    case 'docx':
    case 'doc': {
      try {
        const res = await mammoth.extractRawText({ arrayBuffer });
        const text = res.value.replace(/\s+/g, ' ').trim();
        return {
          text,
          isScannedOrImage: false,
          fileBase64,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileName: file.name,
        };
      } catch (err: any) {
        throw new Error(`Lỗi đọc file DOCX: ${err.message}`);
      }
    }

    case 'txt': {
      const text = (await file.text()).trim();
      return {
        text,
        isScannedOrImage: false,
        mimeType: 'text/plain',
        fileName: file.name,
      };
    }

    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp': {
      const mime = fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg';
      return {
        text: '',
        isScannedOrImage: true,
        fileBase64,
        mimeType: mime,
        fileName: file.name,
        numPages: 1,
      };
    }

    default:
      throw new Error(`Định dạng file không hỗ trợ: .${fileExt}. Vui lòng dùng .pdf, .docx, .doc, .txt, hoặc ảnh .png/.jpg`);
  }
}
