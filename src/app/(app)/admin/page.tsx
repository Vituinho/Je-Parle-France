import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { course } from "@content/index";
import { buildContentIndex, conceptDimensions, getContent } from "@/lib/content";
import { contentStats } from "@/lib/content/stats";
import { CEFR_LEVELS } from "@/lib/learning/cefr";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Administração" };

const TRACK_LABEL = {
  core: "Percurso principal",
  canada: "Vivre au Canada",
  france: "Vivre en France",
};

function Cell({ value }: { value: number }) {
  return <td className={value === 0 ? "text-muted-foreground/50" : undefined}>{value}</td>;
}

async function Admin() {
  await requireAdmin();
  const index = getContent();
  const stats = contentStats(index);
  const { issues } = buildContentIndex(course);
  const [learners, onboarded, sessions] = await Promise.all([
    db.user.count(),
    db.learnerProfile.count({ where: { onboardedAt: { not: null } } }),
    db.dailySession.count({ where: { status: "completed" } }),
  ]);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-[2rem] leading-tight font-bold">Administração do conteúdo</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Inventário do curso, problemas de validação e prévia das lições com respostas. O conteúdo
          é editado no repositório (<code>content/</code>) e validado com{" "}
          <code>npm run content:check</code>.
        </p>
      </header>

      <section aria-labelledby="usage">
        <h2 id="usage" className="text-xl font-bold">
          Uso (agregado)
        </h2>
        <dl className="mt-4 grid grid-cols-3 gap-6 sm:max-w-xl">
          {[
            ["contas", learners],
            ["com onboarding", onboarded],
            ["sessões concluídas", sessions],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground text-sm">{label}</dt>
              <dd className="text-2xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="issues" className="border-border border-t pt-8">
        <h2 id="issues" className="text-xl font-bold">
          Validação
        </h2>
        {issues.length === 0 ? (
          <p className="text-success mt-2">Nenhum erro ou aviso no conteúdo.</p>
        ) : (
          <ul className="mt-3 space-y-1 font-mono text-sm">
            {issues.map((issue, i) => (
              <li key={i} className={issue.severity === "error" ? "text-destructive" : undefined}>
                [{issue.severity}] {issue.path}: {issue.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="inventory" className="border-border border-t pt-8">
        <h2 id="inventory" className="text-xl font-bold">
          Inventário
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {stats.concepts} conceitos · {stats.placementItems} itens de diagnóstico ·{" "}
          {stats.scenarios} cenários do tutor
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-md text-left text-sm [&_td]:py-1.5 [&_td]:pr-4 [&_th]:py-1.5 [&_th]:pr-4">
            <caption className="sr-only">Conceitos por tipo e nível</caption>
            <thead>
              <tr className="border-border border-b">
                <th scope="col">Conceitos</th>
                {CEFR_LEVELS.map((level) => (
                  <th key={level} scope="col">
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.conceptsByKind).map(([kind, levels]) => (
                <tr key={kind} className="border-border border-b">
                  <th scope="row" className="font-medium">
                    {kind}
                  </th>
                  {CEFR_LEVELS.map((level) => (
                    <Cell key={level} value={levels[level]} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm">
          Tipos de atividade:{" "}
          {stats.activityTypes.map(([type, count]) => `${type} ${count}`).join(" · ")}
        </p>
      </section>

      <section aria-labelledby="lessons" className="border-border border-t pt-8">
        <h2 id="lessons" className="text-xl font-bold">
          Lições
        </h2>
        <div className="mt-4 space-y-8">
          {stats.paths.map((path) => (
            <div key={path.track}>
              <h3 className="font-semibold">
                {TRACK_LABEL[path.track]}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  {path.lessons} lições · {path.activities} passos · ~{path.minutes} min
                </span>
              </h3>
              <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                {index.paths[path.track].map((ref) => (
                  <li key={ref.lesson.id}>
                    <Link
                      href={`/admin/licoes/${ref.lesson.id}`}
                      className="hover:bg-muted/60 flex gap-3 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <span className="text-muted-foreground w-20 shrink-0 font-mono">
                        {ref.lesson.id}
                      </span>
                      <span>{ref.lesson.title.pt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="concepts" className="border-border border-t pt-8">
        <h2 id="concepts" className="text-xl font-bold">
          Conceitos
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm [&_td]:py-1 [&_td]:pr-4 [&_th]:py-1.5 [&_th]:pr-4">
            <caption className="sr-only">Todos os conceitos</caption>
            <thead>
              <tr className="border-border border-b">
                <th scope="col">Id</th>
                <th scope="col">Nível</th>
                <th scope="col">Região</th>
                <th scope="col">Dimensões</th>
                <th scope="col">Lições</th>
              </tr>
            </thead>
            <tbody>
              {[...index.concepts.values()].map((concept) => (
                <tr key={concept.id} className="border-border/60 border-b">
                  <td className="font-mono">{concept.id}</td>
                  <td>{concept.level}</td>
                  <td>{concept.region}</td>
                  <td className="text-muted-foreground">{conceptDimensions(concept).join(", ")}</td>
                  <td className="font-mono">
                    {(index.conceptLessons.get(concept.id) ?? []).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        <Admin />
      </Suspense>
    </div>
  );
}
