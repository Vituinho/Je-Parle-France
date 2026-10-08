import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitPasseAvoir: UnitInput = {
  id: "a2-u1",
  level: "A2",
  title: { pt: "O que você fez?", fr: "Qu'est-ce que tu as fait ?" },
  canDo: {
    pt: "Contar o que você fez ontem, no fim de semana ou há alguns dias, com o passé composé e avoir.",
    fr: "Raconter ce que vous avez fait hier ou le week-end dernier.",
  },
  missionScenario: "scn-weekend-recap",
  lessons: [
    {
      id: "a2-u1-l1",
      title: { pt: "J'ai parlé", fr: "J'ai parlé" },
      objective: {
        pt: "Formar o passé composé dos verbos em -er.",
        fr: "Former le passé composé des verbes en -er.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u1-l1-t1",
          type: "teach",
          title: { pt: "Falei = j'ai parlé" },
          body: {
            pt: "Para contar o que aconteceu, o francês falado usa um passado **composto**: **avoir** no presente + **particípio**.\n\n*j'ai parlé* · *tu as parlé* · *il a parlé*\n*nous avons parlé* · *vous avez parlé* · *ils ont parlé*\n\nVerbos em **-er** → particípio em **-é**: *parler → parlé*, *manger → mangé*, *travailler → travaillé*.",
          },
          examples: [
            { fr: "J'ai parlé avec mon chef.", pt: "Falei com o meu chefe." },
            { fr: "Tu as mangé ?", pt: "Você comeu?" },
            {
              fr: "Nous avons travaillé tout le week-end.",
              pt: "Trabalhamos o fim de semana todo.",
            },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "O passado simples dos livros (*je parlai*) não é usado na conversa. Para falar do passado, *j'ai parlé*.",
              },
            },
          ],
          introduces: ["gram:passe-compose-avoir"],
        },
        {
          id: "a2-u1-l1-t2",
          type: "teach",
          title: { pt: "Quando?" },
          body: {
            pt: "Marcadores de passado:\n\n**hier** — ontem\n**la semaine dernière** — a semana passada\n**il y a** + duração — há… atrás: *il y a deux jours* (há dois dias)",
          },
          examples: [
            {
              fr: "Hier, j'ai travaillé jusqu'à vingt heures.",
              pt: "Ontem trabalhei até as oito da noite.",
            },
            {
              fr: "La semaine dernière, nous avons visité Québec.",
              pt: "Semana passada visitamos Québec.",
            },
            { fr: "J'ai commencé il y a trois mois.", pt: "Comecei há três meses." },
          ],
          introduces: ["lex:hier", "lex:la-semaine-derniere", "lex:il-y-a-duree"],
        },
        {
          id: "a2-u1-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Hier, nous ___ mangé au restaurant." },
          options: ["avons", "sommes", "ont", "avez"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Manger* faz o passado com *avoir*: *nous avons mangé*." },
            { pt: "*ont* é para *ils / elles*." },
            { pt: "*avez* é para *vous*." },
          ],
          targets: [t("gram:passe-compose-avoir", "recognition")],
        },
        {
          id: "a2-u1-l1-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "hier", right: "ontem" },
            { left: "la semaine dernière", right: "a semana passada" },
            { left: "il y a deux jours", right: "há dois dias" },
          ],
          targets: [
            t("lex:hier", "recognition"),
            t("lex:la-semaine-derniere", "recognition"),
            t("lex:il-y-a-duree", "recognition"),
          ],
        },
        {
          id: "a2-u1-l1-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Hier, j'___ travaillé et ma sœur ___ parlé avec ses enfants.",
          blanks: [{ accept: ["ai"] }, { accept: ["a"] }],
          translation: "Ontem trabalhei e minha irmã falou com os filhos dela.",
          targets: [t("gram:passe-compose-avoir", "writing")],
        },
        {
          id: "a2-u1-l1-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Hier, je parle avec le propriétaire.",
          accept: ["Hier, j'ai parlé avec le propriétaire."],
          explanation: { pt: "Para o passado: *j'ai parlé*." },
          targets: [t("gram:passe-compose-avoir", "writing")],
        },
        {
          id: "a2-u1-l1-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Ontem comi no restaurante." },
          accept: ["Hier, j'ai mangé au restaurant.", "Hier j'ai mangé au restaurant."],
          targets: [t("gram:passe-compose-avoir", "writing"), t("lex:hier", "recall", 0.5)],
        },
        {
          id: "a2-u1-l1-a6",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Hier, j'ai travaillé et j'ai mangé avec des amis.",
          translation: "Ontem trabalhei e comi com amigos.",
          targets: [t("gram:passe-compose-avoir", "speaking")],
        },
      ],
    },
    {
      id: "a2-u1-l2",
      title: { pt: "J'ai fait, j'ai pris", fr: "J'ai fait, j'ai pris" },
      objective: {
        pt: "Usar os particípios irregulares mais comuns.",
        fr: "Utiliser les participes irréguliers courants.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u1-l2-t1",
          type: "teach",
          title: { pt: "Os irregulares do dia a dia" },
          body: {
            pt: "*faire → j'ai **fait*** · *prendre → j'ai **pris***\n*avoir → j'ai **eu*** (/y/) · *être → j'ai **été***\n*voir → j'ai **vu*** · *boire → j'ai **bu***\n*lire → j'ai **lu*** · *écrire → j'ai **écrit***\n\nNa negação, *ne… pas* abraça o *avoir*: *je **n'**ai **pas** vu le film*.",
          },
          examples: [
            { fr: "Tu as fait les courses ?", pt: "Você fez as compras?" },
            { fr: "J'ai pris le métro.", pt: "Peguei o metrô." },
            { fr: "Il a eu un accident.", pt: "Ele sofreu um acidente." },
            { fr: "Je n'ai pas vu le film.", pt: "Não vi o filme." },
          ],
          introduces: ["gram:passe-compose-avoir"],
        },
        {
          id: "a2-u1-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "J'ai ___ le bus ce matin." },
          options: ["pris", "prendu", "prené", "prendre"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "O particípio de *prendre* é *pris*." },
            { pt: "Só os verbos em *-er* fazem *-é*. *Prendre → pris*." },
            { pt: "Depois de *avoir*, o particípio: *pris*." },
          ],
          targets: [t("gram:passe-compose-avoir", "recognition")],
        },
        {
          id: "a2-u1-l2-a2",
          type: "match",
          instruction: say.match,
          leftLang: "fr",
          rightLang: "fr",
          pairs: [
            { left: "faire", right: "fait" },
            { left: "voir", right: "vu" },
            { left: "boire", right: "bu" },
            { left: "avoir", right: "eu" },
            { left: "être", right: "été" },
          ],
          targets: [t("gram:passe-compose-avoir", "recognition")],
        },
        {
          id: "a2-u1-l2-a3",
          type: "fill",
          instruction: { pt: "Passe para a negativa.", fr: "Mettez à la forme négative." },
          sentence: "Je ___ ai ___ vu le message.",
          blanks: [{ accept: ["n'"] }, { accept: ["pas"] }],
          translation: "Não vi a mensagem.",
          targets: [
            t("gram:passe-compose-avoir", "writing"),
            t("gram:negation-ne-pas", "writing", 0.5),
          ],
        },
        {
          id: "a2-u1-l2-a4",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Segunda de manhã no trabalho." },
          lines: [
            { speaker: "Colega", text: "Tu as fait quoi ce week-end ?", gender: "f" },
            {
              speaker: "Pedro",
              text: "Samedi, j'ai fait les courses et j'ai lu un peu. Dimanche, j'ai vu un film avec des amis.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que Pedro fez no domingo?" },
              options: ["Viu um filme com amigos", "Fez as compras", "Leu um livro"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:passe-compose-avoir", "recognition")],
        },
        {
          id: "a2-u1-l2-a5",
          type: "error_correction",
          instruction: say.fix,
          sentence: "J'ai prendu un café.",
          accept: ["J'ai pris un café."],
          explanation: { pt: "*Prendre → pris*." },
          targets: [t("gram:passe-compose-avoir", "writing")],
        },
        {
          id: "a2-u1-l2-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Você fez as compras? (informal)" },
          accept: ["Tu as fait les courses ?"],
          targets: [t("gram:passe-compose-avoir", "writing")],
        },
        {
          id: "a2-u1-l2-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Ce week-end, j'ai fait du sport et j'ai vu un film.",
          translation: "Neste fim de semana fiz exercício e vi um filme.",
          targets: [t("gram:passe-compose-avoir", "speaking")],
        },
      ],
    },
    {
      id: "a2-u1-l3",
      title: { pt: "Contar o fim de semana", fr: "Raconter son week-end" },
      objective: {
        pt: "Contar uma sequência de fatos no passado.",
        fr: "Raconter une suite d'événements au passé.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u1-l3-t1",
          type: "teach",
          title: { pt: "Uma história curta" },
          body: {
            pt: "Para contar em ordem, junte o passé composé com os conectores que você já conhece — *d'abord, ensuite, puis, enfin* — e um marcador de tempo:\n\n*Samedi, **d'abord** j'ai fait les courses. **Ensuite**, j'ai préparé le dîner. **Enfin**, nous avons regardé un film.*",
          },
          examples: [
            {
              fr: "D'abord, j'ai pris un café. Ensuite, j'ai lu le journal.",
              pt: "Primeiro tomei um café. Depois li o jornal.",
            },
            {
              fr: "Il y a deux jours, j'ai eu un entretien.",
              pt: "Há dois dias tive uma entrevista.",
            },
          ],
          introduces: ["gram:passe-compose-avoir", "lex:il-y-a-duree"],
        },
        {
          id: "a2-u1-l3-a1",
          type: "reading",
          instruction: { pt: "Leia o e-mail e responda.", fr: "Lisez le courriel et répondez." },
          passage: {
            title: "Courriel à Julie",
            text: "Salut Julie ! La semaine dernière, j'ai commencé mon nouveau travail. Lundi, j'ai rencontré mes collègues. Mercredi, j'ai eu ma première réunion en français : j'ai tout compris ! Vendredi soir, nous avons mangé au restaurant pour fêter ça. À bientôt, Ana",
          },
          questions: [
            {
              prompt: { pt: "O que Ana fez na quarta?" },
              options: [
                "Teve a primeira reunião em francês",
                "Conheceu os colegas",
                "Jantou num restaurante",
              ],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Quando ela começou o novo trabalho?" },
              options: ["Na semana passada", "Ontem", "Há um mês"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:passe-compose-avoir", "recognition"),
            t("lex:la-semaine-derniere", "recognition", 0.5),
          ],
        },
        {
          id: "a2-u1-l3-a2",
          type: "order",
          instruction: say.order,
          tokens: ["Il", "y", "a", "deux", "jours,", "j'ai", "eu", "un", "entretien."],
          translation: "Há dois dias tive uma entrevista.",
          targets: [t("lex:il-y-a-duree", "recall"), t("gram:passe-compose-avoir", "writing", 0.5)],
        },
        {
          id: "a2-u1-l3-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Semana passada visitei Québec." },
          accept: [
            "La semaine dernière, j'ai visité Québec.",
            "La semaine dernière j'ai visité Québec.",
          ],
          targets: [
            t("lex:la-semaine-derniere", "recall"),
            t("gram:passe-compose-avoir", "writing", 0.5),
          ],
        },
        {
          id: "a2-u1-l3-a4",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Qu'est-ce que tu as fait hier ?",
            audio: { text: "Qu'est-ce que tu as fait hier ?", gender: "f" },
          },
          text: "Hier, j'ai travaillé et j'ai fait les courses.",
          accept: [
            "Hier, j'ai travaillé.",
            "Hier, j'ai fait les courses.",
            "Hier, j'ai travaillé et j'ai fait les courses.",
            "Hier, j'ai vu un film.",
            "Hier, j'ai étudié le français.",
          ],
          translation: "Ontem trabalhei e fiz as compras. (ou o que você fez)",
          targets: [t("gram:passe-compose-avoir", "speaking"), t("lex:hier", "speaking", 0.5)],
        },
      ],
    },
  ],
};
