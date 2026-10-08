"use client";

import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";

/** Also works without the root layout's providers, for global-error. */
export function ErrorRecovery({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-20 sm:px-8">
      <Fr as="p" className="text-primary text-2xl">
        On reprend ?
      </Fr>
      <h1 className="mt-1 text-[2rem] leading-tight font-bold">Vamos tentar de novo</h1>
      <p role="alert" className="text-muted-foreground mt-3 text-lg leading-relaxed">
        Não foi possível abrir esta página agora. As respostas que já foram salvas continuam na sua
        conta.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={retry} className="h-12 rounded-xl px-8 text-base">
          Tentar novamente
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-xl px-8 text-base">
          <a href="/hoje">Voltar para hoje</a>
        </Button>
      </div>
    </main>
  );
}
