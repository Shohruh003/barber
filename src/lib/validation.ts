import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email noto'g'ri formatda"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  email: z.string().email("Email noto'g'ri formatda"),
  phone: z.string().min(9, "Telefon raqam noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  confirmPassword: z.string(),
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
  phone: z.string().min(9, "Telefon raqam noto'g'ri"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
