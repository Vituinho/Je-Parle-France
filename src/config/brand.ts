/**
 * Central brand configuration. Components must read the product name, tagline
 * and contact details from here instead of hard-coding them.
 */
export const brand = {
  name: "Je Parle Français",
  shortName: "JPF",
  tagline: {
    en: "French for real life.",
    "pt-BR": "Francês para a vida real.",
    fr: "Le français pour la vraie vie.",
  },
  description:
    "Plataforma de francês para brasileiros que querem viver, estudar e trabalhar no Canadá, no Québec ou na França.",
  locale: "pt-BR",
} as const;

export type Brand = typeof brand;
