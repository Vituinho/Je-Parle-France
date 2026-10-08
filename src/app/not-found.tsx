import Link from "next/link";
import { Fr } from "@/components/fr";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-20 sm:px-8">
      <Fr as="p" className="text-primary text-2xl">
        Oups, page introuvable.
      </Fr>
      <h1 className="mt-1 text-[2rem] leading-tight font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
        O endereço pode estar errado, ou esta página não está disponível para a sua conta.
      </p>
      <Button asChild className="mt-8 h-12 w-full rounded-xl text-base sm:w-auto sm:px-8">
        <Link href="/hoje">Voltar para hoje</Link>
      </Button>
    </div>
  );
}
