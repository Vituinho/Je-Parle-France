import Link from "next/link";
import { Suspense } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/server/session";
import { BottomNav, SidebarNav } from "./nav-links";
import { UserMenu } from "./user-menu";

async function CurrentUserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <UserMenu name={user.name} email={user.email} />;
}

/**
 * Authenticated chrome: a quiet sidebar on desktop, top bar + bottom tabs on
 * mobile. Only the user menu reads the session, so the rest prerenders.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="border-sidebar-border bg-sidebar sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r px-4 py-5 lg:flex">
        <Link href="/hoje" className="mb-8 inline-flex rounded-md px-2">
          <Wordmark />
        </Link>
        <nav aria-label="Principal" className="flex-1">
          <SidebarNav />
        </nav>
        <Suspense fallback={<Skeleton className="h-12 w-full rounded-xl" />}>
          <CurrentUserMenu />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/90 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-2.5 backdrop-blur lg:hidden">
          <Link href="/hoje" className="rounded-md">
            <Wordmark />
          </Link>
          <div className="w-12">
            <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
              <CurrentUserMenu />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <nav
          aria-label="Principal"
          className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur lg:hidden"
        >
          <BottomNav />
        </nav>
      </div>
    </div>
  );
}
