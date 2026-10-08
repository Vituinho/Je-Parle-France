"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (next.length < 10) {
      setError("A nova senha precisa ter pelo menos 10 caracteres.");
      return;
    }
    startTransition(async () => {
      const { error: failure } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (failure) {
        setError(
          failure.status === 400 || failure.status === 401
            ? "A senha atual não confere."
            : "Não foi possível trocar a senha agora. Tente de novo.",
        );
        return;
      }
      setError(null);
      setCurrent("");
      setNext("");
      toast.success("Senha alterada. Outros aparelhos foram desconectados.");
    });
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-4" aria-label="Trocar senha">
      <div className="space-y-2">
        <Label htmlFor="current-password">Senha atual</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          required
          className="h-11 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          required
          className="h-11 rounded-xl"
        />
        <p className="text-muted-foreground text-sm">Pelo menos 10 caracteres.</p>
      </div>
      {error && (
        <p
          role="alert"
          className="text-destructive bg-destructive-soft rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <Button type="submit" variant="outline" disabled={pending} className="h-11 rounded-xl px-6">
        {pending ? "Trocando…" : "Trocar senha"}
      </Button>
    </form>
  );
}
