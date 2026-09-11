import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Loader2, MinusCircle, PlusCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CameraCapture } from "@/components/CameraCapture";
import { ReviewItems } from "@/components/ReviewItems";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { extractMedicines } from "@/lib/ai.functions";
import { commitStockRows, toReviewRows, type ReviewRow } from "@/lib/stockActions";
import { uploadImage } from "@/lib/storage";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "Photo stock entry | Jan Pharma SmartStock" },
      { name: "description", content: "Photograph medicine boxes in bulk and let AI add them to your stock." },
      { property: "og:title", content: "Photo stock entry | Jan Pharma SmartStock" },
      { property: "og:description", content: "Photograph medicine boxes in bulk and let AI add them to your stock." },
    ],
  }),
  component: () => (
    <AppShell>
      <CapturePage />
    </AppShell>
  ),
});

function CapturePage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const extract = useServerFn(extractMedicines);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [direction, setDirection] = useState<"in" | "out">("in");

  const analyze = async (shots: string[]) => {
    setImages(shots);
    setBusy(true);
    try {
      const result = await extract({ data: { images: shots } });
      const parsed = toReviewRows(result.items);
      if (!parsed.length) toast.error("No medicine could be read. Try a closer, brighter photo.");
      setRows(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI could not read the photos");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    setBusy(true);
    try {
      const imageUrl = images[0] ? await uploadImage(images[0], "medicines") : null;
      const { created, updated } = await commitStockRows(rows, {
        type: direction,
        source: "photo",
        reason: imageUrl ?? undefined,
      });
      toast.success(`${created + updated} medicines updated`);
      setRows([]);
      setImages([]);
      void qc.invalidateQueries();
    } catch {
      toast.error("Could not save stock");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t("bulkPhotos")} subtitle={t("review")} />

      <main className="mx-auto -mt-4 max-w-md space-y-4 px-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-2 shadow-card">
          <Button variant={direction === "in" ? "default" : "ghost"} onClick={() => setDirection("in")}>
            <PlusCircle className="mr-1 h-4 w-4" /> {t("addStock")}
          </Button>
          <Button variant={direction === "out" ? "destructive" : "ghost"} onClick={() => setDirection("out")}>
            <MinusCircle className="mr-1 h-4 w-4" /> {t("removeStock")}
          </Button>
        </div>

        <Button size="lg" className="h-14 w-full text-base" onClick={() => setCameraOpen(true)} disabled={busy}>
          <Camera className="mr-2 h-5 w-5" /> {t("camera")}
        </Button>

        {!!images.length && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-card" />
            ))}
          </div>
        )}

        {busy && !rows.length && (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("analyzing")}
          </p>
        )}

        {!!rows.length && (
          <>
            <ReviewItems rows={rows} onChange={setRows} />
            <Button size="lg" className="h-14 w-full" onClick={() => void commit()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {direction === "in" ? t("confirmAdd") : t("removeStock")}
            </Button>
          </>
        )}
      </main>

      <CameraCapture
        open={cameraOpen}
        mode="photo"
        multiple
        title={t("bulkPhotos")}
        hint="Take photos of several boxes, strips or a written list"
        onClose={() => setCameraOpen(false)}
        onCapture={(shots) => void analyze(shots)}
      />
    </>
  );
}
