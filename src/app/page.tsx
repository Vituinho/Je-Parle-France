import Link from "next/link";
import { brand } from "@/config/brand";
import { Wordmark } from "@/components/brand/wordmark";
import { Fr } from "@/components/fr";
import { LineProgress } from "@/components/line-progress";
import { Button } from "@/components/ui/button";

const steps = [
  {
    id: "diagnostico",
    title: "Diagnóstico adaptativo",
    text: "Em cerca de 10 minutos estimamos seu nível em cada habilidade: leitura, escuta, vocabulário, gramática — e, no diagnóstico completo, fala e escrita.",
  },
  {
    id: "sessao",
    title: "A sessão do dia",
    text: "Você diz quanto tempo tem. O plano junta revisão, lição nova, escuta e fala na medida certa — 5 minutos não são uma versão menor de 60.",
  },
  {
    id: "tutor",
    title: "Conversa com o tutor",
    text: "Situações reais: banco, aluguel, entrevista, farmácia. Você escolhe se quer correção na hora ou um relatório no fim.",
  },
  {
    id: "revisao",
    title: "Revisão no momento certo",
    text: "O que você erra volta quando está prestes a esquecer, até sair natural — na leitura, na escuta e na fala.",
  },
];

const tracks = [
  {
    id: "canada",
    title: "Vivre au Canada",
    situations: [
      "Chegada e imigração no aeroporto",
      "Abrir conta e pedir cartão",
      "Alugar apartamento e falar com o proprietário",
      "Entrevista de emprego e reuniões",
    ],
    regional: {
      fr: "Au Québec, on dit aussi « magasiner » et « la fin de semaine ».",
      pt: "No Québec também se diz “magasiner” (fazer compras) e “la fin de semaine” (fim de semana).",
    },
  },
  {
    id: "france",
    title: "Vivre en France",
    situations: [
      "Padaria, mercado e restaurante",
      "Transporte, passe e horários",
      "Banco, seguro saúde e administração",
      "Universidade e mundo do trabalho",
    ],
    regional: {
      fr: "En France, le repas de midi s'appelle « le déjeuner ».",
      pt: "Na França, o almoço é “le déjeuner” — no Québec, é “le dîner”.",
    },
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="rounded-md">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-2" aria-label="Conta">
          <Button asChild variant="ghost" size="lg">
            <Link href="/entrar">Entrar</Link>
          </Button>
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/cadastro">Criar conta</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-16">
          <div className="max-w-xl">
            <h1 className="text-[2.6rem] leading-[1.05] font-bold sm:text-6xl">
              {brand.tagline["pt-BR"]}
            </h1>
            <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
              Para brasileiros que vão viver, estudar ou trabalhar no Canadá, no Québec ou na
              França. Do zero ao C1, com um plano diário que se adapta ao seu tempo e ao que você
              ainda não domina.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
                <Link href="/cadastro">Começar grátis</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl px-6 text-base"
              >
                <Link href="/entrar">Já tenho conta</Link>
              </Button>
            </div>
          </div>

          <figure
            aria-label="Exemplo de correção do tutor"
            className="seyes border-border relative overflow-hidden rounded-3xl border py-8 pr-6 pl-[4.5rem] shadow-[0_1px_0_var(--border),0_24px_48px_-28px_rgb(22_27_54/0.35)] sm:py-10 sm:pr-10"
          >
            <p className="text-muted-foreground text-sm">Você disse ao tutor:</p>
            <Fr as="p" className="mt-2 text-2xl leading-snug sm:text-[1.7rem]">
              <span className="correction">Je besoin</span> d&apos;ouvrir un compte.
            </Fr>
            <p className="text-muted-foreground mt-7 text-sm">O jeito natural em francês:</p>
            <Fr as="p" className="mt-2 text-2xl leading-snug font-medium sm:text-[1.7rem]">
              <span className="highlight">J&apos;ai besoin</span> d&apos;ouvrir un compte.
            </Fr>
            <figcaption className="border-border bg-card/90 mt-8 rounded-2xl border p-4 text-[0.95rem] leading-relaxed backdrop-blur-[1px]">
              Em português dizemos “eu preciso”. Em francês, a estrutura é{" "}
              <Fr className="font-semibold">avoir besoin de</Fr> — literalmente, “ter necessidade
              de”.
              <span className="text-primary mt-3 block text-sm font-medium">
                Entrou na sua revisão de amanhã.
              </span>
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="como-funciona" className="border-border bg-card border-y">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
            <h2 id="como-funciona" className="text-3xl font-bold sm:text-4xl">
              Como funciona
            </h2>
            <div className="mt-10 hidden md:block">
              <LineProgress
                ariaLabel="Etapas"
                stations={steps.map((step, index) => ({
                  id: step.id,
                  label: step.title,
                  state: index === 0 ? "current" : "upcoming",
                }))}
              />
            </div>
            <ol className="mt-8 grid gap-8 md:mt-6 md:grid-cols-4 md:gap-6">
              {steps.map((step, index) => (
                <li key={step.id} className="md:px-2 md:text-center">
                  <h3 className="text-lg font-semibold md:sr-only">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 leading-relaxed md:mt-0">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="trilhas" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <h2 id="trilhas" className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Francês internacional primeiro. Depois, o francês de onde você vai morar.
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
            {tracks.map((track) => (
              <article key={track.id}>
                <Fr as="h3" className="text-2xl font-semibold">
                  {track.title}
                </Fr>
                <ul className="mt-4 space-y-2.5">
                  {track.situations.map((situation) => (
                    <li key={situation} className="flex gap-3 leading-relaxed">
                      <span
                        aria-hidden
                        className="bg-primary mt-[0.6rem] size-1.5 shrink-0 rounded-full"
                      />
                      {situation}
                    </li>
                  ))}
                </ul>
                <blockquote className="border-primary mt-6 border-l-[3px] pl-4">
                  <Fr as="p" className="text-lg">
                    {track.regional.fr}
                  </Fr>
                  <p className="text-muted-foreground mt-1 text-sm">{track.regional.pt}</p>
                </blockquote>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-sm sm:px-8">
          <p>
            As estimativas de nível do {brand.name} são ferramentas de aprendizagem internas e não
            substituem certificações oficiais (TEF, TCF, DELF, DALF).
          </p>
        </div>
      </footer>
    </div>
  );
}
