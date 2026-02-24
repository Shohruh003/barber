import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scissors, Eye, EyeOff, User, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { registerSchema } from "@/lib/validation";
import type { RegisterFormData } from "@/lib/validation";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "user" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
    });
    toast.success(t("common.success"));
    if (data.role === "barber") {
      navigate("/profile", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("auth.registerTitle")}</CardTitle>
          <CardDescription>{t("auth.registerSub")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label>{t("auth.role")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("role", "user")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                    selectedRole === "user"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30",
                  )}
                >
                  <User className={cn("h-8 w-8", selectedRole === "user" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", selectedRole === "user" ? "text-primary" : "text-muted-foreground")}>
                    {t("auth.roleUser")}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("auth.roleUserDesc")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("role", "barber")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                    selectedRole === "barber"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30",
                  )}
                >
                  <UserCog className={cn("h-8 w-8", selectedRole === "barber" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", selectedRole === "barber" ? "text-primary" : "text-muted-foreground")}>
                    {t("auth.roleBarber")}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("auth.roleBarberDesc")}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                placeholder="Shohruh Azimov"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+998 90 123 45 67"
                {...register("phone")}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("auth.register")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t("auth.hasAccount")}{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              {t("auth.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
