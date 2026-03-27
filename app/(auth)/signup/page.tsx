import type { Metadata } from "next";

import { AuthForm } from "@/components/organisms/AuthForm/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up | AI Teach Me Lava Lamps",
  description: "Create an account to access the protected lava lamp simulation.",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
