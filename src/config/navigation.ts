import type { LucideIcon } from "lucide-react";
import { AudioLines, CalendarCheck, MessagesSquare, RotateCcw } from "lucide-react";

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
  { href: "/revisar", label: "Revisão", icon: RotateCcw, mobile: true },
  { href: "/tutor", label: "Tutor", icon: MessagesSquare, mobile: true },
  { href: "/pronuncia", label: "Pronúncia", icon: AudioLines, mobile: true },
];
