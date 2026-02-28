import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  Download,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAiStyle } from "@/lib/apiClient";
import toast from "react-hot-toast";

export default function CustomerAIStyleScreen() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");

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
      toast.error(err.message || t("aiStyle.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-style-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("aiStyle.error"));
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
    <div className="min-h-full pb-24">
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          {t("aiStyle.subtitle")}
        </p>

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
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={handleReset}
                  >
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
                <Button
                  className="w-full h-12 text-base"
                  onClick={handleGenerate}
                >
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
                <p className="font-semibold text-sm">
                  {t("aiStyle.uploadPhoto")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("aiStyle.uploadHint")}
                </p>
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
    </div>
  );
}
