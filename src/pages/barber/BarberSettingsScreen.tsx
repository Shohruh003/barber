import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  Edit3,
  Check,
  Camera,
  Eye,
  EyeOff,
  MapPin,
  Globe,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Bell,
  Scissors,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";
import { useBarberScheduleStore } from "@/store/barberScheduleStore";
import { useThemeStore } from "@/store/themeStore";
import { profileSchema, type ProfileFormData } from "@/lib/validation";
import { updateBarberProfile as updateBarberProfileAPI, getAvatarUrl } from "@/lib/apiClient";
import { LocationPickerMap } from "@/components/LocationPickerMap";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BarberSettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, uploadAvatar, logout } = useAuthStore();
  const { barber, loadBarber } = useBarberScheduleStore();
  const { theme, toggleTheme } = useThemeStore();

  const [editMode, setEditMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [geoAddress, setGeoAddress] = useState("");
  const [geoLat, setGeoLat] = useState<number | undefined>();
  const [geoLng, setGeoLng] = useState<number | undefined>();
  const [showMap, setShowMap] = useState(false);
  const [reminderDays, setReminderDays] = useState(14);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      oldPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (user) loadBarber(user.id);
  }, [user, loadBarber]);

  useEffect(() => {
    if (barber) {
      setGeoAddress(barber.geoAddress || "");
      setGeoLat(barber.latitude);
      setGeoLng(barber.longitude);
      setReminderDays(barber.reminderDays || 14);
    }
    if (user?.avatar) setAvatarUrl(user.avatar);
  }, [barber, user]);

  if (!user) return null;

  const onProfileSave = async (data: ProfileFormData) => {
    try {
      // Upload avatar file first if selected
      if (avatarFile) {
        await uploadAvatar(avatarFile);
        setAvatarFile(null);
        setAvatarPreview("");
      }

      const payload: Record<string, string | undefined> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
      };
      if (data.oldPassword && data.newPassword) {
        payload.oldPassword = data.oldPassword;
        payload.newPassword = data.newPassword;
      }
      await updateUser(payload);
      setEditMode(false);
      toast.success(t("profile.profileUpdated"));
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleSaveGeo = async (lat: number, lng: number, address: string) => {
    if (!barber) return;
    try {
      await updateBarberProfileAPI(barber.id, {
        latitude: lat,
        longitude: lng,
        geoAddress: address,
      } as any);
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
      await updateBarberProfileAPI(barber.id, { reminderDays } as any);
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
        <CardContent className="pt-5 pb-4">
          {editMode ? (
            <form onSubmit={handleSubmit(onProfileSave)} className="space-y-3">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview || getAvatarUrl(avatarUrl) || getAvatarUrl(user.avatar)} />
                    <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Camera className="h-3.5 w-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                      e.target.value = "";
                    }} />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("profile.name")}</Label>
                <Input {...register("name")} className="h-11" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("profile.email")}</Label>
                <Input type="email" {...register("email")} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("profile.phone")}</Label>
                <Input {...register("phone")} className="h-11" />
              </div>

              <Separator />
              <p className="text-xs text-muted-foreground">{t("profile.changePassword")}</p>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("profile.oldPassword")}</Label>
                <div className="relative">
                  <Input type={showOldPass ? "text" : "password"} {...register("oldPassword")} placeholder="••••••" className="h-11" />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowOldPass(!showOldPass)}>
                    {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("profile.newPassword")}</Label>
                <div className="relative">
                  <Input type={showNewPass ? "text" : "password"} {...register("newPassword")} placeholder="••••••" className="h-11" />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPass(!showNewPass)}>
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" className="flex-1 h-10">
                  <Check className="h-4 w-4 mr-1" />
                  {t("common.save")}
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => { setEditMode(false); reset(); setAvatarFile(null); setAvatarPreview(""); setAvatarUrl(user.avatar || ""); }}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarPreview || getAvatarUrl(avatarUrl) || getAvatarUrl(user.avatar)} />
                  <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-lg">{user.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full h-10" onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                {t("profile.editProfile")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barber Profile & Stats navigation */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-all" onClick={() => navigate("/barber/profile-edit")}>
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Scissors className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-sm text-center">{t("barberApp.barberProfile")}</span>
            <span className="text-[10px] text-muted-foreground">{t("barberApp.bioServicesGallery")}</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-all" onClick={() => navigate("/barber/stats")}>
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <BarChart3 className="h-5 w-5 text-green-500" />
            </div>
            <span className="font-semibold text-sm text-center">{t("barberApp.statistics")}</span>
            <span className="text-[10px] text-muted-foreground">{t("barberApp.revenueAndClients")}</span>
          </CardContent>
        </Card>
      </div>

      {/* Geo-location */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
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
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("barberApp.noLocationSet")}
                </p>
              )}
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => setShowMap(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {geoAddress ? t("barberApp.changeLocation") : t("barberApp.setLocation")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reminder settings */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">{t("barberApp.reminderSettings")}</span>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground flex-1">{t("barberApp.reminderDays")}</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="w-20 h-9 text-center"
            />
            <Button size="sm" className="h-9" onClick={handleSaveReminder}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
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
                  "flex-1 rounded-xl border p-2.5 text-center transition-all touch-target",
                  currentLang === lang.code
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <p className="text-xs mt-0.5">{lang.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between"
          >
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
      <Button
        variant="destructive"
        className="w-full h-12 text-base font-semibold"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-2" />
        {t("barberApp.logout")}
      </Button>

      <div className="h-4" />
    </div>
  );
}
