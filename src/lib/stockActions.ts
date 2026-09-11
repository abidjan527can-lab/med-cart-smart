import { supabase } from "@/integrations/supabase/client";
import type { ExtractedItem } from "@/lib/ai.functions";

export type ReviewRow = ExtractedItem & { quantity: number; _include: boolean };

export function toReviewRows(items: ExtractedItem[]): ReviewRow[] {
  return items
    .filter((i) => i?.name)
    .map((i) => ({
      ...i,
      name: String(i.name).trim(),
      quantity: Number(i.quantity ?? 1) || 1,
      _include: true,
    }));
}

async function findMedicine(row: ReviewRow) {
  if (row.barcode) {
    const { data } = await supabase.from("medicines").select("id, quantity").eq("barcode", row.barcode).maybeSingle();
    if (data) return data;
  }
  const { data } = await supabase
    .from("medicines")
    .select("id, quantity")
    .ilike("name", row.name)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Adds (or removes) stock for a list of reviewed rows, creating medicines that don't exist yet. */
export async function commitStockRows(
  rows: ReviewRow[],
  opts: { type: "in" | "out"; source: string; referenceId?: string; reason?: string },
) {
  let created = 0;
  let updated = 0;

  for (const row of rows.filter((r) => r._include && r.quantity > 0)) {
    let medicine = await findMedicine(row);

    if (!medicine) {
      const { data, error } = await supabase
        .from("medicines")
        .insert({
          name: row.name,
          generic_name: row.generic_name ?? null,
          manufacturer: row.manufacturer ?? null,
          strength: row.strength ?? null,
          form: row.form ?? null,
          pack_size: row.pack_size ?? null,
          barcode: row.barcode ?? null,
          batch_no: row.batch_no ?? null,
          expiry_date: row.expiry_date ?? null,
          purchase_price: row.unit_price ?? 0,
          sale_price: row.sale_price ?? row.unit_price ?? 0,
        })
        .select("id, quantity")
        .single();
      if (error) continue;
      medicine = data;
      created += 1;
    } else {
      updated += 1;
      const patch: Record<string, unknown> = {};
      if (row.batch_no) patch.batch_no = row.batch_no;
      if (row.expiry_date) patch.expiry_date = row.expiry_date;
      if (row.unit_price) patch.purchase_price = row.unit_price;
      if (row.sale_price) patch.sale_price = row.sale_price;
      if (row.barcode) patch.barcode = row.barcode;
      if (Object.keys(patch).length) await supabase.from("medicines").update(patch).eq("id", medicine.id);
    }

    await supabase.from("stock_movements").insert({
      medicine_id: medicine.id,
      type: opts.type,
      quantity: Math.abs(row.quantity),
      source: opts.source,
      reason: opts.reason ?? null,
      reference_id: opts.referenceId ?? null,
    });
  }

  return { created, updated };
}

export async function adjustStock(medicineId: string, delta: number, source = "manual") {
  if (!delta) return;
  await supabase.from("stock_movements").insert({
    medicine_id: medicineId,
    type: delta > 0 ? "in" : "out",
    quantity: Math.abs(delta),
    source,
  });
}
