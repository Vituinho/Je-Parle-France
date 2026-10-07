"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  async function signOut() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-sidebar-accent/60 flex w-full items-center gap-3 rounded-xl p-2 text-left"
        aria-label="Abrir menu da conta"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="text-muted-foreground block truncate text-xs">{email}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
