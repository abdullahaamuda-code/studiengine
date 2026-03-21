"use client";

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // First try: extract real text (fast, works on digital PDFs)
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

  const combinedText = textParts.join("\n\n").trim();

  // If we got real text, return it
  if (combinedText.length > 100) return combinedText;

  // Otherwise it's a scanned PDF — render pages to base64 images for vision
  return await extractImagesFromPDF(pdf);
}

export async function extractImagesFromPDF(pdf: any): Promise<string> {
  // Returns a special marker so the caller knows to use vision API
  const images: string[] = [];
  const pageCount = Math.min(pdf.numPages, 50); // cap at 20 pages

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 }); // higher scale = better OCR accuracy

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    images.push(base64);
  }

  // Return JSON-encoded images with a special prefix so InputPanel knows
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
