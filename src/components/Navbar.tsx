import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  Scissors,
  User,
  Users,
  Bell,
  CalendarDays,
  LayoutDashboard,
  CheckCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    notifications,
    loadNotifications,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotificationStore();

  useEffect(() => {
    if (user && user.role === "barber") {
      loadNotifications(user.id);
    }
  }, [user, loadNotifications]);

  const navLinks = [
    { to: "/", label: t("nav.home"), icon: null },
    { to: "/barbers", label: t("nav.barbers"), icon: null },
  ];

  if (user) {
    if (user.role === "user") {
      navLinks.push({
        to: "/bookings",
        label: t("nav.bookings"),
        icon: null,
      });
    }
    if (user.role === "barber") {
      navLinks.push({
        to: "/bookings",
        label: t("nav.bookings"),
        icon: null,
      });
      navLinks.push({
        to: "/barber/dashboard",
        label: t("nav.barberStats"),
        icon: null,
      });
      navLinks.push({
        to: "/barber-panel",
        label: t("nav.barberPanel"),
        icon: null,
      });
    }
    if (user.role === "admin") {
      navLinks.push({
        to: "/admin",
        label: t("nav.adminStats"),
        icon: null,
      });
      navLinks.push({
        to: "/admin/bookings",
        label: t("nav.adminBookings"),
        icon: null,
      });
      navLinks.push({
        to: "/admin/users",
        label: t("nav.adminUsers"),
        icon: null,
      });
      navLinks.push({
        to: "/admin/barbers",
        label: t("nav.adminBarbers"),
        icon: null,
      });
    }
  }

  const isActive = (path: string) => location.pathname === path;

  const unread = unreadCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            BarberBook
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(link.to)
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              {/* Notification Bell — barber only */}
              {user.role === "barber" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-96 p-0">
                    <div className="flex items-center justify-between border-b px-4 py-3 gap-2">
                      <h4 className="text-sm font-semibold shrink-0">
                        {t("barberPanel.notifications")}
                      </h4>
                      {unread > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 shrink-0"
                          onClick={() => markAllRead(user.id)}
                        >
                          <CheckCheck className="h-3.5 w-3.5 mr-1" />
                          {t("barberPanel.markAllRead")}
                        </Button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                          {t("barberPanel.noNotifications")}
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={cn(
                              "border-b last:border-b-0 px-4 py-3 cursor-pointer transition-colors hover:bg-accent",
                              !notif.isRead && "bg-primary/5",
                            )}
                            onClick={() => !notif.isRead && markRead(notif.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{notif.title}</p>
                              {!notif.isRead && (
                                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Profile Avatar */}
              <Link to="/profile" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {/* Mobile notification bell */}
          {user && user.role === "barber" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h4 className="text-sm font-semibold">
                    {t("barberPanel.notifications")}
                  </h4>
                  {unread > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => markAllRead(user.id)}
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      {t("barberPanel.markAllRead")}
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {t("barberPanel.noNotifications")}
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "border-b last:border-b-0 px-4 py-3 cursor-pointer transition-colors hover:bg-accent",
                          !notif.isRead && "bg-primary/5",
                        )}
                        onClick={() => !notif.isRead && markRead(notif.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{notif.title}</p>
                          {!notif.isRead && (
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background animate-slide-in">
          <div className="container py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(link.to)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                {link.to === "/" && <Scissors className="h-4 w-4" />}
                {link.to === "/barbers" && <User className="h-4 w-4" />}
                {link.to === "/bookings" && <CalendarDays className="h-4 w-4" />}
                {link.to === "/barber/dashboard" && <TrendingUp className="h-4 w-4" />}
                {link.to === "/barber-panel" && <LayoutDashboard className="h-4 w-4" />}
                {link.to === "/admin" && <LayoutDashboard className="h-4 w-4" />}
                {link.to === "/admin/bookings" && <CalendarDays className="h-4 w-4" />}
                {link.to === "/admin/users" && <Users className="h-4 w-4" />}
                {link.to === "/admin/barbers" && <Scissors className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}

            <div className="border-t pt-3">
              {user ? (
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      {t("nav.login")}
                    </Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link to="/register" onClick={() => setMobileOpen(false)}>
                      {t("nav.register")}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
