import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit3,
  Check,
  Mail,
  Phone,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  ImagePlus,
  Camera,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBarberScheduleStore } from "@/store/barberScheduleStore";
import { profileSchema } from "@/lib/validation";
import type { ProfileFormData } from "@/lib/validation";
import type { Service, Barber } from "@/types";
import toast from "react-hot-toast";

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuthStore();
  const { barber, loadBarber, updateBarberProfile } = useBarberScheduleStore();
  const [editMode, setEditMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone, oldPassword: "", newPassword: "" },
  });

  useEffect(() => {
    if (user && user.role === "barber") {
      loadBarber(user.id);
    }
  }, [user, loadBarber]);

  useEffect(() => {
    if (user?.avatar) setAvatarUrl(user.avatar);
  }, [user?.avatar]);

  if (!user) return <PageLoader />;

  const onProfileSave = async (data: ProfileFormData) => {
    try {
      const payload: Record<string, string | undefined> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: avatarUrl || undefined,
      };
      if (data.oldPassword && data.newPassword) {
        payload.oldPassword = data.oldPassword;
        payload.newPassword = data.newPassword;
      }
      await updateUser(payload);
      setEditMode(false);
      toast.success(t("profile.profileUpdated"));
    } catch {
      toast.error(t("profile.updateError") || "Xatolik yuz berdi");
    }
  };

  const roleLabel = user.role === "barber"
    ? t("profile.roleBarber")
    : user.role === "admin"
      ? t("profile.roleAdmin")
      : t("profile.roleUser");

  const isBarber = user.role === "barber";

  return (
    <div className={`container py-8 animate-fade-in mx-auto ${isBarber ? "max-w-2xl" : "max-w-lg"}`}>
      <h2 className="text-2xl font-bold mb-6">{t("profile.settings")}</h2>

      <Card>
        <CardHeader className="text-center">
          <div className="relative mx-auto w-fit">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || user.avatar} />
              <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            {editMode && (
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAvatarUrl(URL.createObjectURL(file));
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <CardTitle className="mt-3">{user.name}</CardTitle>
          <Badge variant="outline" className="mx-auto mt-2">
            <Shield className="h-3 w-3 mr-1" />
            {roleLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <form onSubmit={handleSubmit(onProfileSave)} className="space-y-3">
              <div className="space-y-2">
                <Label>{t("profile.name")}</Label>
                <Input {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("profile.email")}</Label>
                <Input type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("profile.phone")}</Label>
                <Input {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <Separator />
              <p className="text-sm text-muted-foreground">{t("profile.changePassword") || "Parolni o'zgartirish (ixtiyoriy)"}</p>

              <div className="space-y-2">
                <Label>{t("profile.oldPassword") || "Eski parol"}</Label>
                <div className="relative">
                  <Input type={showOldPass ? "text" : "password"} {...register("oldPassword")} placeholder="••••••" />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowOldPass(!showOldPass)}>
                    {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.newPassword") || "Yangi parol"}</Label>
                <div className="relative">
                  <Input type={showNewPass ? "text" : "password"} {...register("newPassword")} placeholder="••••••" />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPass(!showNewPass)}>
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  <Check className="h-4 w-4 mr-1" />
                  {t("common.save")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMode(false);
                    reset();
                    setAvatarUrl(user.avatar || "");
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {t("profile.email")}
                  </span>
                  <span>{user.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {t("profile.phone")}
                  </span>
                  <span>{user.phone}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEditMode(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {t("profile.editProfile")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Barber Professional Profile */}
      {isBarber && barber && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">{t("profile.barberProfile")}</h3>
          <BarberProfileTabs barber={barber} updateBarberProfile={updateBarberProfile} />
        </div>
      )}

      <Button
        variant="destructive"
        className="w-full mt-4"
        onClick={logout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {t("nav.logout")}
      </Button>
    </div>
  );
}

// ---------- BARBER PROFILE TABS ----------

function BarberProfileTabs({
  barber,
  updateBarberProfile,
}: {
  barber: Barber;
  updateBarberProfile: (barberId: string, data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>) => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="bio">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="bio">{t("profile.bioInfo")}</TabsTrigger>
        <TabsTrigger value="services">{t("profile.services")}</TabsTrigger>
        <TabsTrigger value="gallery">{t("profile.gallery")}</TabsTrigger>
      </TabsList>

      <TabsContent value="bio" className="mt-4">
        <BioInfoTab barber={barber} updateBarberProfile={updateBarberProfile} />
      </TabsContent>

      <TabsContent value="services" className="mt-4">
        <ServicesTab barber={barber} updateBarberProfile={updateBarberProfile} />
      </TabsContent>

      <TabsContent value="gallery" className="mt-4">
        <GalleryTab barber={barber} updateBarberProfile={updateBarberProfile} />
      </TabsContent>
    </Tabs>
  );
}

// ---------- BIO & INFO TAB ----------

function BioInfoTab({
  barber,
  updateBarberProfile,
}: {
  barber: Barber;
  updateBarberProfile: (barberId: string, data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [experience, setExperience] = useState(String(barber.experience));
  const [bio, setBio] = useState(barber.bio);
  const [bioUz, setBioUz] = useState(barber.bioUz);
  const [bioRu, setBioRu] = useState(barber.bioRu);
  const [location, setLocation] = useState(barber.location);
  const [locationUz, setLocationUz] = useState(barber.locationUz);
  const [locationRu, setLocationRu] = useState(barber.locationRu);
  const [instagram, setInstagram] = useState(barber.socialLinks?.instagram || "");
  const [telegram, setTelegram] = useState(barber.socialLinks?.telegram || "");
  const [facebook, setFacebook] = useState(barber.socialLinks?.facebook || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateBarberProfile(barber.id, {
      experience: experience,
      bio,
      bioUz,
      bioRu,
      location,
      locationUz,
      locationRu,
      socialLinks: { instagram, telegram, facebook },
    });
    setSaving(false);
    toast.success(t("profile.profileSaved"));
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>{t("profile.experience")}</Label>
          <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="5, 8+, 10+" />
        </div>

        <div className="space-y-2">
          <Label>{t("profile.bioUz")}</Label>
          <Textarea value={bioUz} onChange={(e) => setBioUz(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>{t("profile.bioRu")}</Label>
          <Textarea value={bioRu} onChange={(e) => setBioRu(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>{t("profile.bio")}</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        </div>

        <div className="space-y-2">
          <Label>{t("profile.locationUz")}</Label>
          <Input value={locationUz} onChange={(e) => setLocationUz(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("profile.locationRu")}</Label>
          <Input value={locationRu} onChange={(e) => setLocationRu(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("profile.location")}</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <Separator />

        <h4 className="font-semibold">{t("profile.socialLinks")}</h4>
        <div className="space-y-2">
          <Label>{t("profile.instagram")}</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">@</span>
            <Input className="rounded-l-none" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("profile.telegram")}</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">@</span>
            <Input className="rounded-l-none" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="username" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("profile.facebook")}</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">@</span>
            <Input className="rounded-l-none" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="username" />
          </div>
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? t("common.loading") : t("common.save")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------- SERVICES TAB ----------

const emptyService: Omit<Service, "id"> = {
  name: "",
  nameUz: "",
  nameRu: "",
  description: "",
  descriptionUz: "",
  descriptionRu: "",
  price: 0,
  duration: 30,
  icon: "✂️",
};

function ServicesTab({
  barber,
  updateBarberProfile,
}: {
  barber: Barber;
  updateBarberProfile: (barberId: string, data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Service, "id">>(emptyService);

  const openAdd = () => {
    setEditingIndex(null);
    setForm({ ...emptyService });
    setDialogOpen(true);
  };

  const openEdit = (index: number) => {
    const s = barber.services[index];
    setEditingIndex(index);
    setForm({
      name: s.name,
      nameUz: s.nameUz,
      nameRu: s.nameRu,
      description: s.description,
      descriptionUz: s.descriptionUz,
      descriptionRu: s.descriptionRu,
      price: s.price,
      duration: s.duration,
      icon: s.icon,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const services = [...barber.services];
    if (editingIndex !== null) {
      services[editingIndex] = { ...services[editingIndex], ...form };
    } else {
      services.push({ ...form, id: "svc-" + Date.now() });
    }
    await updateBarberProfile(barber.id, { services });
    setDialogOpen(false);
    toast.success(t("profile.profileSaved"));
  };

  const handleDelete = async (index: number) => {
    const services = barber.services.filter((_, i) => i !== index);
    await updateBarberProfile(barber.id, { services });
    toast.success(t("common.success"));
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {barber.services.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              {t("profile.noServices")}
            </p>
          ) : (
            <div className="space-y-3">
              {barber.services.map((service, i) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="text-2xl">{service.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{service.nameUz || service.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {service.duration} {t("booking.duration")} — {service.price.toLocaleString()} {t("common.currency")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(i)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button className="w-full mt-4" variant="outline" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t("profile.addService")}
          </Button>
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? t("profile.editService") : t("profile.addService")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("profile.serviceIcon")}</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="✂️" />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.serviceNameUz")}</Label>
              <Input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.serviceNameRu")}</Label>
              <Input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.serviceName")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.serviceDescUz")}</Label>
              <Textarea value={form.descriptionUz} onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.serviceDescRu")}</Label>
              <Textarea value={form.descriptionRu} onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.serviceDesc")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("profile.servicePrice")}</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.serviceDuration")}</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------- GALLERY TAB ----------

function GalleryTab({
  barber,
  updateBarberProfile,
}: {
  barber: Barber;
  updateBarberProfile: (barberId: string, data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>) => Promise<void>;
}) {
  const { t } = useTranslation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newUrls.push(URL.createObjectURL(files[i]));
    }
    const gallery = [...barber.gallery, ...newUrls];
    await updateBarberProfile(barber.id, { gallery });
    toast.success(t("common.success"));
    e.target.value = "";
  };

  const removeImage = async (index: number) => {
    const gallery = barber.gallery.filter((_, i) => i !== index);
    await updateBarberProfile(barber.id, { gallery });
    toast.success(t("common.success"));
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <label className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 py-8 transition-colors">
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{t("profile.addImage")}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {barber.gallery.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {t("profile.noGallery")}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {barber.gallery.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden">
                <img
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 rounded-full bg-destructive/80 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
