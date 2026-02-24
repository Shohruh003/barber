import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, MapPin, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Barber } from "@/types";

interface BarberCardProps {
  barber: Barber;
  onToggleAvailability?: (barberId: string) => void;
}

export function BarberCard({ barber, onToggleAvailability }: BarberCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "uz" | "ru";

  const getLocation = () => {
    if (lang === "uz") return barber.locationUz;
    if (lang === "ru") return barber.locationRu;
    return barber.location;
  };

  const getBio = () => {
    if (lang === "uz") return barber.bioUz;
    if (lang === "ru") return barber.bioRu;
    return barber.bio;
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 group">
      <CardContent className="p-0">
        {/* Top photo strip */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {barber.gallery[0] && (
            <img
              src={barber.gallery[0]}
              alt=""
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute top-3 right-3">
            <Badge variant={barber.isAvailable ? "success" : "secondary"}>
              {barber.isAvailable ? t("barbers.available") : t("barbers.unavailable")}
            </Badge>
          </div>
        </div>

        <div className="p-4 -mt-10 relative">
          {/* Avatar */}
          <Avatar className="h-16 w-16 border-4 border-background shadow-md">
            <AvatarImage src={barber.avatar} alt={barber.name} />
            <AvatarFallback className="text-lg">{barber.name[0]}</AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="mt-3 space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg">{barber.name}</h3>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{barber.rating}</span>
                <span className="text-muted-foreground">
                  ({barber.reviewCount})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{getLocation()}</span>
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {barber.experience} {t("barbers.experience")}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {getBio()}
            </p>

            {/* Services tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {barber.services.slice(0, 3).map((service) => (
                <Badge key={service.id} variant="outline" className="text-xs">
                  {service.icon}{" "}
                  {lang === "uz"
                    ? service.nameUz
                    : lang === "ru"
                      ? service.nameRu
                      : service.name}
                </Badge>
              ))}
              {barber.services.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{barber.services.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            {barber.isAvailable ? (
              <Button className="flex-1" size="sm" asChild>
                <Link to={`/booking/${barber.id}`}>
                  {t("barbers.bookAppointment")}
                </Link>
              </Button>
            ) : (
              <Button className="flex-1" size="sm" disabled>
                {t("barbers.unavailable")}
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/barbers/${barber.id}`}>{t("barbers.about")}</Link>
            </Button>
          </div>

          {onToggleAvailability && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => onToggleAvailability(barber.id)}
            >
              {barber.isAvailable ? (
                <ToggleRight className="h-4 w-4 mr-1.5 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 mr-1.5 text-muted-foreground" />
              )}
              {t("admin.toggleAvailability")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
