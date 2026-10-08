"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { primaryNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="space-y-1">
      {primaryNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="size-[1.15rem]" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BottomLinks({ pathname }: { pathname: string | null }) {
  const items = primaryNav.filter((item) => item.mobile);
  return (
    <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs",
                active ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveSidebarLinks() {
  return <SidebarLinks pathname={usePathname()} />;
}

function ActiveBottomLinks() {
  return <BottomLinks pathname={usePathname()} />;
}

/*
 * With Cache Components, usePathname suspends on routes with dynamic params
 * that are only known at request time. The Suspense fallback renders the same
 * links without the active state, so the layout still prerenders.
 */
export function SidebarNav() {
  return (
    <Suspense fallback={<SidebarLinks pathname={null} />}>
      <ActiveSidebarLinks />
    </Suspense>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<BottomLinks pathname={null} />}>
      <ActiveBottomLinks />
    </Suspense>
  );
}
