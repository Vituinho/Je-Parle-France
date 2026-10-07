import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex rounded-md">
          <Wordmark />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
