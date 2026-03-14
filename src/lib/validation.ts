import { z } from "zod";

const uzPhoneRegex = /^(?:\+998|0)?[\s.-]*(20|33|50|55|70|71|72|73|74|75|76|77|78|79|88|90|91|93|94|95|97|98|99)[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}$/;
const phoneField = z.string().regex(uzPhoneRegex, "Telefon raqam noto'g'ri");

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneField,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  confirmPassword: z.string(),
  role: z.enum(["user", "barber"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parollar mos kelmadi",
  path: ["confirmPassword"],
});

export const bookingSchema = z.object({
  barberId: z.string().min(1, "Sartarosh tanlang"),
  serviceId: z.string().min(1, "Xizmat tanlang"),
  date: z.string().min(1, "Sana tanlang"),
  time: z.string().min(1, "Vaqt tanlang"),
  notes: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: phoneField,
  oldPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.oldPassword && !data.newPassword) return false;
  if (!data.oldPassword && data.newPassword) return false;
  if (data.newPassword && data.newPassword.length < 6) return false;
  return true;
}, {
  message: "Parolni o'zgartirish uchun eski va yangi parolni kiriting (kamida 6 belgi)",
  path: ["newPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) return false;
  return true;
}, {
  message: "Parollar mos kelmadi",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  phone: phoneField,
});

export const newPasswordSchema = z.object({
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parollar mos kelmadi",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
