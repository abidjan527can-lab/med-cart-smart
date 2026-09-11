import { Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { ReviewRow } from "@/lib/stockActions";

type Props = {
  rows: ReviewRow[];
  onChange: (rows: ReviewRow[]) => void;
  showPrices?: boolean;
};

export function ReviewItems({ rows, onChange, showPrices = true }: Props) {
  const { t } = useI18n();

  const patch = (index: number, next: Partial<ReviewRow>) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, ...next } : r)));

  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("noResults")}</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row, i) => (
        <li key={i} className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <Input
              value={row.name}
              onChange={(e) => patch(i, { name: e.target.value })}
              className="h-9 flex-1 font-medium"
              aria-label={t("name")}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("cancel")}
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {(row.strength || row.pack_size || row.manufacturer) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {[row.strength, row.form, row.pack_size, row.manufacturer].filter(Boolean).join(" · ")}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-border">
              <Button
                size="icon"
                variant="ghost"
                aria-label={t("subtract")}
                onClick={() => patch(i, { quantity: Math.max(0, row.quantity - 1) })}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                value={row.quantity}
                inputMode="numeric"
                onChange={(e) => patch(i, { quantity: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                className="w-12 bg-transparent text-center text-sm font-semibold outline-none"
                aria-label={t("quantity")}
              />
              <Button size="icon" variant="ghost" aria-label={t("add")} onClick={() => patch(i, { quantity: row.quantity + 1 })}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showPrices && (
              <>
                <Input
                  value={row.unit_price ?? ""}
                  inputMode="decimal"
                  placeholder={t("purchasePrice")}
                  onChange={(e) => patch(i, { unit_price: Number(e.target.value) || 0 })}
                  className="h-9"
                />
                <Input
                  value={row.sale_price ?? ""}
                  inputMode="decimal"
                  placeholder={t("salePrice")}
                  onChange={(e) => patch(i, { sale_price: Number(e.target.value) || 0 })}
                  className="h-9"
                />
              </>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <Input
              value={row.batch_no ?? ""}
              placeholder={t("batch")}
              onChange={(e) => patch(i, { batch_no: e.target.value })}
              className="h-9"
            />
            <Input
              type="date"
              value={row.expiry_date ?? ""}
              onChange={(e) => patch(i, { expiry_date: e.target.value })}
              className="h-9"
              aria-label={t("expiry")}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
