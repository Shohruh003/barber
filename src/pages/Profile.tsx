import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  CalendarDays,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { profileSchema } from "@/lib/validation";
import type { ProfileFormData } from "@/lib/validation";
import toast from "react-hot-toast";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const {
    bookings,
    bookingsLoading,
    loadUserBookings,
    cancelUserBooking,
  } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [editMode, setEditMode] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, phone: user?.phone },
  });

  useEffect(() => {
    if (user) loadUserBookings(user.id);
  }, [user, loadUserBookings]);

  if (!user) return <PageLoader />;

  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );
  const pastBookings = bookings.filter((b) => b.status === "completed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  const onProfileSave = async (data: ProfileFormData) => {
    await updateUser(data);
    setEditMode(false);
    toast.success(t("profile.profileUpdated"));
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelUserBooking(cancelId);
    setCancelId(null);
    toast.success(t("common.success"));
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success" as const;
      case "pending":
        return "warning" as const;
      case "completed":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const BookingCard = ({ booking }: { booking: typeof bookings[0] }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={booking.barberAvatar} />
            <AvatarFallback>{booking.barberName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium truncate">{booking.barberName}</h4>
              <Badge variant={statusVariant(booking.status)}>
                {t(`status.${booking.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {booking.services
                .map(
                  (s) =>
                    s.icon +
                    " " +
                    (lang === "uz"
                      ? s.nameUz
                      : lang === "ru"
                        ? s.nameRu
                        : s.name),
                )
                .join(", ")}
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {booking.date}
              </span>
              <span>{booking.time}</span>
              <span className="font-semibold text-primary ml-auto">
                {booking.totalPrice.toLocaleString()} {t("common.currency")}
              </span>
            </div>
            {(booking.status === "confirmed" || booking.status === "pending") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-destructive hover:text-destructive"
                onClick={() => setCancelId(booking.id)}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {t("profile.cancelBooking")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div>
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-3">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="mx-auto mt-2">
                {user.role}
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
                    <Label>{t("profile.phone")}</Label>
                    <Input {...register("phone")} />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
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
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("profile.email")}
                      </span>
                      <span>{user.email}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
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
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold">{t("profile.myBookings")}</h2>

          {bookingsLoading ? (
            <PageLoader />
          ) : (
            <Tabs defaultValue="upcoming">
              <TabsList>
                <TabsTrigger value="upcoming">
                  {t("profile.upcoming")} ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  {t("profile.past")} ({pastBookings.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  {t("profile.cancelled")} ({cancelledBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-4 space-y-3">
                {upcomingBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("profile.noBookings")}
                  </p>
                ) : (
                  upcomingBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-4 space-y-3">
                {pastBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("profile.noBookings")}
                  </p>
                ) : (
                  pastBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="mt-4 space-y-3">
                {cancelledBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("profile.noBookings")}
                  </p>
                ) : (
                  cancelledBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.cancelBooking")}</DialogTitle>
            <DialogDescription>{t("profile.cancelConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              {t("common.back")}
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
