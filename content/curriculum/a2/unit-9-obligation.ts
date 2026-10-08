import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitObligation: UnitInput = {
  id: "a2-u9",
  level: "A2",
  title: { pt: "É preciso, tem que, deveria", fr: "Il faut, devoir" },
  canDo: {
    pt: "Entender regras e instruções, dizer o que você tem que fazer e dar conselhos com gentileza.",
    fr: "Exprimer l'obligation et donner un conseil.",
  },
  lessons: [
    {
      id: "a2-u9-l1",
      title: { pt: "Il faut", fr: "Il faut" },
      objective: {
        pt: "Usar il faut e entender il ne faut pas.",
        fr: "Utiliser il faut.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u9-l1-t1",
          type: "teach",
          title: { pt: "“É preciso”" },
          body: {
            pt: "**il faut** + infinitivo ou nome — impessoal, sempre com *il*:\n*Il faut réserver.* (É preciso reservar.) · *Il faut un passeport.* (É preciso passaporte.)\n\n**il ne faut pas** = não se deve, não pode: *Il ne faut pas fumer ici.*\n\nPara “não precisa”, diga **pas besoin** ou **ce n'est pas nécessaire**: *Pas besoin de réserver.*",
          },
          examples: [
            {
              fr: "Pour ouvrir un compte, il faut une pièce d'identité.",
              pt: "Para abrir uma conta, é preciso um documento.",
            },
            {
              fr: "Il ne faut pas oublier ton passeport.",
              pt: "Não pode esquecer o seu passaporte.",
            },
            {
              fr: "Pas besoin de réserver, il y a de la place.",
              pt: "Não precisa reservar, tem lugar.",
            },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "*Il ne faut pas* não é “não precisa” — é “não pode”. Confundir os dois dá mal-entendidos!",
              },
            },
          ],
          introduces: ["gram:il-faut-devoir", "lex:pas-besoin"],
        },
        {
          id: "a2-u9-l1-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "Il ne faut pas manger dans le métro." },
          options: [
            "Não se pode comer no metrô.",
            "Não precisa comer no metrô.",
            "É preciso comer no metrô.",
          ],
          optionsLang: "pt",
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*Il ne faut pas* é proibição. “Não precisa” seria *pas besoin*." },
            null,
          ],
          targets: [t("gram:il-faut-devoir", "recognition")],
        },
        {
          id: "a2-u9-l1-a2",
          type: "choice",
          instruction: { pt: "Como dizer “Não precisa reservar”?" },
          prompt: { pt: "O restaurante está vazio." },
          options: ["Pas besoin de réserver.", "Il ne faut pas réserver.", "Il faut réserver."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Isso proibiria reservar. “Não precisa” é *pas besoin*." },
            { pt: "Isso é “é preciso reservar”." },
          ],
          targets: [t("lex:pas-besoin", "recognition")],
        },
        {
          id: "a2-u9-l1-a3",
          type: "reading",
          instruction: { pt: "Leia o aviso e responda.", fr: "Lisez et répondez." },
          passage: {
            title: "Piscine municipale — règlement",
            text: "Il faut prendre une douche avant d'entrer dans l'eau. Il faut un bonnet de bain. Il ne faut pas courir autour de la piscine. Pas besoin de réserver le samedi matin.",
          },
          questions: [
            {
              prompt: { pt: "O que é proibido?" },
              options: ["Correr em volta da piscina", "Tomar banho antes", "Usar touca"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "No sábado de manhã…" },
              options: ["não precisa reservar", "é preciso reservar", "a piscina fecha"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:il-faut-devoir", "recognition"),
            t("lex:pas-besoin", "recognition", 0.5),
          ],
        },
        {
          id: "a2-u9-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "É preciso um passaporte." },
          accept: ["Il faut un passeport."],
          targets: [t("gram:il-faut-devoir", "writing")],
        },
        {
          id: "a2-u9-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Il faut réserver ? — Non, pas besoin.",
          translation: "Precisa reservar? — Não, não precisa.",
          targets: [t("gram:il-faut-devoir", "speaking"), t("lex:pas-besoin", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "a2-u9-l2",
      title: { pt: "Je dois, tu devrais", fr: "Je dois, tu devrais" },
      objective: {
        pt: "Dizer o que você tem que fazer e aconselhar.",
        fr: "Exprimer une obligation personnelle et conseiller.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u9-l2-t1",
          type: "teach",
          title: { pt: "Ter que e deveria" },
          body: {
            pt: "**devoir** (ter que) — irregular:\n*je dois · tu dois · il doit · nous devons · vous devez · ils doivent* + infinitivo\n*Je dois partir.* (Tenho que ir.)\n\nPara aconselhar com gentileza: **tu devrais / vous devriez** + infinitivo — *Vous devriez prendre rendez-vous.* (O senhor deveria marcar uma consulta.)",
          },
          examples: [
            { fr: "Je dois travailler samedi.", pt: "Tenho que trabalhar no sábado." },
            { fr: "Tu devrais te reposer.", pt: "Você deveria descansar." },
            {
              fr: "Vous devriez parler à votre propriétaire.",
              pt: "O senhor deveria falar com o seu proprietário.",
            },
          ],
          introduces: ["gram:il-faut-devoir"],
        },
        {
          id: "a2-u9-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Nous ___ partir à six heures." },
          options: ["devons", "doivent", "devez", "faut"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "*doivent* é para *ils / elles*." },
            { pt: "*devez* é para *vous*." },
            { pt: "*Faut* só existe com *il*: *il faut partir*." },
          ],
          targets: [t("gram:il-faut-devoir", "recognition")],
        },
        {
          id: "a2-u9-l2-a2",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je faut partir maintenant.",
          accept: ["Je dois partir maintenant.", "Il faut partir maintenant."],
          explanation: { pt: "*Falloir* só com *il*. Para você: *je dois*." },
          targets: [t("gram:il-faut-devoir", "writing")],
        },
        {
          id: "a2-u9-l2-a3",
          type: "listening",
          instruction: say.listen,
          lines: [
            { speaker: "Paciente", text: "J'ai mal au dos depuis deux semaines.", gender: "f" },
            {
              speaker: "Farmacêutico",
              text: "Vous devriez voir un médecin. Et vous ne devez pas porter de choses lourdes.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que o farmacêutico aconselha?" },
              options: [
                "Ir ao médico e não carregar peso",
                "Fazer exercício",
                "Tomar um remédio forte",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:il-faut-devoir", "recognition")],
        },
        {
          id: "a2-u9-l2-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Você deveria descansar. (informal)" },
          accept: ["Tu devrais te reposer."],
          targets: [t("gram:il-faut-devoir", "writing")],
        },
        {
          id: "a2-u9-l2-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je dois travailler demain, mais tu devrais venir avec nous.",
          translation: "Tenho que trabalhar amanhã, mas você deveria vir com a gente.",
          targets: [t("gram:il-faut-devoir", "speaking")],
        },
      ],
    },
  ],
};
