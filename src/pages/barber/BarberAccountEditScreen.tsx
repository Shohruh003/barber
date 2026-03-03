import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneToRaw } from "@/components/PhoneInput";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { profileSchema, type ProfileFormData } from "@/lib/validation";
import { getAvatarUrl } from "@/lib/apiClient";
import toast from "react-hot-toast";

export default function BarberAccountEditScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, uploadAvatar } = useAuthStore();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name,
      phone: user?.phone,
      oldPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (user?.avatar) setAvatarUrl(user.avatar);
  }, [user]);

  if (!user) return null;

  const onSave = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      if (avatarFile) {
        await uploadAvatar(avatarFile);
        setAvatarFile(null);
        setAvatarPreview("");
      }
      const payload: Record<string, string | undefined> = {
        name: data.name,
        phone: phoneToRaw(data.phone),
      };
      if (data.oldPassword && data.newPassword) {
        payload.oldPassword = data.oldPassword;
        payload.newPassword = data.newPassword;
      }
      await updateUser(payload);
      toast.success(t("profile.profileUpdated"));
      navigate(-1);
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("profile.editProfile")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="px-4 py-4 space-y-4">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || getAvatarUrl(avatarUrl) || getAvatarUrl(user.avatar)} />
              <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Camera className="h-4 w-4" />
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

        {/* Name */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.name")}</Label>
              <Input {...register("name")} className="h-11" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
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
          </CardContent>
        </Card>

        {/* Save */}
        <Button
          type="submit"
          className="w-full h-12"
          disabled={saving || (!isDirty && !avatarFile)}
        >
          <Check className="h-4 w-4 mr-2" />
          {saving ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </div>
  );
}
