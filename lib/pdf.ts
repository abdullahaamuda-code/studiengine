"use client";

let initialized = false;

async function getPdfLib() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!initialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    initialized = true;
  }
  return pdfjsLib;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await getPdfLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const textParts: string[] = [];
  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) textParts.push(pageText);
  }

  const combined = textParts.join("\n\n").trim();
  if (combined.length > 100) return combined;

  // Scanned PDF — render to images
  return await extractImagesFromPDF(pdf);
}

async function extractImagesFromPDF(pdf: any): Promise<string> {
  const images: string[] = [];
  const pageCount = Math.min(pdf.numPages, 50);
  let lowContrastPages = 0;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Sample a small area to estimate contrast — just for the warning, never blocks
    const sample = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
    const variance = getPixelVariance(sample.data);
    if (variance < 40) lowContrastPages++;

    const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
    images.push(base64);
  }

  // Quality is just a hint — never blocks processing
  const qualityWarning = lowContrastPages / pageCount > 0.5 ? "low"
    : lowContrastPages / pageCount > 0.25 ? "medium"
    : "good";

  return `__VISION__${JSON.stringify({ images, qualityWarning })}`;
}

function getPixelVariance(data: Uint8ClampedArray): number {
  let sum = 0, sumSq = 0, count = 0;
  for (let i = 0; i < data.length; i += 16) {
    const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += b; sumSq += b * b; count++;
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

export function isVisionPayload(text: string): boolean {
  return text.startsWith("__VISION__");
}

export function parseVisionPayload(text: string): { images: string[]; qualityWarning: string } {
  const raw = JSON.parse(text.replace("__VISION__", ""));
  if (Array.isArray(raw)) return { images: raw, qualityWarning: "good" };
  return raw;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
