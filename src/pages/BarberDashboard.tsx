import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";

function toISODate(date: Date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date: Date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

export default function BarberDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { bookings, bookingsLoading, loadBarberBookings } = useBookingStore();
  const lang = i18n.language as "en" | "uz" | "ru";

  const now = new Date();
  const [dateFrom, setDateFrom] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
  const [dateTo, setDateTo] = useState<Date>(now);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadBarberBookings(user.id);
    }
  }, [user, loadBarberBookings]);

  // --- Filter bookings by date range ---
  const filteredBookings = useMemo(() => {
    const from = toISODate(dateFrom);
    const to = toISODate(dateTo);
    return bookings.filter((b) => b.date >= from && b.date <= to);
  }, [bookings, dateFrom, dateTo]);

  // --- Stats ---
  const totalRevenue = filteredBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const confirmedCount = filteredBookings.filter((b) => b.status === "confirmed").length;
  const completedCount = filteredBookings.filter((b) => b.status === "completed").length;
  const cancelledCount = filteredBookings.filter((b) => b.status === "cancelled").length;

  const stats = [
    {
      title: t("admin.totalBookings"),
      value: filteredBookings.length,
      icon: <CalendarDays className="h-5 w-5" />,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: t("admin.totalRevenue"),
      value: totalRevenue.toLocaleString() + " " + t("common.currency"),
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: t("admin.confirmed"),
      value: confirmedCount,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: t("admin.completed"),
      value: completedCount,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-teal-600",
      bg: "bg-teal-100 dark:bg-teal-900/30",
    },
    {
      title: t("admin.cancelled"),
      value: cancelledCount,
      icon: <XCircle className="h-5 w-5" />,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
  ];

  // --- Service stats ---
  const serviceStatsData = useMemo(() => {
    const serviceMap = new Map<string, { count: number; revenue: number; name: string }>();
    const activeBookings = filteredBookings.filter((b) => b.status !== "cancelled");

    for (const booking of activeBookings) {
      for (const service of booking.services) {
        const name =
          lang === "uz" ? service.nameUz : lang === "ru" ? service.nameRu : service.name;
        const existing = serviceMap.get(service.id);
        if (existing) {
          existing.count += 1;
          existing.revenue += service.price;
        } else {
          serviceMap.set(service.id, { count: 1, revenue: service.price, name });
        }
      }
    }

    return Array.from(serviceMap.values()).sort((a, b) => b.count - a.count);
  }, [filteredBookings, lang]);

  const serviceCountConfig: ChartConfig = {
    count: { label: t("admin.orderCount"), color: "hsl(var(--primary))" },
  };

  const serviceRevenueConfig: ChartConfig = {
    revenue: { label: t("admin.revenue"), color: "hsl(217, 91%, 60%)" },
  };

  // --- Booking trends ---
  const trendData = useMemo(() => {
    const map = new Map<string, { date: string; total: number; completed: number; cancelled: number }>();

    for (const b of filteredBookings) {
      const key = b.date;
      const existing = map.get(key) || { date: key, total: 0, completed: 0, cancelled: 0 };
      existing.total += 1;
      if (b.status === "completed") existing.completed += 1;
      if (b.status === "cancelled") existing.cancelled += 1;
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredBookings]);

  const trendConfig: ChartConfig = {
    total: { label: t("admin.totalBookings"), color: "hsl(var(--primary))" },
    completed: { label: t("admin.completed"), color: "hsl(142, 76%, 36%)" },
    cancelled: { label: t("admin.cancelled"), color: "hsl(0, 84%, 60%)" },
  };

  // --- Status distribution ---
  const statusData = useMemo(() => {
    return [
      { name: t("admin.confirmed"), value: confirmedCount, fill: "hsl(142, 76%, 36%)" },
      { name: t("admin.completed"), value: completedCount, fill: "hsl(217, 91%, 60%)" },
      { name: t("admin.cancelled"), value: cancelledCount, fill: "hsl(0, 84%, 60%)" },
    ].filter((d) => d.value > 0);
  }, [confirmedCount, completedCount, cancelledCount, t]);

  const statusConfig: ChartConfig = {
    confirmed: { label: t("admin.confirmed"), color: "hsl(142, 76%, 36%)" },
    completed: { label: t("admin.completed"), color: "hsl(217, 91%, 60%)" },
    cancelled: { label: t("admin.cancelled"), color: "hsl(0, 84%, 60%)" },
  };

  if (bookingsLoading) return <PageLoader />;

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-3xl font-bold">{t("admin.statistics")}</h1>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto justify-start text-left font-normal gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {formatDateDisplay(dateFrom)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  if (date) {
                    setDateFrom(date);
                    if (date > dateTo) setDateTo(date);
                  }
                  setFromOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">—</span>

          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto justify-start text-left font-normal gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {formatDateDisplay(dateTo)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  if (date) {
                    setDateTo(date);
                    if (date < dateFrom) setDateFrom(date);
                  }
                  setToOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1));
              setDateTo(new Date());
            }}
            title={t("common.reset")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold mt-1">{stat.value}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Service Order Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.serviceStats")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={serviceCountConfig} className="h-[300px] w-full">
              <BarChart data={serviceStatsData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <XAxis type="number" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Service Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.revenueByService")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={serviceRevenueConfig} className="h-[300px] w-full">
              <BarChart data={serviceStatsData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <XAxis type="number" tickFormatter={(v) => (v / 1000) + "k"} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => Number(value).toLocaleString() + " " + t("common.currency")} />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Booking Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.bookingTrends")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-[300px] w-full">
              <LineChart data={trendData}>
                <CartesianGrid />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name={t("admin.totalBookings")}
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name={t("admin.completed")}
                  stroke="var(--color-completed)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  name={t("admin.cancelled")}
                  stroke="var(--color-cancelled)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.statusDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
