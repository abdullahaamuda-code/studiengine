"use client";
import { useEffect, useRef } from "react";

export default function MathText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || !text) return;

    async function render() {
      const katex = (await import("katex")).default;
      const el = ref.current!;

      // Unescape double backslashes that come from JSON parsing
      // JSON \\frac -> JS string \frac -> KaTeX renders correctly
      const processedText = text.replace(/\\\\([a-zA-Z{}_^])/g, '\\$1');

      const parts = splitMath(processedText);

      el.innerHTML = parts.map(part => {
        if (part.type === "block") {
          try {
            return `<span style="display:block;text-align:center;padding:4px 0">${katex.renderToString(part.content, { displayMode: true, throwOnError: false })}</span>`;
          } catch { return `<span>${escapeHtml(part.content)}</span>`; }
        }
        if (part.type === "inline") {
          try {
            return katex.renderToString(part.content, { displayMode: false, throwOnError: false });
          } catch { return `<span>${escapeHtml(part.content)}</span>`; }
        }
        return escapeHtml(part.content);
      }).join("");
    }

    render();
  }, [text]);

  return <span ref={ref} style={style}>{text}</span>;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Part = { type: "text" | "inline" | "block"; content: string };

function splitMath(input: string): Part[] {
  const parts: Part[] = [];
  // Match $$...$$ first (block), then $...$ (inline)
  const regex = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(input)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: input.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ type: "block", content: m[1] });
    else if (m[2] !== undefined) parts.push({ type: "inline", content: m[2] });
    last = m.index + m[0].length;
  }

  if (last < input.length) parts.push({ type: "text", content: input.slice(last) });
  return parts;
}
