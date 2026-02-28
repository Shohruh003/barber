import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Star,
  Phone,
  Clock,
  Navigation,
  MapPin,
  Loader2,
  X,
  Search,
  User,
} from "lucide-react";
import { Drawer } from "vaul";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useBookingStore } from "@/store/bookingStore";
import { useThemeStore } from "@/store/themeStore";
import { useYandexMap } from "@/lib/useYandexMap";
import type { Barber, WorkingHours } from "@/types";

export default function CustomerMapScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { barbers, loadBarbers } = useBookingStore();
  const { isLoaded, error } = useYandexMap();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const lang = i18n.language as "en" | "uz" | "ru";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const placemarksRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation([41.2995, 69.2401]),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleBarberSelect = useCallback((barber: Barber) => {
    setSelectedBarber(barber);
    setDrawerOpen(true);
  }, []);

  // Initialize map (Yandex Maps 2.1 API)
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return;

    const ymaps = (window as any).ymaps;

    const focusBarberId = searchParams.get("barber");
    const focusBarber = focusBarberId ? barbers.find((b) => b.id === focusBarberId) : null;

    let center: [number, number];
    if (focusBarber?.latitude && focusBarber?.longitude) {
      center = [focusBarber.latitude, focusBarber.longitude];
    } else if (userLocation) {
      center = [userLocation[0], userLocation[1]];
    } else {
      center = [41.2995, 69.2401];
    }

    const map = new ymaps.Map(mapContainerRef.current, {
      center,
      zoom: focusBarber ? 15 : 12,
      controls: ["zoomControl"],
    });

    const barbersWithLocation = barbers.filter((b) => b.latitude && b.longitude);
    barbersWithLocation.forEach((barber) => {
      const placemark = new ymaps.Placemark(
        [barber.latitude!, barber.longitude!],
        {},
        {
          iconLayout: "default#imageWithContent",
          iconImageHref: barber.avatar || "",
          iconImageSize: [44, 44],
          iconImageOffset: [-22, -22],
          iconContentOffset: [0, 0],
          iconContentLayout: ymaps.templateLayoutFactory.createClass(
            barber.avatar
              ? '<div class="barber-marker"><img src="' + barber.avatar + '" /></div>'
              : '<div class="barber-marker"><div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:bold;font-size:16px;">' + barber.name[0] + '</div></div>',
          ),
          hasBalloon: false,
          hasHint: false,
        },
      );
      placemark.events.add("click", (e: any) => {
        e.preventDefault();
        handleBarberSelect(barber);
      });
      placemarksRef.current.set(barber.id, placemark);
      map.geoObjects.add(placemark);
    });

    if (userLocation) {
      const userPlacemark = new ymaps.Placemark(
        userLocation,
        {},
        {
          iconLayout: "default#imageWithContent",
          iconImageHref: "",
          iconImageSize: [22, 22],
          iconImageOffset: [-11, -11],
          iconContentLayout: ymaps.templateLayoutFactory.createClass(
            '<div class="user-marker"></div>',
          ),
        },
      );
      map.geoObjects.add(userPlacemark);
    }

    mapRef.current = map;

    if (focusBarber) {
      handleBarberSelect(focusBarber);
    }

    return () => {
      map.destroy();
      mapRef.current = null;
    };
  }, [isLoaded, barbers, userLocation, searchParams, handleBarberSelect]);

  const centerOnUser = () => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setCenter(userLocation, 14, { duration: 500 });
  };

  const openRoute = (barber: Barber) => {
    if (!barber.latitude || !barber.longitude) return;
    const url = userLocation
      ? `https://yandex.uz/maps/?rtext=${userLocation[0]},${userLocation[1]}~${barber.latitude},${barber.longitude}&rtt=auto`
      : `https://yandex.uz/maps/?pt=${barber.longitude},${barber.latitude}&z=16`;
    window.open(url, "_blank");
  };

  const searchResults = searchQuery.trim()
    ? barbers.filter((b) => {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.location?.toLowerCase().includes(q) ||
          b.locationUz?.toLowerCase().includes(q) ||
          b.locationRu?.toLowerCase().includes(q)
        );
      })
    : [];

  const focusOnBarber = (barber: Barber) => {
    if (!mapRef.current || !barber.latitude || !barber.longitude) return;
    mapRef.current.setCenter([barber.latitude, barber.longitude], 15, { duration: 400 });
    handleBarberSelect(barber);
    setSearchQuery("");
    setSearchFocused(false);
  };

  const getTodayHours = (barber: Barber) => {
    if (!barber.workingHours) return null;
    const days: (keyof WorkingHours)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = days[new Date().getDay()];
    const schedule = barber.workingHours[today];
    if (!schedule?.isOpen) return null;
    return `${schedule.open} - ${schedule.close}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("customerApp.loadingMap")}</p>
          <p className="text-xs text-destructive mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("customerApp.loadingMap")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={isDark ? { filter: "invert(1) hue-rotate(180deg)" } : undefined}
      />

      {/* My location FAB */}
      <button
        onClick={centerOnUser}
        className="absolute bottom-24 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-background border shadow-lg"
      >
        <Navigation className="h-5 w-5 text-primary" />
      </button>

      {/* Search bar */}
      <div className="absolute top-3 left-3 right-3 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder={t("customerApp.searchBarbers")}
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-background border shadow-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchFocused && searchQuery.trim() && (
          <div className="mt-1.5 bg-background border rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("common.noResults")}</p>
            ) : (
              searchResults.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => focusOnBarber(barber)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={barber.avatar} />
                    <AvatarFallback>{barber.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{barber.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{barber.rating}</span>
                      <span className="mx-1">·</span>
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{barber.location}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Drawer */}
      <Drawer.Root
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSelectedBarber(null);
        }}
        modal={false}
      >
        <Drawer.Portal>
          <Drawer.Content aria-describedby={undefined} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background border-t shadow-2xl outline-none">
            <VisuallyHidden.Root>
              <Drawer.Title>Barber info</Drawer.Title>
            </VisuallyHidden.Root>
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />

            {selectedBarber && (
              <div className="px-4 pt-3 pb-6 space-y-3">
                {/* Barber info + close button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={selectedBarber.avatar} />
                    <AvatarFallback className="text-lg">{selectedBarber.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{selectedBarber.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedBarber.rating}</span>
                      <span className="text-muted-foreground text-xs">({selectedBarber.reviewCount})</span>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <a href={`tel:${selectedBarber.phone}`} className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-green-500" />
                  <span>{selectedBarber.phone}</span>
                </a>

                {/* Today hours */}
                {getTodayHours(selectedBarber) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{t("customerApp.workingToday")}: {getTodayHours(selectedBarber)}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => openRoute(selectedBarber)}>
                    <Navigation className="h-4 w-4 mr-1.5" />
                    {t("customerApp.route")}
                  </Button>
                  <Button className="flex-1 h-11" onClick={() => navigate(`/customer/barber/${selectedBarber.id}`)}>
                    <User className="h-4 w-4 mr-1.5" />
                    {t("customerApp.viewProfile")}
                  </Button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
