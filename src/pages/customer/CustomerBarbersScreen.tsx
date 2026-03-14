import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Star,
  Clock,
  Heart,
  Scissors,
  Calendar,
  MapPin,
  Loader2,
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
  const { barbers, barbersLoading, barbersHasMore, loadBarbers, loadMoreBarbers } = useBookingStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("rating");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "MALE" | "FEMALE">("ALL");
  const [initialLoad, setInitialLoad] = useState(true);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const observerRef = useRef<HTMLDivElement>(null);

  const getParams = useCallback(() => ({
    sort,
    filter,
    search: search.trim() || undefined,
    favoriteIds: filter === "favorites" ? Array.from(favoriteIds) : undefined,
    gender: genderFilter !== "ALL" ? genderFilter : undefined,
  }), [sort, filter, search, favoriteIds, genderFilter]);

  // Initial load + reload on filter/sort/search change
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const doLoad = () => {
      loadBarbers(getParams()).catch(() => {}).finally(() => setInitialLoad(false));
    };

    // Debounce search, instant for filter/sort
    if (search.trim()) {
      searchTimerRef.current = setTimeout(doLoad, 400);
    } else {
      doLoad();
    }

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [sort, filter, search, loadBarbers, getParams]);

  // Infinite scroll observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && barbersHasMore && !barbersLoading) {
          loadMoreBarbers(getParams());
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [barbersHasMore, barbersLoading, loadMoreBarbers, getParams]);

  if (initialLoad && barbersLoading) return <PageLoader />;

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
    <>
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
          <div className="w-px bg-border shrink-0 mx-1" />
          {(["ALL", "MALE", "FEMALE"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                genderFilter === g
                  ? "border-pink-500 bg-pink-500/10 text-pink-500"
                  : "border-border hover:border-pink-500/50",
              )}
            >
              {g === "ALL" ? `👥 ${t("profile.targetAll")}` : g === "MALE" ? `👨 ${t("auth.genderMale")}` : `👩 ${t("auth.genderFemale")}`}
            </button>
          ))}
        </div>
      </div>

      {/* Barber cards */}
      <div className="px-4 py-3">
        {barbers.length === 0 && !barbersLoading ? (
          <div className="text-center py-16">
            <Scissors className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "favorites" ? t("customerApp.noFavorites") : t("common.noResults")}
            </p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-3",
            barbers.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}>
            {barbers.map((barber) => {
              const isSingle = barbers.length === 1;
              return (
                <Card
                  key={barber.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all flex flex-col"
                  onClick={() => navigate(`/customer/barber/${barber.id}`)}
                >
                  <CardContent className="p-0 flex flex-col flex-1">
                    {/* Top photo strip */}
                    <div className={cn(
                      "relative bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden",
                      isSingle ? "h-28" : "h-24"
                    )}>
                      {barber.gallery?.[0] && (
                        <img
                          src={barber.gallery[0]}
                          alt=""
                          className="w-full h-full object-cover opacity-60"
                        />
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <Badge variant={barber.isAvailable ? "success" : "secondary"} className="text-[10px]">
                          {barber.isAvailable ? t("barbers.available") : t("barbers.unavailable")}
                        </Badge>
                        {barber.targetGender === "MALE" && (
                          <Badge variant="secondary" className="text-[9px] bg-blue-500/90 text-white border-0">
                            👨 {t("barberGender.maleOnly")}
                          </Badge>
                        )}
                        {barber.targetGender === "FEMALE" && (
                          <Badge variant="secondary" className="text-[9px] bg-pink-500/90 text-white border-0">
                            👩 {t("barberGender.femaleOnly")}
                          </Badge>
                        )}
                      </div>
                      {/* Heart */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(barber.id);
                        }}
                        className="absolute top-2 left-2 flex items-center justify-center h-7 w-7 rounded-full bg-background/70 backdrop-blur"
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-all",
                            favoriteIds.has(barber.id)
                              ? "fill-red-500 text-red-500"
                              : "text-foreground",
                          )}
                        />
                      </button>
                    </div>

                    <div className={cn(
                      "relative flex-1 flex flex-col",
                      isSingle ? "p-3 -mt-8" : "p-2.5 -mt-6"
                    )}>
                      {/* Avatar */}
                      <Avatar className={cn(
                        "border-3 border-background shadow-md",
                        isSingle ? "h-14 w-14" : "h-11 w-11"
                      )}>
                        <AvatarImage src={barber.avatar} alt={barber.name} />
                        <AvatarFallback className={isSingle ? "text-lg" : "text-sm"}>{barber.name[0]}</AvatarFallback>
                      </Avatar>

                      <div className={cn("space-y-1 flex-1 flex flex-col", isSingle ? "mt-2" : "mt-1.5")}>
                        {isSingle ? (
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-base">{barber.name}</h3>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{barber.rating}</span>
                              <span className="text-muted-foreground text-xs">({barber.reviewCount})</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-sm truncate">{barber.name}</h3>
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{barber.rating}</span>
                              <span className="text-muted-foreground">({barber.reviewCount})</span>
                            </div>
                          </>
                        )}

                        {isSingle && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{barber.experience} {t("barbers.experience")}</span>
                          </div>
                        )}

                        {isSingle && getBio(barber) && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{getBio(barber)}</p>
                        )}

                        {/* Actions */}
                        <div className={cn("pt-1.5 mt-auto", isSingle ? "flex gap-2" : "")}>
                          {barber.isAvailable ? (
                            <Button
                              className={cn("h-8 text-xs", isSingle ? "flex-1 h-9" : "w-full")}
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
                            <Button className={cn("h-8 text-xs", isSingle ? "flex-1 h-9" : "w-full")} size="sm" disabled>
                              {t("barbers.unavailable")}
                            </Button>
                          )}
                          {isSingle && (
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
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Infinite scroll trigger + loading */}
        <div ref={observerRef} className="py-4 flex justify-center">
          {barbersLoading && !initialLoad && (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
        </div>
      </div>

    </div>

    {/* Floating map button — outside animate-fade-in */}
    <button
      onClick={() => navigate("/customer/map")}
      className="fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-background border shadow-lg hover:bg-accent transition-colors"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label={t("customerApp.viewOnMap")}
    >
      <MapPin className="h-5 w-5 text-primary" />
    </button>
    </>
  );
}
