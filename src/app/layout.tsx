import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Spectral } from "next/font/google";
import { brand } from "@/config/brand";
import { Providers } from "@/components/providers";
import { publicCapabilities } from "@/lib/ai/capabilities";
import { cn } from "@/lib/utils";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline["pt-BR"]}`, template: `%s · ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#10142a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={brand.locale}
      suppressHydrationWarning
      className={cn("h-full antialiased", bricolage.variable, spectral.variable)}
    >
      <body className="flex min-h-full flex-col">
        <Providers capabilities={publicCapabilities()}>{children}</Providers>
      </body>
    </html>
  );
}
