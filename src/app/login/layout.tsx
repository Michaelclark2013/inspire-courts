import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Inspire Courts AZ",
  description: "Sign in to your Inspire Courts AZ account.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
