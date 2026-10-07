import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Fr } from "@/components/fr";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <>
      <Fr as="h1" className="text-4xl font-semibold">
        Bon retour !
      </Fr>
      <p className="text-muted-foreground mt-2">Que bom te ver de novo. Entre para continuar.</p>
      <div className="mt-8">
        <Suspense>
          <AuthForm mode="sign-in" />
        </Suspense>
      </div>
    </>
  );
}
