import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/organisms/AuthForm/AuthForm";

export const metadata: Metadata = {
  title: "Sign In | AI Teach Me Lava Lamps",
  description: "Sign in to access the protected lava lamp simulation.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="signin" />
    </Suspense>
  );
}
