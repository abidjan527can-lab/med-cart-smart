import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CameraCapture } from "@/components/CameraCapture";
import { ReviewItems } from "@/components/ReviewItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { extractInvoice } from "@/lib/ai.functions";
import { commitStockRows, toReviewRows, type ReviewRow } from "@/lib/stockActions";
import { uploadImage } from "@/lib/storage";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Purchase invoices | Jan Pharma SmartStock" },
      { name: "description", content: "Photograph a supplier bill and add every item to stock automatically." },
      { property: "og:title", content: "Purchase invoices | Jan Pharma SmartStock" },
      { property: "og:description", content: "Photograph a supplier bill and add every item to stock automatically." },
    ],
  }),
  component: () => (
    <AppShell>
      <InvoicesPage />
    </AppShell>
  ),
});

function InvoicesPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const extract = useServerFn(extractInvoice);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [rows, setRows] = useState<ReviewRow[]>([]);

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, supplier_name, invoice_no, invoice_date, total, status")
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const analyze = async (shots: string[]) => {
    setImage(shots[0]);
    setBusy(true);
    try {
      const result = await extract({ data: { images: shots } });
      setSupplierName(result.supplier_name ?? "");
      setInvoiceNo(result.invoice_no ?? "");
      const parsed = toReviewRows(result.items ?? []);
      if (!parsed.length) toast.error("No items could be read from this bill.");
      setRows(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI could not read the invoice");
    } finally {
      setBusy(false);
    }
  };

  const post = async () => {
    setBusy(true);
    try {
      const imageUrl = image ? await uploadImage(image, "invoices") : null;
      const total = rows.reduce((sum, r) => sum + r.quantity * Number(r.unit_price ?? 0), 0);
      const { data: invoice } = await supabase
        .from("invoices")
        .insert({
          supplier_name: supplierName || null,
          invoice_no: invoiceNo || null,
          total,
          image_url: imageUrl,
          status: "posted",
        })
        .select("id")
        .single();

      if (invoice) {
        await supabase.from("invoice_items").insert(
          rows
            .filter((r) => r._include)
            .map((r) => ({
              invoice_id: invoice.id,
              name: r.name,
              batch_no: r.batch_no ?? null,
              expiry_date: r.expiry_date ?? null,
              quantity: r.quantity,
              unit_price: r.unit_price ?? 0,
              sale_price: r.sale_price ?? 0,
            })),
        );
      }

      await commitStockRows(rows, { type: "in", source: "invoice", referenceId: invoice?.id });
      toast.success("Invoice added to stock");
      setRows([]);
      setImage(null);
      setSupplierName("");
      setInvoiceNo("");
      void qc.invalidateQueries();
    } catch {
      toast.error("Could not save the invoice");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t("invoices")} subtitle={t("invoicePhoto")} />

      <main className="mx-auto -mt-4 max-w-md space-y-4 px-4">
        <Button size="lg" className="h-14 w-full text-base" onClick={() => setCameraOpen(true)} disabled={busy}>
          <Receipt className="mr-2 h-5 w-5" /> {t("invoicePhoto")}
        </Button>

        {image && <img src={image} alt="" className="w-full rounded-2xl shadow-card" />}

        {busy && !rows.length && (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("analyzing")}
          </p>
        )}

        {!!rows.length && (
          <>
            <div className="grid gap-2 rounded-2xl bg-card p-4 shadow-card">
              <Input placeholder={t("supplier")} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              <Input placeholder="Invoice #" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
            <ReviewItems rows={rows} onChange={setRows} />
            <Button size="lg" className="h-14 w-full" onClick={() => void post()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("confirmAdd")}
            </Button>
          </>
        )}

        <section>
          <h2 className="mb-2 font-display text-base font-semibold">{t("invoices")}</h2>
          {invoices?.length ? (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card">
                  <div>
                    <p className="text-sm font-medium">{inv.supplier_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.invoice_no ?? ""} {inv.invoice_date ?? ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">Rs {Number(inv.total).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>
          )}
        </section>
      </main>

      <CameraCapture
        open={cameraOpen}
        mode="photo"
        multiple
        title={t("invoicePhoto")}
        hint="Fit the whole bill in the frame. Add more photos for long bills."
        onClose={() => setCameraOpen(false)}
        onCapture={(shots) => void analyze(shots)}
      />
    </>
  );
}
