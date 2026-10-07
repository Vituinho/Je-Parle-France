import type { LucideIcon } from "lucide-react";
import { CalendarCheck } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar (max 5). */
  mobile: boolean;
}

/**
 * Primary navigation. Items are added here only when the destination works —
 * never as placeholders.
 */
export const primaryNav: NavItem[] = [
  { href: "/hoje", label: "Hoje", icon: CalendarCheck, mobile: true },
];
