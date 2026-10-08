import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitQuebec: UnitInput = {
  id: "ca-u1",
  level: "A0",
  track: "canada",
  region: "fr-CA",
  title: { pt: "Bem-vindo ao Québec", fr: "Bienvenue au Québec" },
  canDo: {
    pt: "Cumprimentar e agradecer como no Québec e entender os nomes das refeições, do fim de semana e do dépanneur.",
    fr: "Saluer et remercier comme au Québec, et comprendre les noms des repas, de la fin de semaine et du dépanneur.",
  },
  missionScenario: "scn-cafe-montreal",
  lessons: [
    {
      id: "ca-u1-l1",
      title: { pt: "Bonjour-Hi!", fr: "Bonjour-Hi !" },
      objective: {
        pt: "Cumprimentar, agradecer e dizer “tudo bem” à moda quebequense.",
        fr: "Saluer, remercier et dire « c'est correct » comme au Québec.",
      },
      minutes: 6,
      steps: [
        {
          id: "ca-u1-l1-t1",
          type: "teach",
          title: { pt: "Bonjour-Hi!", fr: "Bonjour-Hi !" },
          body: {
            pt: "Em muitas lojas de Montréal o atendente diz *Bonjour-Hi!* — um cumprimento nas duas línguas, para você escolher.\n\nResponda *Bonjour !* e a conversa continua em francês. Se você disser *Hi*, ela muda para o inglês. Para quem quer praticar, a escolha é fácil.",
          },
          examples: [
            { fr: "Bonjour-Hi !", pt: "Olá! (em francês e em inglês)" },
            { fr: "Bonjour !", pt: "Olá! (e a conversa segue em francês)" },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "O francês é a língua oficial do Québec. Fora de Montréal, quase todo mundo vai falar com você só em francês.",
              },
            },
          ],
          introduces: ["cult:bonjour-hi"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u1-l1-t2",
          type: "teach",
          title: { pt: "Allô, bienvenue, c'est correct" },
          body: {
            pt: "Três expressões que você vai ouvir todos os dias no Québec:\n\n*Allô !* é um “oi” informal — e também o “alô” do telefone.\n\n*Bienvenue !* é a resposta mais comum a *merci*: “de nada”, como o *you're welcome* do inglês.\n\n*C'est correct* quer dizer “tudo bem”, “está ok”.",
          },
          examples: [
            { fr: "Allô ! Ça va ?", pt: "Oi! Tudo bem?" },
            { fr: "— Merci ! — Bienvenue !", pt: "— Obrigado! — De nada!" },
            { fr: "— Désolé ! — C'est correct.", pt: "— Desculpa! — Tudo bem." },
          ],
          notes: [
            {
              kind: "france",
              text: {
                pt: "Na França, responde-se *de rien* ao *merci*, e *c'est correct* soa como “é aceitável”. Lá, prefira *ça va* ou *d'accord*.",
              },
            },
          ],
          introduces: ["lex:allo", "lex:bienvenue-qc", "lex:c-est-correct"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u1-l1-a1",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "No Québec, alguém agradece: *Merci beaucoup !* O que você responde?" },
          options: ["Bienvenue !", "Allô !", "Bonsoir !"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Allô* é um cumprimento, não uma resposta ao *merci*." },
            { pt: "*Bonsoir* é “boa noite” ao chegar." },
          ],
          targets: [t("lex:bienvenue-qc", "recognition")],
        },
        {
          id: "ca-u1-l1-a2",
          type: "choice",
          instruction: { pt: "Você quer continuar a conversa em francês." },
          prompt: {
            pt: "Numa loja em Montréal, a vendedora diz:",
            audio: { text: "Bonjour-Hi !", region: "fr-CA" },
          },
          options: ["Bonjour !", "Hi!", "Bienvenue !"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Com *Hi*, a conversa passa para o inglês." },
            { pt: "*Bienvenue* responde a um *merci*." },
          ],
          targets: [t("cult:bonjour-hi", "recognition")],
        },
        {
          id: "ca-u1-l1-a3",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "Allô !", right: "Oi!" },
            { left: "Bienvenue !", right: "De nada!" },
            { left: "C'est correct.", right: "Tudo bem." },
          ],
          targets: [
            t("lex:allo", "recognition"),
            t("lex:bienvenue-qc", "recognition"),
            t("lex:c-est-correct", "recognition"),
          ],
        },
        {
          id: "ca-u1-l1-a4",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Num café em Montréal." },
          lines: [
            { speaker: "Caixa", text: "Bonjour-Hi !", gender: "m", region: "fr-CA" },
            {
              speaker: "Cliente",
              text: "Bonjour ! Un café au lait, s'il vous plaît.",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Caixa",
              text: "Oh, désolé, il n'y a plus de lait.",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Cliente",
              text: "C'est correct, un café noir alors.",
              gender: "f",
              region: "fr-CA",
            },
            { speaker: "Caixa", text: "Voilà !", gender: "m", region: "fr-CA" },
            { speaker: "Cliente", text: "Merci !", gender: "f", region: "fr-CA" },
            {
              speaker: "Caixa",
              text: "Bienvenue ! Bonne journée !",
              gender: "m",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Acabou o leite. Como a cliente reage?" },
              options: ["Diz que tudo bem e pede café puro", "Desiste do café", "Pede um chá"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que o caixa responde ao *merci*?" },
              options: ["Bienvenue !", "Allô !", "C'est correct."],
              answer: 0,
            },
          ],
          targets: [t("lex:c-est-correct", "listening"), t("lex:bienvenue-qc", "listening")],
        },
        {
          id: "ca-u1-l1-a5",
          type: "type",
          instruction: { pt: "Responda como um quebequense.", fr: "Répondez comme au Québec." },
          prompt: { pt: "Alguém diz: *Merci !* (de nada)" },
          accept: ["Bienvenue !"],
          targets: [t("lex:bienvenue-qc", "recall")],
        },
        {
          id: "ca-u1-l1-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Tudo bem. (no Québec)" },
          accept: ["C'est correct.", "C'est correct !"],
          targets: [t("lex:c-est-correct", "recall")],
        },
        {
          id: "ca-u1-l1-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Allô ! Oui, oui, c'est correct.",
          translation: "Oi! Sim, sim, tudo bem.",
          region: "fr-CA",
          targets: [t("lex:c-est-correct", "speaking"), t("lex:allo", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "ca-u1-l2",
      title: { pt: "Déjeuner, dîner, souper", fr: "Déjeuner, dîner, souper" },
      objective: {
        pt: "Entender os nomes das refeições, do fim de semana e das compras no Québec.",
        fr: "Comprendre les repas, la fin de semaine et le magasinage au Québec.",
      },
      minutes: 7,
      steps: [
        {
          id: "ca-u1-l2-t1",
          type: "teach",
          title: { pt: "As refeições no Québec" },
          body: {
            pt: "O Québec guardou os nomes antigos das refeições:\n\n**le déjeuner** — de manhã\n**le dîner** — ao meio-dia\n**le souper** — à noite\n\nNa França os nomes “andaram” uma casa: *le petit-déjeuner*, *le déjeuner* (almoço) e *le dîner* (jantar).",
          },
          examples: [
            { fr: "Je prends mon déjeuner à sept heures.", pt: "Tomo café da manhã às sete." },
            {
              fr: "On se voit pour le dîner à midi ?",
              pt: "A gente se vê no almoço, ao meio-dia?",
            },
            { fr: "Le souper est prêt !", pt: "O jantar está pronto!" },
          ],
          notes: [
            {
              kind: "france",
              text: {
                pt: "Um convite para *dîner* às 19h é jantar na França e seria um almoço muito atrasado no Québec. Na dúvida, confirme o horário!",
              },
            },
          ],
          introduces: ["lex:le-dejeuner-qc", "lex:le-diner-qc", "lex:le-souper"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u1-l2-t2",
          type: "teach",
          title: { pt: "Fim de semana, compras e dépanneur" },
          body: {
            pt: "*La fin de semaine* é o fim de semana (na França, *le week-end*).\n\n*Magasiner* é fazer compras ou passear pelas lojas.\n\n*Le dépanneur* (ou *le dep*) é a lojinha de conveniência do bairro: leite, pão, lanches — e também cerveja e vinho.",
          },
          examples: [
            { fr: "Bonne fin de semaine !", pt: "Bom fim de semana!" },
            { fr: "Je vais magasiner samedi.", pt: "Vou fazer compras no sábado." },
            {
              fr: "Je vais au dépanneur acheter du lait.",
              pt: "Vou à loja de conveniência comprar leite.",
            },
          ],
          introduces: ["lex:la-fin-de-semaine", "lex:magasiner", "lex:un-depanneur"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u1-l2-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { pt: "No Québec, *le dîner* é…" },
          options: ["o almoço", "o jantar", "o café da manhã"],
          optionsLang: "pt",
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Na França, sim! No Québec, o jantar é *le souper*." },
            { pt: "O café da manhã, no Québec, é *le déjeuner*." },
          ],
          targets: [t("lex:le-diner-qc", "recognition")],
        },
        {
          id: "ca-u1-l2-a2",
          type: "match",
          instruction: { pt: "Ligue os pares (como no Québec).", fr: "Associez (au Québec)." },
          pairs: [
            { left: "le déjeuner", right: "o café da manhã" },
            { left: "le dîner", right: "o almoço" },
            { left: "le souper", right: "o jantar" },
            { left: "la fin de semaine", right: "o fim de semana" },
          ],
          targets: [
            t("lex:le-dejeuner-qc", "recognition"),
            t("lex:le-diner-qc", "recognition", 0.5),
            t("lex:le-souper", "recognition"),
            t("lex:la-fin-de-semaine", "recognition"),
          ],
        },
        {
          id: "ca-u1-l2-a3",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "São 22h e você precisa de leite. Aonde você vai?" },
          options: ["au dépanneur", "au souper", "à la fin de semaine"],
          answer: 0,
          targets: [t("lex:un-depanneur", "recognition")],
        },
        {
          id: "ca-u1-l2-a4",
          type: "listening",
          instruction: say.listen,
          context: { pt: "*samedi* = sábado; *dimanche* = domingo; *ma sœur* = minha irmã." },
          lines: [
            {
              speaker: "Julie",
              text: "Qu'est-ce que tu fais en fin de semaine ?",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Marc",
              text: "Samedi, je vais magasiner avec ma sœur. Et dimanche, je soupe chez mes parents.",
              gender: "m",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que o Marc faz no sábado?" },
              options: ["Vai fazer compras", "Vai jantar com os pais", "Vai trabalhar"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "E no domingo?" },
              options: [
                "Janta na casa dos pais",
                "Toma café da manhã com a irmã",
                "Vai ao dépanneur",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:magasiner", "listening"),
            t("lex:la-fin-de-semaine", "listening"),
            t("lex:le-souper", "listening", 0.5),
          ],
        },
        {
          id: "ca-u1-l2-a5",
          type: "fill",
          instruction: say.complete,
          sentence: "On se voit pour le ___ à midi ?",
          blanks: [{ accept: ["dîner", "diner"] }],
          wordBank: ["dîner", "souper", "déjeuner"],
          translation: "A gente se vê no almoço, ao meio-dia? (no Québec)",
          targets: [t("lex:le-diner-qc", "recall")],
        },
        {
          id: "ca-u1-l2-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Bom fim de semana! (no Québec)" },
          accept: ["Bonne fin de semaine !"],
          targets: [t("lex:la-fin-de-semaine", "recall")],
        },
        {
          id: "ca-u1-l2-a7",
          type: "order",
          instruction: say.order,
          tokens: ["Je", "vais", "magasiner", "en", "fin", "de", "semaine."],
          translation: "Vou fazer compras no fim de semana.",
          targets: [t("lex:magasiner", "recall"), t("lex:la-fin-de-semaine", "recall", 0.5)],
        },
        {
          id: "ca-u1-l2-a8",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Le souper est prêt !",
          translation: "O jantar está pronto!",
          region: "fr-CA",
          targets: [t("lex:le-souper", "speaking")],
        },
      ],
    },
  ],
};
