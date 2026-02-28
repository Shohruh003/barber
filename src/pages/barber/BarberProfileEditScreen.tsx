import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  ImagePlus,
  Save,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBarberScheduleStore } from "@/store/barberScheduleStore";
import type { Service, Barber, WorkingHours, DaySchedule } from "@/types";
import toast from "react-hot-toast";

export default function BarberProfileEditScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { barber, barberLoading, loadBarber, updateBarberProfile } =
    useBarberScheduleStore();

  useEffect(() => {
    if (user) loadBarber(user.id);
  }, [user, loadBarber]);

  if (barberLoading || !barber) return <PageLoader />;

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/barber/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="font-bold text-lg">{t("profile.barberProfile")}</h2>
      </div>

      <Tabs defaultValue="bio" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="bio" className="flex-1 text-xs">
            {t("profile.bioInfo")}
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex-1 text-xs">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {t("profile.workingHours")}
          </TabsTrigger>
          <TabsTrigger value="services" className="flex-1 text-xs">
            {t("profile.services")}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex-1 text-xs">
            {t("profile.gallery")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bio" className="mt-4">
          <BioInfoTab barber={barber} updateBarberProfile={updateBarberProfile} />
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <WorkingHoursTab barber={barber} updateBarberProfile={updateBarberProfile} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServicesTab barber={barber} updateBarberProfile={updateBarberProfile} />
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          <GalleryTab barber={barber} updateBarberProfile={updateBarberProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- WORKING HOURS TAB ----------

const dayOrder: (keyof WorkingHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function WorkingHoursTab({
  barber,
  updateBarberProfile,
}: {
  barber: Barber;
  updateBarberProfile: (
    barberId: string,
    data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>,
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [hours, setHours] = useState<WorkingHours>({ ...barber.workingHours });
  const [saving, setSaving] = useState(false);

  const updateDay = (day: keyof WorkingHours, field: keyof DaySchedule, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateBarberProfile(barber.id, { workingHours: hours });
    setSaving(false);
    toast.success(t("profile.profileSaved"));
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {dayOrder.map((day) => {
          const schedule = hours[day];
          return (
            <div key={day} className="flex items-center gap-3 rounded-xl border p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{t(`days.${day}`)}</span>
                  <Switch
                    checked={schedule.isOpen}
                    onCheckedChange={(checked) => updateDay(day, "isOpen", checked)}
                  />
                </div>
                {schedule.isOpen ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">{t("profile.openTime")}</Label>
                      <Input
                        type="time"
                        value={schedule.open}
                        onChange={(e) => updateDay(day, "open", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <span className="text-muted-foreground mt-4">—</span>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">{t("profile.closeTime")}</Label>
                      <Input
                        type="time"
                        value={schedule.close}
                        onChange={(e) => updateDay(day, "close", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("profile.dayClosed")}</p>
                )}
              </div>
            </div>
          );
        })}

        <Button className="w-full h-11" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t("common.loading") : t("common.save")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------- BIO & INFO TAB ----------

function BioInfoTab({
  barber,
  updateBarberProfile,
}: {
  barber: Barber;
  updateBarberProfile: (
    barberId: string,
    data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>,
  ) => Promise<void>;
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
      experience,
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
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile.experience")}</Label>
          <Input
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="5, 8+, 10+"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile.bioUz")}</Label>
          <Textarea value={bioUz} onChange={(e) => setBioUz(e.target.value)} rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile.bioRu")}</Label>
          <Textarea value={bioRu} onChange={(e) => setBioRu(e.target.value)} rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile.bio")}</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile.locationUz")}</Label>
          <Input value={locationUz} onChange={(e) => setLocationUz(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile.locationRu")}</Label>
          <Input value={locationRu} onChange={(e) => setLocationRu(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile.location")}</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11" />
        </div>

        <Separator />

        <h4 className="font-semibold text-sm">{t("profile.socialLinks")}</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("profile.instagram")}</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                @
              </span>
              <Input
                className="rounded-l-none h-11"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="username"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("profile.telegram")}</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                @
              </span>
              <Input
                className="rounded-l-none h-11"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="username"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("profile.facebook")}</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                @
              </span>
              <Input
                className="rounded-l-none h-11"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="username"
              />
            </div>
          </div>
        </div>

        <Button className="w-full h-11" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
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
  icon: "\u2702\uFE0F",
};

function ServicesTab({
  barber,
  updateBarberProfile,
}: {
  barber: Barber;
  updateBarberProfile: (
    barberId: string,
    data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>,
  ) => Promise<void>;
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
        <CardContent className="pt-4">
          {barber.services.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              {t("profile.noServices")}
            </p>
          ) : (
            <div className="space-y-2">
              {barber.services.map((service, i) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="text-2xl">{service.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {service.nameUz || service.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {service.duration} {t("booking.duration")} —{" "}
                      {service.price.toLocaleString()} {t("common.currency")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(i)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDelete(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button className="w-full mt-4 h-11" variant="outline" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t("profile.addService")}
          </Button>
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? t("profile.editService") : t("profile.addService")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.serviceIcon")}</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="\u2702\uFE0F"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.serviceNameUz")}</Label>
              <Input
                value={form.nameUz}
                onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.serviceNameRu")}</Label>
              <Input
                value={form.nameRu}
                onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.serviceName")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.serviceDescUz")}</Label>
              <Textarea
                value={form.descriptionUz}
                onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.serviceDescRu")}</Label>
              <Textarea
                value={form.descriptionRu}
                onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("profile.serviceDesc")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("profile.servicePrice")}</Label>
                <Input
                  inputMode="numeric"
                  value={form.price || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, price: val ? Number(val) : 0 });
                  }}
                  placeholder="50000"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("profile.serviceDuration")}</Label>
                <Input
                  inputMode="numeric"
                  value={form.duration || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, duration: val ? Number(val) : 0 });
                  }}
                  placeholder="30"
                  className="h-11"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
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
  updateBarberProfile: (
    barberId: string,
    data: Partial<Omit<Barber, "id" | "rating" | "reviewCount">>,
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const { uploadGallery } = useBarberScheduleStore();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await uploadGallery(barber.id, Array.from(files));
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = async (index: number) => {
    const gallery = barber.gallery.filter((_, i) => i !== index);
    await updateBarberProfile(barber.id, { gallery });
    toast.success(t("common.success"));
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <label className={`flex items-center justify-center gap-2 w-full cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 py-8 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {uploading ? t("common.loading") : t("profile.addImage")}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>

        {barber.gallery.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {t("profile.noGallery")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {barber.gallery.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
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
