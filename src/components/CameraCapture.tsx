import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Images, RotateCcw, ScanLine, X, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { compressImage, fileToDataUrl } from "@/lib/storage";

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

type Props = {
  open: boolean;
  mode?: "photo" | "barcode";
  multiple?: boolean;
  title?: string;
  hint?: string;
  onClose: () => void;
  onCapture?: (images: string[]) => void;
  onBarcode?: (code: string) => void;
};

export function CameraCapture({
  open,
  mode = "photo",
  multiple = false,
  title,
  hint,
  onClose,
  onCapture,
  onBarcode,
}: Props) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
    setTorchOn(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      setShots([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        setTorchAvailable(Boolean(caps?.torch));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch {
        setError("Camera not available. Allow camera access in your browser, or pick photos from the gallery.");
      }
    };

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, stop]);

  // Barcode scanning loop
  useEffect(() => {
    if (!open || mode !== "barcode" || !ready) return;
    const Detector = (window as unknown as { BarcodeDetector?: new (o?: unknown) => BarcodeDetectorLike })
      .BarcodeDetector;
    if (!Detector) {
      setError("This phone's browser can't scan barcodes. Take a photo or type the code instead.");
      return;
    }
    const detector = new Detector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"],
    });
    let active = true;
    const tick = async () => {
      if (!active || !videoRef.current) return;
      try {
        const found = await detector.detect(videoRef.current);
        if (found.length && found[0].rawValue) {
          active = false;
          navigator.vibrate?.(60);
          onBarcode?.(found[0].rawValue);
          return;
        }
      } catch {
        /* frame not ready */
      }
      if (active) setTimeout(() => void tick(), 350);
    };
    void tick();
    return () => {
      active = false;
    };
  }, [open, mode, ready, onBarcode]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] } as MediaTrackConstraints);
      setTorchOn((v) => !v);
    } catch {
      setTorchAvailable(false);
    }
  };

  const takeShot = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const raw = canvas.toDataURL("image/jpeg", 0.9);
    const small = await compressImage(raw);
    navigator.vibrate?.(30);
    if (multiple) setShots((s) => [...s, small]);
    else {
      onCapture?.([small]);
      onClose();
    }
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list: string[] = [];
    for (const file of Array.from(files).slice(0, 6)) {
      list.push(await compressImage(await fileToDataUrl(file)));
    }
    if (multiple) setShots((s) => [...s, ...list]);
    else {
      onCapture?.(list);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 text-white">
        <button onClick={onClose} aria-label={t("cancel")} className="rounded-full bg-white/15 p-2">
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-medium">{title ?? t("camera")}</p>
        <button
          onClick={() => void toggleTorch()}
          aria-label="Flash"
          disabled={!torchAvailable}
          className="rounded-full bg-white/15 p-2 disabled:opacity-30"
        >
          {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {mode === "barcode" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-[78%] rounded-2xl border-2 border-white/80">
              <ScanLine className="absolute inset-x-0 top-1/2 mx-auto h-8 w-8 -translate-y-1/2 animate-pulse text-white" />
            </div>
          </div>
        )}
        {(hint || error) && (
          <p className="absolute inset-x-4 bottom-4 rounded-xl bg-black/60 px-3 py-2 text-center text-xs text-white">
            {error ?? hint}
          </p>
        )}
      </div>

      {shots.length > 0 && (
        <div className="flex gap-2 overflow-x-auto bg-black/80 px-4 py-3">
          {shots.map((s, i) => (
            <img key={i} src={s} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 bg-black px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <label className="flex cursor-pointer flex-col items-center gap-1 text-[11px] text-white/80">
          <Images className="h-6 w-6" />
          {t("gallery")}
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(e) => void pickFiles(e.target.files)}
          />
        </label>

        {mode === "photo" ? (
          <button
            onClick={() => void takeShot()}
            aria-label={t("capture")}
            className="h-18 w-18 rounded-full border-4 border-white/90 p-1 active:scale-95"
          >
            <span className="block h-14 w-14 rounded-full bg-white" />
          </button>
        ) : (
          <div className="flex h-16 items-center text-xs text-white/70">
            <Camera className="mr-2 h-5 w-5" /> {t("scanBarcode")}
          </div>
        )}

        {multiple ? (
          <button
            onClick={() => {
              if (!shots.length) return;
              onCapture?.(shots);
              onClose();
            }}
            disabled={!shots.length}
            className="flex flex-col items-center gap-1 text-[11px] text-white/80 disabled:opacity-40"
          >
            <Check className="h-6 w-6" />
            {shots.length ? `${shots.length}` : t("capture")}
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      {error && mode === "barcode" && (
        <div className="bg-black px-6 pb-6">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            <RotateCcw className="mr-2 h-4 w-4" /> {t("cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}
