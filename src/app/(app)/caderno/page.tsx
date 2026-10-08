import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Fr } from "@/components/fr";
import { Notebook } from "@/components/library/notebook";
import { Skeleton } from "@/components/ui/skeleton";
import { MASTERY_VALUE } from "@/lib/learning/memory/memory";
import { getNotebook } from "@/server/services/library";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Meu caderno" };

async function NotebookSection() {
  const { user } = await requireLearner();
  await connection();
  const now = new Date();
  const { words, corrections } = await getNotebook(user.id, now);
  const firm = words.filter((word) => MASTERY_VALUE[word.overall] >= MASTERY_VALUE.familiar).length;
  return (
    <>
      <header className="seyes border-border relative overflow-hidden rounded-3xl border py-7 pr-6 pl-[4.5rem]">
        <Fr as="p" className="text-primary text-xl">
          Mon cahier
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Meu caderno</h1>
        <p className="text-muted-foreground mt-2">
          {words.length === 0
            ? "As palavras e expressões que você estuda aparecem aqui."
            : `${words.length} ${words.length === 1 ? "palavra ou expressão" : "palavras e expressões"} · ${firm} já familiares ou mais firmes`}
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/gramatica"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Ver a gramática
          </Link>
        </p>
      </header>
      <div className="mt-8">
        <Notebook words={words} corrections={corrections} now={now.getTime()} />
      </div>
    </>
  );
}

export default function NotebookPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <NotebookSection />
      </Suspense>
    </div>
  );
}
