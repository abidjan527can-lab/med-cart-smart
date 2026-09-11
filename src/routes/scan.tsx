import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CameraCapture } from "@/components/CameraCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { adjustStock } from "@/lib/stockActions";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Barcode scan | Jan Pharma SmartStock" },
      { name: "description", content: "Scan a medicine barcode to add or subtract stock instantly." },
      { property: "og:title", content: "Barcode scan | Jan Pharma SmartStock" },
      { property: "og:description", content: "Scan a medicine barcode to add or subtract stock instantly." },
    ],
  }),
  component: () => (
    <AppShell>
      <ScanPage />
    </AppShell>
  ),
});

type Medicine = { id: string; name: string; quantity: number; sale_price: number; barcode: string | null };

function ScanPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [code, setCode] = useState("");
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);
  const [newName, setNewName] = useState("");

  const lookup = async (value: string) => {
    setCode(value);
    setNotFound(null);
    setMedicine(null);
    const { data } = await supabase
      .from("medicines")
      .select("id, name, quantity, sale_price, barcode")
      .eq("barcode", value)
      .maybeSingle();
    if (data) {
      setMedicine(data as Medicine);
      setAmount(1);
    } else {
      setNotFound(value);
      setNewName("");
    }
  };

  const apply = async (direction: 1 | -1) => {
    if (!medicine) return;
    await adjustStock(medicine.id, direction * amount, "barcode");
    const next = Math.max(0, medicine.quantity + direction * amount);
    setMedicine({ ...medicine, quantity: next });
    void qc.invalidateQueries();
    toast.success(`${medicine.name}: ${next}`);
  };

  const createMedicine = async () => {
    if (!newName.trim() || !notFound) return;
    const { data, error } = await supabase
      .from("medicines")
      .insert({ name: newName.trim(), barcode: notFound, quantity: 0 })
      .select("id, name, quantity, sale_price, barcode")
      .single();
    if (error) return toast.error(error.message);
    setMedicine(data as Medicine);
    setNotFound(null);
    toast.success(t("addMedicine"));
  };

  return (
    <>
      <PageHeader title={t("scanBarcode")} subtitle={t("addStock") + " / " + t("removeStock")} />

      <main className="mx-auto -mt-4 max-w-md space-y-4 px-4">
        <Button size="lg" className="h-14 w-full text-base" onClick={() => setCameraOpen(true)}>
          <ScanLine className="mr-2 h-5 w-5" /> {t("camera")}
        </Button>

        <div className="rounded-2xl bg-card p-4 shadow-card">
          <Label htmlFor="code" className="text-xs text-muted-foreground">
            {t("search")}
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="code"
              value={code}
              inputMode="numeric"
              placeholder="8964000..."
              onChange={(e) => setCode(e.target.value)}
            />
            <Button variant="secondary" onClick={() => void lookup(code)}>
              OK
            </Button>
          </div>
        </div>

        {medicine && (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <p className="font-display text-lg font-semibold">{medicine.name}</p>
            <p className="text-xs text-muted-foreground">{medicine.barcode}</p>
            <p className="mt-4 font-display text-4xl font-semibold text-primary">{medicine.quantity}</p>
            <p className="text-xs text-muted-foreground">{t("quantity")}</p>

            <div className="mt-4 flex items-center justify-center gap-4">
              <Button size="icon" variant="outline" onClick={() => setAmount((a) => Math.max(1, a - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-display text-xl font-semibold">{amount}</span>
              <Button size="icon" variant="outline" onClick={() => setAmount((a) => a + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button size="lg" onClick={() => void apply(1)}>
                <Plus className="mr-1 h-4 w-4" /> {t("addStock")}
              </Button>
              <Button size="lg" variant="destructive" onClick={() => void apply(-1)}>
                <Minus className="mr-1 h-4 w-4" /> {t("removeStock")}
              </Button>
            </div>
          </div>
        )}

        {notFound && (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <p className="text-sm">
              {t("noResults")} — <span className="font-mono text-xs">{notFound}</span>
            </p>
            <div className="mt-3 flex gap-2">
              <Input placeholder={t("name")} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button onClick={() => void createMedicine()}>{t("add")}</Button>
            </div>
          </div>
        )}
      </main>

      <CameraCapture
        open={cameraOpen}
        mode="barcode"
        title={t("scanBarcode")}
        hint="Hold the barcode inside the frame"
        onClose={() => setCameraOpen(false)}
        onBarcode={(value) => {
          setCameraOpen(false);
          void lookup(value);
        }}
      />
    </>
  );
}
