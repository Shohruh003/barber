import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  Download,
  RefreshCw,
  Sparkles,
  X,
  Wallet,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAiStyle, fetchMyBalance } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TELEGRAM_BOT_URL = "https://t.me/barberbook_support_bot";
const AI_FREE_DAILY = 3;
const AI_COST = 1000;

const MALE_STYLE_KEYS: { key: string; labelKey: string; icon: string }[] = [
  { key: "hair", labelKey: "aiStyle.styleHair", icon: "💇‍♂️" },
  { key: "beard", labelKey: "aiStyle.styleBeard", icon: "🧔" },
];

const FEMALE_STYLE_KEYS: { key: string; labelKey: string; icon: string }[] = [
  { key: "hair", labelKey: "aiStyle.styleHair", icon: "💇‍♀️" },
  { key: "hair_color", labelKey: "aiStyle.styleHairColor", icon: "🎨" },
  { key: "eyebrows", labelKey: "aiStyle.styleEyebrows", icon: "✏️" },
  { key: "lips", labelKey: "aiStyle.styleLips", icon: "💋" },
  { key: "eyelashes", labelKey: "aiStyle.styleEyelashes", icon: "👁️" },
];

export default function CustomerAIStyleScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const [activeRefKey, setActiveRefKey] = useState<string | null>(null);

  const gender = user?.gender ?? null;
  const styleOptionKeys = gender === "FEMALE" ? FEMALE_STYLE_KEYS : MALE_STYLE_KEYS;
  const styleOptions = styleOptionKeys.map((s) => ({ ...s, label: t(s.labelKey) }));

  const [selectedStyles, setSelectedStyles] = useState<string[]>(["hair"]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [generatedImage, setGeneratedImage] = useState("");
  const [aiModal, setAiModal] = useState<{ balance: number; isLimit: boolean } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [refFiles, setRefFiles] = useState<Record<string, File>>({});
  const [refPreviews, setRefPreviews] = useState<Record<string, string>>({});

  const startProgress = useCallback(() => {
    setProgress(0);
    let current = 0;
    progressTimerRef.current = setInterval(() => {
      // Tezlik: 0-60% tez, 60-85% sekin, 85-95% juda sekin, 95%da to'xtaydi
      const increment = current < 60 ? 2.5 : current < 85 ? 0.8 : current < 95 ? 0.2 : 0;
      current = Math.min(current + increment, 95);
      setProgress(Math.round(current));
      if (current >= 95) {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }
    }, 300);
  }, []);

  const finishProgress = useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress(100);
  }, []);

  const toggleStyle = (key: string) => {
    setSelectedStyles((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage("");
    }
    e.target.value = "";
  };

  const handleRefFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeRefKey) {
      const url = URL.createObjectURL(file);
      setRefFiles((prev) => ({ ...prev, [activeRefKey]: file }));
      setRefPreviews((prev) => ({ ...prev, [activeRefKey]: url }));
    }
    e.target.value = "";
    setActiveRefKey(null);
  };

  const removeRefImage = (key: string) => {
    setRefFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setRefPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const openRefPicker = (key: string) => {
    setActiveRefKey(key);
    setTimeout(() => refInputRef.current?.click(), 50);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    if (selectedStyles.length === 0) {
      toast.error(t("aiStyle.atLeastOneRequired"));
      return;
    }
    setLoading(true);
    startProgress();
    try {
      const activeRefFiles: Record<string, File> = {};
      for (const key of selectedStyles) {
        if (refFiles[key]) activeRefFiles[key] = refFiles[key];
      }
      const res = await generateAiStyle(selectedFile, selectedStyles, activeRefFiles);
      finishProgress();
      setGeneratedImage(res.generatedImage);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : "";
      if (msg.includes("yetarli emas") || msg.includes("400")) {
        try {
          const data = await fetchMyBalance();
          setAiModal({ balance: data.balance, isLimit: data.balance < AI_COST });
        } catch {
          setAiModal({ balance: 0, isLimit: true });
        }
      } else {
        toast.error(t("aiStyle.error"));
      }
    } finally {
      setLoading(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-style-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(`<img src="${generatedImage}" style="width:100%;height:auto;" />`);
        w.document.title = "Save image";
      } else {
        toast.error(t("aiStyle.error"));
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setGeneratedImage("");
    Object.values(refPreviews).forEach((u) => URL.revokeObjectURL(u));
    setRefFiles({});
    setRefPreviews({});
  };

  const previewUrlRef = useRef(previewUrl);
  const refPreviewsRef = useRef(refPreviews);
  useEffect(() => { previewUrlRef.current = previewUrl; }, [previewUrl]);
  useEffect(() => { refPreviewsRef.current = refPreviews; }, [refPreviews]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      Object.values(refPreviewsRef.current).forEach((u) => URL.revokeObjectURL(u));
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  return (
    <div className="h-full flex flex-col px-4 pt-3 pb-3 gap-3">
      {/* Header */}
      <div className="flex-none space-y-1">
        <p className="text-sm text-muted-foreground text-center">
          {t("aiStyle.subtitle")}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            {t("aiStyle.dailyBadge", { free: AI_FREE_DAILY, price: AI_COST.toLocaleString() })}
          </span>
        </div>
      </div>

      {/* Style tanlash — horizontal scroll */}
      {!generatedImage && (
        <div className="flex-none">
          <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">
            {gender === "FEMALE" ? "👩" : "👨"} {t("aiStyle.styleQuestion")}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {styleOptions.map((opt) => {
              const isSelected = selectedStyles.includes(opt.key);
              const hasRef = !!refPreviews[opt.key];
              return (
                <div key={opt.key} className="flex flex-col gap-1 flex-none w-[72px]">
                  <button
                    type="button"
                    onClick={() => toggleStyle(opt.key)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 pt-3 pb-2.5 px-2 transition-all w-full",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40 bg-card",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-white stroke-2">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      </div>
                    )}
                    <span className="text-2xl leading-none">{opt.icon}</span>
                    <span className={cn(
                      "text-[10px] font-semibold leading-tight text-center",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {opt.label}
                    </span>
                  </button>

                  {/* Reference rasm */}
                  {isSelected && (
                    hasRef ? (
                      <div className="relative w-full">
                        <div
                          className="aspect-square rounded-xl overflow-hidden border-2 border-primary cursor-pointer"
                          onClick={() => setFullscreenImage(refPreviews[opt.key])}
                        >
                          <img
                            src={refPreviews[opt.key]}
                            className="w-full h-full object-cover"
                            alt="reference"
                          />
                        </div>
                        <button
                          onClick={() => removeRefImage(opt.key)}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openRefPicker(opt.key)}
                        className="flex items-center justify-center gap-0.5 py-1 rounded-xl border border-dashed border-primary/40 text-[9px] text-muted-foreground hover:border-primary hover:text-primary transition-all w-full"
                      >
                        <ImagePlus className="h-2.5 w-2.5" />
                        {t("aiStyle.reference")}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
          {selectedStyles.length === 0 && (
            <p className="text-xs text-destructive text-center mt-1">{t("aiStyle.selectAtLeastOne")}</p>
          )}
        </div>
      )}

      {/* Main photo area */}
      <div className="flex-1 min-h-0 rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="h-full flex flex-col p-4">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-2">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse text-center">
                {t("aiStyle.generating")}
              </p>
              {/* Progress bar */}
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {progress < 30 ? "🔍 Yuz tahlil qilinmoqda..." :
                     progress < 60 ? "🎨 Stil qo'llanmoqda..." :
                     progress < 85 ? "✨ Rasm yaratilmoqda..." :
                     progress < 100 ? "🖼️ Yakunlanmoqda..." :
                     "✅ Tayyor!"}
                  </span>
                  <span className="font-semibold text-primary">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : generatedImage ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    {t("aiStyle.original")}
                  </p>
                  <div className="aspect-[3/4] relative">
                    <img
                      src={previewUrl}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl border"
                      alt="Original"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    {t("aiStyle.result")}
                  </p>
                  <div className="aspect-[3/4] relative cursor-pointer" onClick={() => setFullscreenImage(generatedImage)}>
                    <img
                      src={generatedImage}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl border active:opacity-80"
                      alt="AI Generated"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-3 flex-none">
                <Button className="flex-1 h-11" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("aiStyle.download")}
                </Button>
                <Button variant="outline" className="flex-1 h-11" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("aiStyle.tryAgain")}
                </Button>
              </div>
            </>
          ) : previewUrl ? (
            <>
              <div className="flex-1 min-h-0 relative">
                <img
                  src={previewUrl}
                  className="h-full w-full object-cover rounded-xl"
                  alt="Preview"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="flex-none pt-3">
                <Button
                  className="w-full h-12 text-base"
                  onClick={handleGenerate}
                  disabled={selectedStyles.length === 0}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {t("aiStyle.generate")}
                </Button>
              </div>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-xl hover:border-primary/60 hover:bg-accent/30 transition-all"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-sm">{t("aiStyle.uploadPhoto")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("aiStyle.uploadHint")}</p>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={refInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleRefFileSelect}
          />
        </div>
      </div>

      {/* Fullscreen rasm ko'rish */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[200] bg-black flex flex-col"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={fullscreenImage}
              className="max-w-full max-h-full object-contain rounded-xl"
              alt="Fullscreen"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {fullscreenImage === generatedImage && (
            <div className="p-4 pb-8" onClick={(e) => e.stopPropagation()}>
              <Button className="w-full h-12 text-base" onClick={handleDownload}>
                <Download className="h-5 w-5 mr-2" />
                {t("aiStyle.download")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* AI limit / balans yetarli emas modali */}
      {aiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold">
                {aiModal.isLimit ? t("aiStyle.balanceLow") : t("aiStyle.limitReached")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("aiStyle.freeDailyHint", { free: AI_FREE_DAILY, next: AI_FREE_DAILY + 1, price: AI_COST.toLocaleString() })}
              </p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("aiStyle.currentBalance")}:{" "}
                  <span className={`font-semibold ${aiModal.balance < AI_COST ? "text-destructive" : "text-foreground"}`}>
                    {aiModal.balance.toLocaleString()} {t("common.currency")}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Button
                className="w-full"
                onClick={() => {
                  setAiModal(null);
                  window.open(TELEGRAM_BOT_URL, "_blank");
                }}
              >
                💳 {t("aiStyle.topUp")}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setAiModal(null)}
              >
                {t("aiStyle.later")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
