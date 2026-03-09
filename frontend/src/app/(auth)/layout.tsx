import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - My Jarvis Gua",
  description: "Login or register to access your My Jarvis Gua account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-background">{children}</div>;
}
