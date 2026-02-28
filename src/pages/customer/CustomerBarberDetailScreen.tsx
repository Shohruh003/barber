import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  Calendar,
  Heart,
  Instagram,
  Send,
  Facebook,
  Navigation,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/LoadingSpinner";
import { useBookingStore } from "@/store/bookingStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { fetchBarberReviews } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type { Review, WorkingHours } from "@/types";

export default function CustomerBarberDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { selectedBarber, barbersLoading, loadBarberById } = useBookingStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (id) {
      loadBarberById(id);
      fetchBarberReviews(id).then(setReviews).catch(() => {});
    }
  }, [id, loadBarberById]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  if (barbersLoading || !selectedBarber) return <PageLoader />;

  const barber = selectedBarber;
  const isFav = favoriteIds.has(barber.id);

  const getBio = () => (lang === "uz" ? barber.bioUz : lang === "ru" ? barber.bioRu : barber.bio);
  const getLocation = () => (lang === "uz" ? barber.locationUz : lang === "ru" ? barber.locationRu : barber.location);
  const getServiceName = (s: { name: string; nameUz: string; nameRu: string }) =>
    lang === "uz" ? s.nameUz : lang === "ru" ? s.nameRu : s.name;

  const dayOrder: (keyof WorkingHours)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const openRoute = () => {
    if (!barber.latitude || !barber.longitude) return;
    const url = userLocation
      ? `https://yandex.uz/maps/?rtext=${userLocation[0]},${userLocation[1]}~${barber.latitude},${barber.longitude}&rtt=auto`
      : `https://yandex.uz/maps/?pt=${barber.longitude},${barber.latitude}&z=16`;
    window.open(url, "_blank");
  };

  return (
    <div className="animate-fade-in pb-4">
      {/* Header with back + favorite */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-2 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
          {t("common.back")}
        </button>
        <button onClick={() => toggleFavorite(barber.id)} className="flex items-center justify-center h-9 w-9">
          <Heart className={cn("h-6 w-6 transition-all", isFav ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </button>
      </div>

      {/* Profile header */}
      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage src={barber.avatar} alt={barber.name} />
            <AvatarFallback className="text-2xl">{barber.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{barber.name}</h1>
              <Badge variant={barber.isAvailable ? "success" : "secondary"} className="shrink-0 text-[10px]">
                {barber.isAvailable ? t("barbers.available") : t("barbers.unavailable")}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{getLocation()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {barber.experience} {t("barbers.experience")}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${star <= Math.round(barber.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{barber.rating}</span>
              <span className="text-xs text-muted-foreground">({barber.reviewCount})</span>
            </div>
          </div>
        </div>

        {getBio() && <p className="text-sm text-muted-foreground">{getBio()}</p>}

        {barber.isAvailable ? (
          <Button className="w-full h-11" onClick={() => navigate(`/customer/booking/${barber.id}`)}>
            <Calendar className="h-4 w-4 mr-2" />
            {t("barbers.bookAppointment")}
          </Button>
        ) : (
          <Button className="w-full h-11" disabled>{t("barbers.unavailable")}</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <Tabs defaultValue="services">
          <TabsList className="w-full">
            <TabsTrigger value="services" className="flex-1 text-xs">{t("barbers.services")}</TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1 text-xs">{t("barbers.gallery")}</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 text-xs">{t("barbers.reviews")} ({reviews.length})</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 text-xs">{t("footer.contact")}</TabsTrigger>
          </TabsList>

          {/* Services */}
          <TabsContent value="services" className="mt-3 space-y-2">
            {barber.services.map((service) => (
              <Card key={service.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-2xl">{service.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{getServiceName(service)}</h4>
                    <p className="text-xs text-muted-foreground">{service.duration} {t("booking.duration")}</p>
                  </div>
                  <span className="font-semibold text-sm text-primary">
                    {service.price.toLocaleString()} {t("common.currency")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery" className="mt-3">
            {barber.gallery && barber.gallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {barber.gallery.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={img}
                      alt={`${barber.name} ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
              </div>
            )}
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="mt-3 space-y-2">
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">{t("common.noResults")}</p>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback className="text-xs">{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{review.userName}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(review.createdAt).toISOString().slice(0, 10)}
                          </span>
                        </div>
                        <div className="flex items-center mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-3 w-3 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Contact / Aloqa */}
          <TabsContent value="contact" className="mt-3 space-y-3">
            {/* Phone */}
            <Card>
              <CardContent className="p-3">
                <a href={`tel:${barber.phone}`} className="flex items-center gap-3 text-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10">
                    <Phone className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="font-medium">{barber.phone}</span>
                </a>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {t("barbers.workingHours")}
                </p>
                {dayOrder.map((day) => {
                  const schedule = barber.workingHours?.[day];
                  return (
                    <div key={day} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{t(`days.${day}`)}</span>
                      {schedule?.isOpen ? (
                        <span>{schedule.open} - {schedule.close}</span>
                      ) : (
                        <span className="text-muted-foreground">{t("booking.closed")}</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Location / Geo */}
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{barber.geoAddress || getLocation()}</p>
                    {barber.latitude && barber.longitude && (
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {barber.latitude.toFixed(6)}, {barber.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                {barber.latitude && barber.longitude && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 text-xs" onClick={openRoute}>
                      <Navigation className="h-4 w-4 mr-1.5" />
                      {t("customerApp.route")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 text-xs"
                      onClick={() => navigate(`/customer/map?barber=${barber.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      {t("customerApp.viewOnMap")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {barber.socialLinks && (barber.socialLinks.instagram || barber.socialLinks.telegram || barber.socialLinks.facebook) && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {barber.socialLinks.instagram && (
                      <a href={`https://instagram.com/${barber.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-accent hover:bg-primary/10 transition-colors">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {barber.socialLinks.telegram && (
                      <a href={`https://t.me/${barber.socialLinks.telegram}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-accent hover:bg-primary/10 transition-colors">
                        <Send className="h-5 w-5" />
                      </a>
                    )}
                    {barber.socialLinks.facebook && (
                      <a href={`https://facebook.com/${barber.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-accent hover:bg-primary/10 transition-colors">
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
