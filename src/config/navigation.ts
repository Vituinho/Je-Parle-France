import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  BookMarked,
  BookOpenText,
  ChartNoAxesColumn,
  CalendarCheck,
  Map as MapIcon,
  MessagesSquare,
  Newspaper,
  RotateCcw,
} from "lucide-react";

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
  // On mobile, the course map is linked from the dashboard.
  { href: "/curso", label: "Curso", icon: MapIcon, mobile: false },
  { href: "/revisar", label: "Revisão", icon: RotateCcw, mobile: true },
  { href: "/tutor", label: "Tutor", icon: MessagesSquare, mobile: true },
  { href: "/pronuncia", label: "Pronúncia", icon: AudioLines, mobile: true },
  { href: "/caderno", label: "Caderno", icon: BookMarked, mobile: true },
  // On mobile, grammar is reached from the notebook.
  { href: "/gramatica", label: "Gramática", icon: BookOpenText, mobile: false },
  // On mobile, authentic content is linked from the dashboard.
  { href: "/conteudo", label: "Francês real", icon: Newspaper, mobile: false },
  // On mobile, progress is linked from the dashboard.
  { href: "/progresso", label: "Progresso", icon: ChartNoAxesColumn, mobile: false },
];
