"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail. Entre com a sua senha.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Já existe uma conta com este e-mail. Entre com a sua senha.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_EMAIL: "Digite um e-mail válido.",
  PASSWORD_TOO_SHORT: "A senha precisa de pelo menos 10 caracteres.",
  PASSWORD_TOO_LONG: "A senha pode ter no máximo 128 caracteres.",
  TOO_MANY_REQUESTS: "Muitas tentativas seguidas. Espere um minuto e tente de novo.",
};

function messageFor(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "Não foi possível continuar. Verifique sua conexão e tente de novo.";
  return (error.code && ERROR_MESSAGES[error.code]) || "Não foi possível continuar. Tente de novo.";
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const signUp = mode === "sign-up";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    setError(null);

    startTransition(async () => {
      const result = signUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(messageFor(result.error));
        return;
      }
      router.replace(signUp ? "/comecar" : safeNext(searchParams.get("next"), "/hoje"));
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
      {signUp && (
        <div className="space-y-2">
          <Label htmlFor="name">Como quer ser chamado?</Label>
          <Input
            id="name"
            name="name"
            autoComplete="given-name"
            required
            maxLength={60}
            className="h-11"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={signUp ? "new-password" : "current-password"}
          required
          minLength={signUp ? 10 : undefined}
          aria-describedby={signUp ? "password-hint" : undefined}
          className="h-11"
        />
        {signUp && (
          <p id="password-hint" className="text-muted-foreground text-sm">
            Pelo menos 10 caracteres.
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="text-destructive bg-destructive-soft rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl text-base">
        {pending ? "Um instante…" : signUp ? "Criar conta" : "Entrar"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {signUp ? "Já tem conta? " : "Ainda não tem conta? "}
        <Link
          href={signUp ? "/entrar" : "/cadastro"}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {signUp ? "Entrar" : "Criar conta grátis"}
        </Link>
      </p>
    </form>
  );
}
