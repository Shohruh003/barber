import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Scissors,
  Calendar,
  ArrowRight,
  Search,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarberCard } from "@/components/BarberCard";
import { SearchBar } from "@/components/SearchBar";
import { PageLoader } from "@/components/LoadingSpinner";
import { useBookingStore } from "@/store/bookingStore";

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { barbers, barbersLoading, loadBarbers } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  // Derive unique popular services from all barbers
  const popularServices = useMemo(() => {
    const seen = new Set<string>();
    return barbers.flatMap((b) => b.services).filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    }).slice(0, 6);
  }, [barbers]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/barbers?search=${encodeURIComponent(query)}`);
    }
  };

  if (barbersLoading && barbers.length === 0) return <PageLoader />;

  const featuredBarbers = barbers.filter((b) => b.isAvailable).slice(0, 3);

  const steps = [
    {
      icon: <Search className="h-8 w-8" />,
      title: t("home.step1Title"),
      desc: t("home.step1Desc"),
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: t("home.step2Title"),
      desc: t("home.step2Desc"),
    },
    {
      icon: <CheckCircle2 className="h-8 w-8" />,
      title: t("home.step3Title"),
      desc: t("home.step3Desc"),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 md:py-24">
        <div className="container relative z-10">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <Badge variant="secondary" className="mb-2">
              <Scissors className="h-3 w-3 mr-1" />
              BarberBook
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t("home.hero")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("home.heroSub")}
            </p>
            <SearchBar
              onSearch={handleSearch}
              className="mx-auto max-w-lg"
            />
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button size="lg" asChild>
                <Link to="/barbers">
                  {t("home.seeAll")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/5" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5" />
      </section>

      {/* Popular Services */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t("home.popularServices")}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularServices.map((service) => (
              <Card
                key={service.id}
                className="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-4 text-center space-y-2">
                  <span className="text-3xl block">{service.icon}</span>
                  <h3 className="font-medium text-sm">
                    {lang === "uz"
                      ? service.nameUz
                      : lang === "ru"
                        ? service.nameRu
                        : service.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{service.duration} {t("booking.duration")}</span>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    {service.price.toLocaleString()} {t("common.currency")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Barbers */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t("home.featuredBarbers")}</h2>
            <Button variant="ghost" asChild>
              <Link to="/barbers">
                {t("common.viewAll")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBarbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-10">
            {t("home.howItWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "50+", label: lang === "uz" ? "Sartaroshlar" : lang === "ru" ? "Барберов" : "Barbers" },
              { value: "1000+", label: lang === "uz" ? "Mijozlar" : lang === "ru" ? "Клиентов" : "Clients" },
              { value: "4.8", label: lang === "uz" ? "O'rtacha reyting" : lang === "ru" ? "Средний рейтинг" : "Avg Rating" },
              { value: "5000+", label: lang === "uz" ? "Buyurtmalar" : lang === "ru" ? "Записей" : "Bookings" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-sm opacity-80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
