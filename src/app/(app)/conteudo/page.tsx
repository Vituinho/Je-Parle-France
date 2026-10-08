import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthenticCard } from "@/components/authentic/authentic-card";
import { Fr } from "@/components/fr";
import { Skeleton } from "@/components/ui/skeleton";
import { getContent } from "@/lib/content";
import { rankAuthentic, regionsFor } from "@/lib/learning/authentic";
import { getLearnerLevel } from "@/server/services/learner";
import { requireLearner } from "@/server/session";

export const metadata: Metadata = { title: "Francês de verdade" };

const checkedDate = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

async function Library() {
  const { user, profile } = await requireLearner();
  const level = await getLearnerLevel(user.id);
  const items = getContent().course.authentic;
  const ranked = rankAuthentic(items, {
    level: level.level,
    regions: regionsFor(profile.destination),
  });
  const now = ranked.filter((entry) => entry.fits);
  const later = ranked.filter((entry) => !entry.fits);
  const checked = items
    .map((item) => item.checkedOn)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(0);

  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <Fr as="p" className="text-primary text-xl">
          Le vrai français
        </Fr>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold">Francês de verdade</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Rádio, vídeos, podcasts e textos reais, de fontes oficiais e gratuitas. Ouvir e ler o que
          os nativos ouvem e leem — começando pelo que está ao seu alcance hoje.
        </p>
      </header>

      <section aria-labelledby="now">
        <h2 id="now" className="text-xl font-bold">
          No seu nível ({level.level})
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Até um nível acima do seu: dá para entender o essencial com esforço — é assim que se
          aprende. Use a transcrição quando houver.
        </p>
        {now.length > 0 ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {now.map((entry) => (
              <li key={entry.item.id}>
                <AuthenticCard item={entry.item} className="h-full" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4">
            Ainda não há material autêntico no seu nível. As lições vêm primeiro.
          </p>
        )}
      </section>

      {later.length > 0 && (
        <section aria-labelledby="later" className="border-border border-t pt-8">
          <h2 id="later" className="text-xl font-bold">
            Para daqui a pouco
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Mais difíceis por enquanto. Vale espiar — e voltar quando o seu nível subir.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {later.map((entry) => (
              <li key={entry.item.id}>
                <AuthenticCard item={entry.item} className="h-full opacity-90" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-muted-foreground border-border border-t pt-6 text-sm leading-relaxed">
        Só indicamos links para as fontes originais: nada é copiado nem hospedado aqui.
        {checked &&
          ` Links verificados em ${checkedDate.format(new Date(`${checked}T00:00:00Z`))}.`}
      </p>
    </div>
  );
}

export default function AuthenticPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Library />
      </Suspense>
    </div>
  );
}
