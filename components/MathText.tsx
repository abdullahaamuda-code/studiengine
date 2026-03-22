"use client";
import { useEffect, useRef } from "react";

export default function MathText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || !text) return;
    let cancelled = false;

    async function render() {
      const katex = (await import("katex")).default;
      if (cancelled || !ref.current) return;

      const el = ref.current;
      // Normalize backslashes: \\frac -> \frac for KaTeX
      const normalized = text
        .replace(/\\\\([a-zA-Z])/g, "\\$1")   // \\frac -> \frac
        .replace(/\\\\{/g, "\\{")              // \\{ -> \{
        .replace(/\\\\}/g, "\\}");             // \\} -> \}

      const parts = splitMath(normalized);

      el.innerHTML = parts.map(part => {
        if (part.type === "block") {
          try {
            return `<span style="display:block;text-align:center;padding:6px 0;overflow-x:auto">${katex.renderToString(part.content, { displayMode: true, throwOnError: false, trust: true })}</span>`;
          } catch { return `<code style="color:#94a3b8">${escHtml(part.content)}</code>`; }
        }
        if (part.type === "inline") {
          try {
            return katex.renderToString(part.content, { displayMode: false, throwOnError: false, trust: true });
          } catch { return `<code style="color:#94a3b8">${escHtml(part.content)}</code>`; }
        }
        return escHtml(part.content);
      }).join("");
    }

    render();
    return () => { cancelled = true; };
  }, [text]);

  return <span ref={ref} style={style}>{text}</span>;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Part = { type: "text" | "inline" | "block"; content: string };

function splitMath(input: string): Part[] {
  const parts: Part[] = [];
  // Match $$...$$ (block) then $...$ (inline)
  // Use non-greedy match, allow newlines in block mode
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(input)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: input.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ type: "block", content: m[1].trim() });
    else if (m[2] !== undefined) parts.push({ type: "inline", content: m[2].trim() });
    last = m.index + m[0].length;
  }

  if (last < input.length) parts.push({ type: "text", content: input.slice(last) });
  return parts;
}
