import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

type Msg = { role: "system" | "user"; content: unknown };

async function callGateway(messages: Msg[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app yet.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is busy right now. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are finished. Please top up to keep using AI features.");
    if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
    throw new Error(`AI request failed (${res.status}). ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string, fallback: T): T {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) return fallback;
  const slice = cleaned.slice(start);
  try {
    return JSON.parse(slice) as T;
  } catch {
    const lastBrace = Math.max(slice.lastIndexOf("]"), slice.lastIndexOf("}"));
    try {
      return JSON.parse(slice.slice(0, lastBrace + 1)) as T;
    } catch {
      return fallback;
    }
  }
}

function imageMessage(instruction: string, images: string[]) {
  return {
    role: "user" as const,
    content: [
      { type: "text", text: instruction },
      ...images.map((url) => ({ type: "image_url", image_url: { url } })),
    ],
  };
}

export type ExtractedItem = {
  name: string;
  generic_name?: string;
  manufacturer?: string;
  strength?: string;
  form?: string;
  pack_size?: string;
  batch_no?: string;
  expiry_date?: string;
  quantity?: number;
  unit_price?: number;
  sale_price?: number;
  barcode?: string;
};

const imagesInput = z.object({ images: z.array(z.string()).min(1).max(6) });

const SCHEMA_NOTE = `Return ONLY a JSON array. Each element: {"name": string, "generic_name": string|null, "manufacturer": string|null, "strength": string|null, "form": string|null, "pack_size": string|null, "batch_no": string|null, "expiry_date": "YYYY-MM-DD"|null, "quantity": number|null, "unit_price": number|null, "sale_price": number|null, "barcode": string|null}. Use null when unknown. Dates printed as MM/YYYY become the last day of that month. Never invent medicines that are not visible.`;

/** Reads medicine boxes / strips / handwritten lists from one or more photos. */
export const extractMedicines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => imagesInput.parse(d))
  .handler(async ({ data }) => {
    const raw = await callGateway([
      {
        role: "system",
        content:
          "You are a pharmacy stock assistant for a Pakistani pharmacy. You read medicine packaging, strips, shelf photos and handwritten stock lists (English or Urdu) and turn them into structured stock rows.",
      },
      imageMessage(
        `Identify every distinct medicine visible in these photos, including handwritten names. Count how many packs of each are visible; if the count is unclear use 1. Prices may be printed as MRP/Rs. ${SCHEMA_NOTE}`,
        data.images,
      ),
    ]);
    return { items: parseJson<ExtractedItem[]>(raw, []) };
  });

/** Reads a supplier purchase invoice photo into line items. */
export const extractInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => imagesInput.parse(d))
  .handler(async ({ data }) => {
    const raw = await callGateway([
      {
        role: "system",
        content:
          "You are a pharmacy purchase-invoice reader. You extract supplier bills (printed or handwritten, English or Urdu) into structured data.",
      },
      imageMessage(
        `Read this supplier invoice. Return ONLY JSON: {"supplier_name": string|null, "invoice_no": string|null, "invoice_date": "YYYY-MM-DD"|null, "total": number|null, "items": [ ... ]} where each item follows this shape: {"name": string, "batch_no": string|null, "expiry_date": "YYYY-MM-DD"|null, "quantity": number, "unit_price": number|null, "sale_price": number|null}. Quantity must be the purchased pack/unit count. Use null when unknown.`,
        data.images,
      ),
    ]);
    return parseJson<{
      supplier_name?: string;
      invoice_no?: string;
      invoice_date?: string;
      total?: number;
      items: ExtractedItem[];
    }>(raw, { items: [] });
  });

/** Reads a doctor's prescription into an order draft. */
export const extractPrescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => imagesInput.parse(d))
  .handler(async ({ data }) => {
    const raw = await callGateway([
      {
        role: "system",
        content:
          "You are a pharmacist assistant reading doctor prescriptions, including difficult handwriting and Urdu notes.",
      },
      imageMessage(
        `Read this prescription. Return ONLY JSON: {"patient_name": string|null, "doctor_name": string|null, "items": [{"name": string, "strength": string|null, "quantity": number, "dosage": string|null}], "notes": string|null}. Quantity is how many units/packs to dispense; if unclear use 1.`,
        data.images,
      ),
    ]);
    return parseJson<{
      patient_name?: string;
      doctor_name?: string;
      notes?: string;
      items: { name: string; strength?: string; quantity?: number; dosage?: string }[];
    }>(raw, { items: [] });
  });

/** Free-form pharmacy assistant grounded on a snapshot of the shop's data. */
export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ question: z.string().min(1).max(500), context: z.string().max(12000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const raw = await callGateway([
      {
        role: "system",
        content:
          "You are the assistant inside a pharmacy management app. Answer briefly and practically using the shop data provided. If the answer is not in the data, say so. Reply in the same language the question uses (English or Urdu). Never give medical dosage advice to patients; you speak to pharmacy staff.",
      },
      { role: "user", content: `Shop data:\n${data.context}\n\nQuestion: ${data.question}` },
    ]);
    return { answer: raw.trim() };
  });
