import { brand } from "@/config/brand";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-4xl font-semibold tracking-tight">{brand.name}</h1>
      <p className="text-lg text-neutral-600">{brand.tagline["pt-BR"]}</p>
    </main>
  );
}
