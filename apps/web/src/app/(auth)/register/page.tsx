import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Rejestracja | Building Management" };

export default function RegisterPage() {
  return <AuthForm key="register" mode="register" />;
}

