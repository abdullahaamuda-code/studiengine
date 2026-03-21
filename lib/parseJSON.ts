export function parseAIJson(raw: string): any {
  // 1. Strip markdown fences
  let clean = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // 2. Extract array or object
  const arrMatch = clean.match(/\[[\s\S]*\]/);
  const objMatch = clean.match(/\{[\s\S]*\}/);
  const jsonStr = arrMatch?.[0] ?? objMatch?.[0];
  if (!jsonStr) throw new Error("No JSON found in AI response. Try again.");

  // 3. Direct parse
  try { return JSON.parse(jsonStr); } catch (_) {}

  // 4. Fix backslashes
  try { return JSON.parse(jsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch (_) {}

  // 5. Aggressive clean: strip ALL backslashes entirely, then parse
  try { return JSON.parse(jsonStr.replace(/\\/g, "")); } catch (_) {}

  // 6. Log raw for debugging and throw
  console.error("=== RAW AI OUTPUT (unparseable) ===");
  console.error(raw);
  console.error("=== END RAW ===");
  throw new Error("Could not parse AI response. Try again.");
}
