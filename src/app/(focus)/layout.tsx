/** Full-screen, distraction-free routes (onboarding, placement, lessons). */
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
