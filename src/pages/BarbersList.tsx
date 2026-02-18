import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { BarberCard } from "@/components/BarberCard";
import { SearchBar } from "@/components/SearchBar";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBookingStore } from "@/store/bookingStore";

export default function BarbersList() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { barbers, barbersLoading, loadBarbers, searchBarbersList } =
    useBookingStore();
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "experience" | "price">(
    "rating",
  );

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      searchBarbersList(q);
    } else {
      loadBarbers();
    }
  }, [searchParams, loadBarbers, searchBarbersList]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchBarbersList(query);
    } else {
      loadBarbers();
    }
  };

  let filtered = [...barbers];
  if (filterAvailable) {
    filtered = filtered.filter((b) => b.isAvailable);
  }

  filtered.sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "experience") return b.experience - a.experience;
    return (
      Math.min(...a.services.map((s) => s.price)) -
      Math.min(...b.services.map((s) => s.price))
    );
  });

  return (
    <div className="container py-8 animate-fade-in">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t("barbers.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length}{" "}
            {t("barbers.title").toLowerCase()}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder={t("home.searchPlaceholder")}
          />

          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={filterAvailable ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAvailable(!filterAvailable)}
            >
              {t("barbers.available")}
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            {(["rating", "experience", "price"] as const).map((sort) => (
              <Badge
                key={sort}
                variant={sortBy === sort ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSortBy(sort)}
              >
                {sort === "rating"
                  ? t("barbers.rating")
                  : sort === "experience"
                    ? t("barbers.experience")
                    : t("booking.price")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        {barbersLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {t("barbers.noBarbers")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
