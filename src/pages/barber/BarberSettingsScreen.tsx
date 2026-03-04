import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Edit3,
  Check,
  MapPin,
  Globe,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Bell,
  Scissors,
  Copy,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { useBarberScheduleStore } from "@/store/barberScheduleStore";
import { useThemeStore } from "@/store/themeStore";
import {
  updateBarberProfile as updateBarberProfileAPI,
  fetchBarberReviews,
  getAvatarUrl,
} from "@/lib/apiClient";
import type { Review } from "@/types";
import { LocationPickerMap } from "@/components/LocationPickerMap";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BarberSettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { barber, loadBarber } = useBarberScheduleStore();
  const { theme, toggleTheme } = useThemeStore();

  const [geoAddress, setGeoAddress] = useState(() => barber?.geoAddress || "");
  const [geoLat, setGeoLat] = useState<number | undefined>(() => barber?.latitude);
  const [geoLng, setGeoLng] = useState<number | undefined>(() => barber?.longitude);
  const [showMap, setShowMap] = useState(false);
  const [reminderDays, setReminderDays] = useState(() => barber?.reminderDays || 14);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (user) loadBarber(user.id);
  }, [user, loadBarber]);

  const handleShowReviews = async () => {
    if (!barber) return;
    setShowReviews(true);
    setReviewsLoading(true);
    try {
      const data = await fetchBarberReviews(barber.id);
      setReviews(data);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setReviewsLoading(false);
    }
  };

  // Sync barber data when loaded
  const barberGeo = barber?.geoAddress || "";
  const barberLat = barber?.latitude;
  const barberLng = barber?.longitude;
  const barberReminder = barber?.reminderDays || 14;
  if (barberGeo !== geoAddress && barberGeo) setGeoAddress(barberGeo);
  if (barberLat !== geoLat && barberLat !== undefined) setGeoLat(barberLat);
  if (barberLng !== geoLng && barberLng !== undefined) setGeoLng(barberLng);
  if (barberReminder !== reminderDays && barber) setReminderDays(barberReminder);

  if (!user) return null;

  const handleSaveGeo = async (lat: number, lng: number, address: string) => {
    if (!barber) return;
    try {
      await updateBarberProfileAPI(barber.id, {
        latitude: lat,
        longitude: lng,
        geoAddress: address,
      });
      setGeoLat(lat);
      setGeoLng(lng);
      setGeoAddress(address);
      setShowMap(false);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleSaveReminder = async () => {
    if (!barber) return;
    try {
      await updateBarberProfileAPI(barber.id, { reminderDays });
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentLang = i18n.language;
  const languages = [
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Profile card */}
      <Card>
        <CardContent className="relative pt-5 pb-5">
          <button
            onClick={() => navigate("/barber/account-edit")}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Edit3 className="h-4 w-4 text-primary" />
          </button>

          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={getAvatarUrl(user.avatar)} />
              <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            {barber && barber.reviewCount > 0 && (
              <button
                onClick={handleShowReviews}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm">{barber.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({barber.reviewCount} {t("barberApp.reviews")})</span>
              </button>
            )}
            <div>
              <p className="font-bold text-xl">{user.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barber Profile navigation */}
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-all"
        onClick={() => navigate("/barber/profile-edit")}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Scissors className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-sm">{t("barberApp.barberProfile")}</span>
            <p className="text-[11px] text-muted-foreground">{t("barberApp.bioServicesGallery")}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Geo-location */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">{t("barberApp.shopLocation")}</span>
          </div>
          {showMap ? (
            <LocationPickerMap
              latitude={geoLat}
              longitude={geoLng}
              geoAddress={geoAddress}
              onSave={handleSaveGeo}
              onCancel={() => setShowMap(false)}
            />
          ) : (
            <>
              {geoAddress ? (
                <div className="relative rounded-lg bg-muted/50 p-3">
                  <button
                    type="button"
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(geoAddress);
                      toast.success(t("common.copied"));
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <div className="flex items-start gap-2 pr-8">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words">{geoAddress}</p>
                      {geoLat && geoLng && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                          {geoLat.toFixed(6)}, {geoLng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("barberApp.noLocationSet")}</p>
              )}
              <Button variant="outline" className="w-full h-10" onClick={() => setShowMap(true)}>
                <MapPin className="h-4 w-4 mr-2" />
                {geoAddress ? t("barberApp.changeLocation") : t("barberApp.setLocation")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reminder */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <span className="font-semibold text-sm">{t("barberApp.reminderSettings")}</span>
                <p className="text-[11px] text-muted-foreground">{t("barberApp.reminderDays")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={reminderDays}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  if (raw === "") { setReminderDays(0); return; }
                  const num = parseInt(raw, 10);
                  if (num <= 90) setReminderDays(num);
                }}
                className="w-16 h-9 text-center"
              />
              <Button
                size="sm"
                className="h-9"
                onClick={handleSaveReminder}
                disabled={reminderDays === (barber?.reminderDays || 14) || reminderDays < 1}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language + Theme */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">{t("barberApp.language")}</span>
            </div>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-center transition-all touch-target",
                    currentLang === lang.code
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <p className="text-[10px] mt-0.5">{lang.label}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <button onClick={toggleTheme} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              <span className="font-semibold text-sm">{t("barberApp.theme")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {theme === "dark" ? t("barberApp.darkMode") : t("barberApp.lightMode")}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" className="w-full h-11" onClick={handleLogout}>
        <LogOut className="h-5 w-5 mr-2" />
        {t("barberApp.logout")}
      </Button>

      <div className="h-4" />

      {/* Reviews dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              {t("barberApp.reviews")} ({barber?.reviewCount || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {reviewsLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">{t("common.loading")}...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">{t("barberApp.noReviews")}</div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={getAvatarUrl(r.userAvatar)} />
                      <AvatarFallback className="text-xs">{r.userName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{r.userName}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3 w-3",
                            s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
