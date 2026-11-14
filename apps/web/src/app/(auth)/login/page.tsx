import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Logowanie | Building Management" };

export default function LoginPage() {
  return <AuthForm key="login" mode="login" />;
}

