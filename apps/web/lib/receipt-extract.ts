import { parseExpenseCategory, parseTaxRate, type ExpenseCategory } from "@shime/shared";

export type ReceiptExtractionLine = {
  description: string;
  amount: number;
  taxRate: number;
};

export type ReceiptExtraction = {
  vendor: string | null;
  date: string | null;
  category: ExpenseCategory;
  lines: ReceiptExtractionLine[];
  total: number | null;
  confidence: string | null;
};

const EXTRACTION_PROMPT = `Read this receipt image. Return ONLY valid JSON (no markdown fences):

{
  "vendor": "store or company name",
  "date": "YYYY-MM-DD or null",
  "category": "CONVENIENCE|TOLL|PARKING|OFFICE|OTHER",
  "lines": [
    { "description": "item or fee name", "amount": 123, "taxRate": 10 }
  ],
  "total": 123,
  "confidence": "high|medium|low"
}

Rules:
- amounts are integer JPY (no decimals, no currency symbols)
- taxRate must be 8, 10, or 0
- category: CONVENIENCE for konbini/convenience stores, TOLL for highways/ETC, PARKING for parking, OFFICE for stationery/supplies, OTHER if unclear
- one line per visible item when practical; use total line amounts as printed
- if date is unreadable use null`;

function getLmStudioConfig() {
  const baseUrl = process.env.LMSTUDIO_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:1234/v1";
  const model = process.env.RECEIPT_AI_MODEL ?? "qwen/qwen2.5-vl-7b";
  const mergeThreshold = Number(process.env.RECEIPT_MERGE_THRESHOLD ?? "1000");
  return { baseUrl, model, mergeThreshold };
}

function parseJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1]!.trim() : trimmed;
  return JSON.parse(candidate);
}

function normalizeExtraction(raw: unknown): ReceiptExtraction {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid extraction payload");
  }
  const data = raw as Record<string, unknown>;
  const linesRaw = Array.isArray(data.lines) ? data.lines : [];
  const lines: ReceiptExtractionLine[] = [];

  for (const item of linesRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const description = String(row.description ?? "").trim();
    const amount = Math.round(Number(row.amount));
    const taxRate = parseTaxRate(row.taxRate) ?? 10;
    if (!description || !Number.isFinite(amount) || amount <= 0) continue;
    lines.push({ description, amount, taxRate });
  }

  if (lines.length === 0) {
    throw new Error("No line items extracted");
  }

  return {
    vendor: data.vendor ? String(data.vendor).trim() : null,
    date: data.date ? String(data.date).trim() : null,
    category: parseExpenseCategory(
      typeof data.category === "string" ? data.category : null
    ),
    lines,
    total: Number.isFinite(Number(data.total)) ? Math.round(Number(data.total)) : null,
    confidence: data.confidence ? String(data.confidence) : null,
  };
}

export async function extractReceiptFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<ReceiptExtraction> {
  const { baseUrl, model } = getLmStudioConfig();
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new Error("LM_STUDIO_UNREACHABLE");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LM_STUDIO_ERROR:${response.status}:${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | unknown } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) =>
              typeof part === "object" && part && "text" in part
                ? String((part as { text: string }).text)
                : ""
            )
            .join("")
        : "";

  if (!text.trim()) {
    throw new Error("EMPTY_MODEL_RESPONSE");
  }

  try {
    return normalizeExtraction(parseJsonFromModelText(text));
  } catch {
    throw new Error("PARSE_FAILED");
  }
}

export function getReceiptMergeThreshold(): number {
  const value = Number(process.env.RECEIPT_MERGE_THRESHOLD ?? "1000");
  return Number.isFinite(value) && value > 0 ? value : 1000;
}

export function parseReceiptExpenseDate(dateStr: string | null): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parsed = new Date(`${dateStr}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = new Date();
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
}
