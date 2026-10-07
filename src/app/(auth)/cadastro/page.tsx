import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Fr } from "@/components/fr";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <>
      <Fr as="h1" className="text-4xl font-semibold">
        Bienvenue !
      </Fr>
      <p className="text-muted-foreground mt-2">
        Crie sua conta grátis. Em seguida, montamos seu plano em poucos passos.
      </p>
      <div className="mt-8">
        <Suspense>
          <AuthForm mode="sign-up" />
        </Suspense>
      </div>
    </>
  );
}
