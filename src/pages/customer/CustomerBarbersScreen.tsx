import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Star,
  MapPin,
  Clock,
  Heart,
  Scissors,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/LoadingSpinner";
import { useBookingStore } from "@/store/bookingStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { cn } from "@/lib/utils";
import type { Barber } from "@/types";

type SortKey = "rating" | "experience" | "price";
type FilterKey = "all" | "favorites" | "available";

export default function CustomerBarbersScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { barbers, barbersLoading, loadBarbers } = useBookingStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("rating");

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  if (barbersLoading) return <PageLoader />;

  const getLocation = (b: Barber) => {
    if (lang === "uz") return b.locationUz;
    if (lang === "ru") return b.locationRu;
    return b.location;
  };

  const getBio = (b: Barber) => {
    if (lang === "uz") return b.bioUz;
    if (lang === "ru") return b.bioRu;
    return b.bio;
  };

  const getServiceName = (s: { name: string; nameUz: string; nameRu: string }) => {
    if (lang === "uz") return s.nameUz;
    if (lang === "ru") return s.nameRu;
    return s.name;
  };

  const getMinPrice = (b: Barber) => {
    if (b.services.length === 0) return 0;
    return Math.min(...b.services.map((s) => s.price));
  };

  let filtered = barbers.filter((b) => {
    const q = search.toLowerCase();
    if (q && !b.name.toLowerCase().includes(q) && !getLocation(b).toLowerCase().includes(q)) return false;
    if (filter === "favorites" && !favoriteIds.has(b.id)) return false;
    if (filter === "available" && !b.isAvailable) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "experience") return Number(b.experience) - Number(a.experience);
    if (sort === "price") return getMinPrice(a) - getMinPrice(b);
    return 0;
  });

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("customerApp.allBarbers") },
    { key: "favorites", label: t("customerApp.favorites") },
    { key: "available", label: t("customerApp.filterAvailable") },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: "rating", label: t("barbers.rating") },
    { key: "experience", label: t("barbers.experience") },
    { key: "price", label: t("booking.price") },
  ];

  return (
    <div className="animate-fade-in">
      {/* Sticky search + filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("customerApp.searchBarbers")}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50",
              )}
            >
              {f.key === "favorites" && <Heart className="h-3 w-3 inline mr-1" />}
              {f.label}
            </button>
          ))}
          <div className="w-px bg-border shrink-0 mx-1" />
          {sorts.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                sort === s.key
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : "border-border hover:border-blue-500/50",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barber cards */}
      <div className="px-4 py-3 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Scissors className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "favorites" ? t("customerApp.noFavorites") : t("common.noResults")}
            </p>
          </div>
        ) : (
          filtered.map((barber) => (
            <Card
              key={barber.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate(`/customer/barber/${barber.id}`)}
            >
              <CardContent className="p-0">
                {/* Top photo strip */}
                <div className="relative h-28 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                  {barber.gallery?.[0] && (
                    <img
                      src={barber.gallery[0]}
                      alt=""
                      className="w-full h-full object-cover opacity-60"
                    />
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant={barber.isAvailable ? "success" : "secondary"} className="text-[10px]">
                      {barber.isAvailable ? t("barbers.available") : t("barbers.unavailable")}
                    </Badge>
                  </div>
                  {/* Heart */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(barber.id);
                    }}
                    className="absolute top-2.5 left-2.5 flex items-center justify-center h-8 w-8 rounded-full bg-background/70 backdrop-blur"
                  >
                    <Heart
                      className={cn(
                        "h-4.5 w-4.5 transition-all",
                        favoriteIds.has(barber.id)
                          ? "fill-red-500 text-red-500"
                          : "text-foreground",
                      )}
                    />
                  </button>
                </div>

                <div className="p-3 -mt-8 relative">
                  {/* Avatar */}
                  <Avatar className="h-14 w-14 border-3 border-background shadow-md">
                    <AvatarImage src={barber.avatar} alt={barber.name} />
                    <AvatarFallback className="text-lg">{barber.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-base">{barber.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{barber.rating}</span>
                        <span className="text-muted-foreground text-xs">({barber.reviewCount})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{getLocation(barber)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{barber.experience} {t("barbers.experience")}</span>
                    </div>

                    {getBio(barber) && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{getBio(barber)}</p>
                    )}

                    {/* Services */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {barber.services.slice(0, 3).map((s) => (
                        <Badge key={s.id} variant="outline" className="text-[10px] px-1.5 py-0">
                          {s.icon} {getServiceName(s)}
                        </Badge>
                      ))}
                      {barber.services.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{barber.services.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1.5">
                      {barber.isAvailable ? (
                        <Button
                          className="flex-1 h-9 text-xs"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/booking/${barber.id}`);
                          }}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {t("barbers.bookAppointment")}
                        </Button>
                      ) : (
                        <Button className="flex-1 h-9 text-xs" size="sm" disabled>
                          {t("barbers.unavailable")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer/barber/${barber.id}`);
                        }}
                      >
                        {t("barbers.about")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
