"use client";

async function getPdfLib() {
  const pdfjsLib = await import("pdfjs-dist");
  // Disable worker entirely — run in main thread
  // This avoids ALL webpack/Terser/CDN issues at the cost of slightly slower parsing
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";
  return pdfjsLib;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await getPdfLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

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

  return await extractImagesFromPDF(pdf);
}

async function extractImagesFromPDF(pdf: any): Promise<string> {
  const images: string[] = [];
  const pageCount = Math.min(pdf.numPages, 50);
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    images.push(base64);
  }
  return `__VISION__${JSON.stringify(images)}`;
}

export function isVisionPayload(text: string): boolean {
  return text.startsWith("__VISION__");
}

export function parseVisionPayload(text: string): string[] {
  return JSON.parse(text.replace("__VISION__", ""));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
