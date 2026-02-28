import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  Calendar,
  Instagram,
  Send,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/LoadingSpinner";
import { useBookingStore } from "@/store/bookingStore";
import { fetchBarberReviews } from "@/lib/apiClient";
import type { Review, WorkingHours } from "@/types";

export default function BarberDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { selectedBarber, barbersLoading, loadBarberById } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (id) {
      loadBarberById(id);
      fetchBarberReviews(id).then(setReviews).catch(() => {});
    }
  }, [id, loadBarberById]);

  if (barbersLoading || !selectedBarber) return <PageLoader />;

  const barber = selectedBarber;

  const getBio = () => {
    if (lang === "uz") return barber.bioUz;
    if (lang === "ru") return barber.bioRu;
    return barber.bio;
  };

  const getLocation = () => {
    if (lang === "uz") return barber.locationUz;
    if (lang === "ru") return barber.locationRu;
    return barber.location;
  };

  const dayOrder: (keyof WorkingHours)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="container py-8 animate-fade-in">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/barbers">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                  <AvatarImage src={barber.avatar} alt={barber.name} />
                  <AvatarFallback className="text-2xl">
                    {barber.name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h1 className="text-2xl font-bold">{barber.name}</h1>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {getLocation()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {barber.experience} {t("barbers.experience")}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={barber.isAvailable ? "success" : "secondary"}
                    >
                      {barber.isAvailable
                        ? t("barbers.available")
                        : t("barbers.unavailable")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(barber.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{barber.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({barber.reviewCount} {t("barbers.reviews")})
                    </span>
                  </div>

                  <p className="text-muted-foreground">{getBio()}</p>

                  {barber.isAvailable ? (
                    <Button size="lg" asChild>
                      <Link to={`/booking/${barber.id}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {t("barbers.bookAppointment")}
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" disabled>
                      {t("barbers.unavailable")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="services">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="services">
                {t("barbers.services")}
              </TabsTrigger>
              <TabsTrigger value="gallery">{t("barbers.gallery")}</TabsTrigger>
              <TabsTrigger value="reviews">
                {t("barbers.reviews")} ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-4">
              <div className="grid gap-3">
                {barber.services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="text-2xl">{service.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {lang === "uz"
                            ? service.nameUz
                            : lang === "ru"
                              ? service.nameRu
                              : service.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {service.duration} {t("booking.duration")}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
                        {service.price.toLocaleString()} {t("common.currency")}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {barber.gallery.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`${barber.name} work ${i + 1}`}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("common.noResults")}
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback>
                              {review.userName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                {review.userName}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toISOString().slice(0, 10)} | {new Date(review.createdAt).toTimeString().slice(0, 5)}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("barbers.workingHours")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayOrder.map((day) => {
                const schedule = barber.workingHours[day];
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize">
                      {t(`days.${day}`)}
                    </span>
                    {schedule.isOpen ? (
                      <span>
                        {schedule.open} - {schedule.close}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("booking.closed")}
                      </span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("footer.contact")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={`tel:${barber.phone}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                {barber.phone}
              </a>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {getLocation()}
              </div>

              {/* Social Links */}
              {barber.socialLinks && (barber.socialLinks.instagram || barber.socialLinks.telegram || barber.socialLinks.facebook) && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    {barber.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${barber.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-accent hover:bg-primary/10 transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {barber.socialLinks.telegram && (
                      <a
                        href={`https://t.me/${barber.socialLinks.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-accent hover:bg-primary/10 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </a>
                    )}
                    {barber.socialLinks.facebook && (
                      <a
                        href={`https://facebook.com/${barber.socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-accent hover:bg-primary/10 transition-colors"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
