import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitConditionnel: UnitInput = {
  id: "b1-u1",
  level: "B1",
  title: { pt: "Eu gostaria, o senhor poderia", fr: "J'aimerais, pourriez-vous" },
  canDo: {
    pt: "Fazer pedidos formais e expressar desejos com o condicional — por telefone, por e-mail, no guichê.",
    fr: "Faire des demandes polies et exprimer des souhaits au conditionnel.",
  },
  lessons: [
    {
      id: "b1-u1-l1",
      title: { pt: "Pedidos educados", fr: "Les demandes polies" },
      objective: {
        pt: "Formar o condicional e usá-lo em pedidos formais.",
        fr: "Former le conditionnel et faire une demande polie.",
      },
      minutes: 7,
      steps: [
        {
          id: "b1-u1-l1-t1",
          type: "teach",
          title: { pt: "Radical do futuro + -ais" },
          body: {
            pt: "O condicional junta duas coisas que você já sabe: o **radical do futuro** e as **terminações do imparfait**:\n\n*aimer → j'aimer**ais*** · *pouvoir → vous pourr**iez*** · *être → ce ser**ait*** · *avoir → j'aur**ais*** · *vouloir → je voudr**ais***\n\nPara pedir com cortesia: **J'aimerais…** (eu gostaria) · **Pourriez-vous…?** (o senhor poderia…?) · **Ce serait possible de…?** (seria possível…?)",
          },
          examples: [
            { fr: "J'aimerais prendre rendez-vous.", pt: "Eu gostaria de marcar um horário." },
            {
              fr: "Pourriez-vous m'envoyer le formulaire ?",
              pt: "O senhor poderia me enviar o formulário?",
            },
            {
              fr: "Ce serait possible de payer en deux fois ?",
              pt: "Seria possível pagar em duas vezes?",
            },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "No Brasil dizemos “eu queria”, “podia”. Em francês formal, o imperfeito soa estranho num pedido: use *j'aimerais*, *pourriez-vous*.",
              },
            },
          ],
          introduces: ["gram:conditionnel-present", "lex:j-aimerais", "lex:pourriez-vous"],
        },
        {
          id: "b1-u1-l1-a1",
          type: "choice",
          instruction: { pt: "Qual é o pedido mais adequado num e-mail formal?" },
          prompt: { pt: "Você quer que a secretaria envie um documento." },
          options: [
            "Pourriez-vous m'envoyer le document ?",
            "Vous pouviez m'envoyer le document ?",
            "Envoyez-moi le document.",
          ],
          answer: 0,
          optionFeedback: [
            null,
            {
              pt: "O imperfeito (*pouviez*) não serve para pedidos: use o condicional, *pourriez*.",
            },
            { pt: "Correto, mas seco demais para um primeiro contato." },
          ],
          targets: [
            t("lex:pourriez-vous", "recognition"),
            t("gram:conditionnel-present", "recognition"),
          ],
        },
        {
          id: "b1-u1-l1-a2",
          type: "match",
          instruction: say.match,
          leftLang: "fr",
          rightLang: "fr",
          pairs: [
            { left: "aimer", right: "j'aimerais" },
            { left: "pouvoir", right: "je pourrais" },
            { left: "être", right: "ce serait" },
            { left: "avoir", right: "j'aurais" },
          ],
          targets: [t("gram:conditionnel-present", "recognition")],
        },
        {
          id: "b1-u1-l1-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Bonjour, j'___ prendre rendez-vous. Ce ___ possible jeudi ?",
          blanks: [{ accept: ["aimerais"] }, { accept: ["serait"] }],
          translation: "Bom dia, eu gostaria de marcar um horário. Seria possível na quinta?",
          targets: [t("gram:conditionnel-present", "writing"), t("lex:j-aimerais", "recall", 0.5)],
        },
        {
          id: "b1-u1-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "O senhor poderia repetir, por favor?" },
          accept: ["Pourriez-vous répéter, s'il vous plaît ?"],
          targets: [t("lex:pourriez-vous", "recall")],
        },
        {
          id: "b1-u1-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour, j'aimerais prendre rendez-vous. Pourriez-vous me proposer une date ?",
          translation:
            "Bom dia, eu gostaria de marcar um horário. O senhor poderia me propor uma data?",
          targets: [
            t("gram:conditionnel-present", "speaking"),
            t("lex:j-aimerais", "speaking", 0.5),
          ],
        },
      ],
    },
    {
      id: "b1-u1-l2",
      title: { pt: "Desejos e sonhos", fr: "Souhaits et rêves" },
      objective: {
        pt: "Expressar desejos com o condicional.",
        fr: "Exprimer des souhaits.",
      },
      minutes: 6,
      steps: [
        {
          id: "b1-u1-l2-t1",
          type: "teach",
          title: { pt: "J'aimerais, je voudrais, ce serait…" },
          body: {
            pt: "Para desejos e sonhos:\n\n*J'**aimerais** vivre près de la mer.*\n*Je **voudrais** changer de travail.*\n*Ce **serait** génial de parler couramment !*\n\nE com *bien*, fica mais suave: *J'aimerais **bien** visiter Gaspé.*",
          },
          examples: [
            {
              fr: "J'aimerais bien travailler à Québec.",
              pt: "Eu bem que gostaria de trabalhar em Québec.",
            },
            { fr: "Ce serait génial !", pt: "Seria incrível!" },
          ],
          introduces: ["gram:conditionnel-present", "lex:j-aimerais"],
        },
        {
          id: "b1-u1-l2-a1",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Ana",
              text: "Dans cinq ans, j'aimerais avoir ma propre entreprise. Ce serait une petite boulangerie brésilienne à Montréal !",
              gender: "f",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Qual é o sonho de Ana?" },
              options: [
                "Ter uma padaria brasileira em Montréal",
                "Voltar ao Brasil",
                "Trabalhar numa grande empresa",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:j-aimerais", "listening"),
            t("gram:conditionnel-present", "recognition", 0.5),
          ],
        },
        {
          id: "b1-u1-l2-a2",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je aimerais changer de travail.",
          accept: ["J'aimerais changer de travail."],
          explanation: { pt: "Antes de vogal: *j'aimerais*." },
          targets: [t("lex:j-aimerais", "recall")],
        },
        {
          id: "b1-u1-l2-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Seria incrível!" },
          accept: ["Ce serait génial !", "Ce serait super !"],
          targets: [t("gram:conditionnel-present", "writing")],
        },
        {
          id: "b1-u1-l2-a4",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Qu'est-ce que tu aimerais faire dans cinq ans ?",
            audio: { text: "Qu'est-ce que tu aimerais faire dans cinq ans ?", gender: "m" },
          },
          text: "J'aimerais travailler au Canada.",
          accept: [
            "J'aimerais travailler au Canada.",
            "J'aimerais vivre en France.",
            "J'aimerais parler couramment français.",
            "J'aimerais avoir ma propre entreprise.",
          ],
          translation: "Eu gostaria de trabalhar no Canadá. (ou o seu desejo)",
          targets: [
            t("lex:j-aimerais", "speaking"),
            t("gram:conditionnel-present", "speaking", 0.5),
          ],
        },
      ],
    },
  ],
};
