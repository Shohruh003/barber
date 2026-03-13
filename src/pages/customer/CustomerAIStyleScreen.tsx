import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  Download,
  RefreshCw,
  Sparkles,
  X,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAiStyle, fetchMyBalance } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const TELEGRAM_BOT_URL = "https://t.me/barberbook_support_bot";
const AI_FREE_DAILY = 3;
const AI_COST = 1000;

export default function CustomerAIStyleScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const [aiModal, setAiModal] = useState<{ balance: number; isLimit: boolean } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage("");
    }
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const res = await generateAiStyle(selectedFile);
      setGeneratedImage(res.generatedImage);
    } catch (err: any) {
      const msg: string = err.message || "";
      // Kunlik limit yoki balans yetarli emas
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
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 pb-24">
      <div className="w-full space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          {t("aiStyle.subtitle")}
        </p>

        {/* Bepul limit haqida ma'lumot */}
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Kunlik <span className="font-semibold text-foreground">{AI_FREE_DAILY} ta</span> bepul · Keyingisi <span className="font-semibold text-foreground">{AI_COST.toLocaleString()} so'm</span></span>
          </div>
          {user?.gender && (
            <span className="text-muted-foreground">
              {user.gender === "FEMALE" ? "👩 Ayollar soch turmagi generatsiya qilinadi" : "👨 Erkaklar soch turmagi generatsiya qilinadi"}
            </span>
          )}
        </div>

        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  {t("aiStyle.generating")}
                </p>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      {t("aiStyle.original")}
                    </p>
                    <img
                      src={previewUrl}
                      className="rounded-xl w-full aspect-[3/4] object-cover border"
                      alt="Original"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      {t("aiStyle.result")}
                    </p>
                    <img
                      src={generatedImage}
                      className="rounded-xl w-full aspect-[3/4] object-cover border"
                      alt="AI Generated"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-11" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t("aiStyle.download")}
                  </Button>
                  <Button variant="outline" className="flex-1 h-11" onClick={handleReset}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("aiStyle.tryAgain")}
                  </Button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={previewUrl}
                    className="rounded-xl w-full max-h-96 object-cover"
                    alt="Preview"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                <Button className="w-full h-12 text-base" onClick={handleGenerate}>
                  <Sparkles className="h-5 w-5 mr-2" />
                  {t("aiStyle.generate")}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary/60 hover:bg-accent/30 transition-all"
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
          </div>
        </div>
      </div>

      {/* AI limit / balans yetarli emas modali */}
      {aiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold">
                {aiModal.isLimit ? "Balans yetarli emas" : "Kunlik limit tugadi"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kuniga <span className="font-semibold text-foreground">{AI_FREE_DAILY} ta</span> generatsiya <span className="font-semibold text-green-500">bepul</span>.
                <br />
                4-dan boshlab har biri uchun{" "}
                <span className="font-semibold text-foreground">{AI_COST.toLocaleString()} so'm</span>.
              </p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joriy balans:{" "}
                  <span className={`font-semibold ${aiModal.balance < AI_COST ? "text-destructive" : "text-foreground"}`}>
                    {aiModal.balance.toLocaleString()} so'm
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
                💳 Hisob to'ldirish (Telegram)
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setAiModal(null)}
              >
                Keyinroq
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
