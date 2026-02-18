import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  Scissors,
  User,
  LogOut,
  CalendarDays,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: t("nav.home"), icon: null },
    { to: "/barbers", label: t("nav.barbers"), icon: null },
  ];

  if (user) {
    if (user.role === "user") {
      navLinks.push({
        to: "/profile",
        label: t("nav.bookings"),
        icon: null,
      });
    }
    if (user.role === "barber") {
      navLinks.push({
        to: "/profile",
        label: t("nav.bookings"),
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
        label: t("nav.admin"),
        icon: null,
      });
    }
  }

  const isActive = (path: string) => location.pathname === path;

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
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} aria-label={t("nav.logout")}>
                <LogOut className="h-4 w-4" />
              </Button>
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
                {link.to === "/profile" && <CalendarDays className="h-4 w-4" />}
                {link.to === "/barber-panel" && <LayoutDashboard className="h-4 w-4" />}
                {link.to === "/admin" && <LayoutDashboard className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}

            <div className="border-t pt-3">
              {user ? (
                <div className="space-y-3">
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
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav.logout")}
                  </Button>
                </div>
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
