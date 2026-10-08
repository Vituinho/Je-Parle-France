import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitSubjonctif: UnitInput = {
  id: "b1-u3",
  level: "B1",
  title: { pt: "É preciso que…", fr: "Il faut que…" },
  canDo: {
    pt: "Dizer o que é preciso que alguém faça e o que você quer que aconteça, com o subjuntivo.",
    fr: "Exprimer la nécessité et la volonté avec le subjonctif.",
  },
  lessons: [
    {
      id: "b1-u3-l1",
      title: { pt: "Il faut que je parte", fr: "Il faut que je parte" },
      objective: {
        pt: "Formar o subjuntivo e usá-lo depois de il faut que.",
        fr: "Former le subjonctif après il faut que.",
      },
      minutes: 7,
      steps: [
        {
          id: "b1-u3-l1-t1",
          type: "teach",
          title: { pt: "Como o nosso “que eu vá”" },
          body: {
            pt: "Depois de **il faut que**, o verbo vai para o **subjuntivo** — como em português: “é preciso que eu **vá**”.\n\nRegular: radical de *ils* no presente + **-e, -es, -e, -ions, -iez, -ent**: *ils part**ent** → que je part**e**, que nous part**ions***.\n\nIrregulares mais usados: *que je **sois*** (être) · *que j'**aie*** (avoir) · *que j'**aille*** (aller) · *que je **fasse*** (faire) · *que je **puisse*** (pouvoir)",
          },
          examples: [
            { fr: "Il faut que je parte à six heures.", pt: "É preciso que eu saia às seis." },
            {
              fr: "Il faut que tu fasses ta demande avant juin.",
              pt: "É preciso que você faça seu pedido antes de junho.",
            },
            {
              fr: "Il faut que nous soyons à l'heure.",
              pt: "É preciso que a gente chegue no horário.",
            },
          ],
          introduces: ["gram:subjonctif-present", "lex:il-faut-que"],
        },
        {
          id: "b1-u3-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Il faut que tu ___ demain." },
          options: ["viennes", "viens", "viendras"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Depois de *il faut que*: subjuntivo, *viennes*." },
            { pt: "Depois de *il faut que*: subjuntivo, não futuro." },
          ],
          targets: [t("gram:subjonctif-present", "recognition")],
        },
        {
          id: "b1-u3-l1-a2",
          type: "match",
          instruction: say.match,
          leftLang: "fr",
          rightLang: "fr",
          pairs: [
            { left: "être", right: "que je sois" },
            { left: "avoir", right: "que j'aie" },
            { left: "aller", right: "que j'aille" },
            { left: "faire", right: "que je fasse" },
          ],
          targets: [t("gram:subjonctif-present", "recognition")],
        },
        {
          id: "b1-u3-l1-a3",
          type: "fill",
          instruction: say.complete,
          sentence: "Il faut que je ___ mes documents et que j'___ à la préfecture.",
          blanks: [{ accept: ["prenne"] }, { accept: ["aille"] }],
          translation: "É preciso que eu pegue meus documentos e vá à préfecture.",
          targets: [t("gram:subjonctif-present", "writing"), t("lex:il-faut-que", "recall", 0.5)],
        },
        {
          id: "b1-u3-l1-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Il faut que tu fais attention.",
          accept: ["Il faut que tu fasses attention."],
          explanation: { pt: "Depois de *il faut que*: *fasses*." },
          targets: [t("gram:subjonctif-present", "writing")],
        },
        {
          id: "b1-u3-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Il faut que je renouvelle mon permis avant la fin du mois.",
          translation: "É preciso que eu renove minha autorização antes do fim do mês.",
          targets: [
            t("lex:il-faut-que", "speaking"),
            t("gram:subjonctif-present", "speaking", 0.5),
          ],
        },
      ],
    },
    {
      id: "b1-u3-l2",
      title: { pt: "Je veux que tu saches", fr: "Je veux que tu saches" },
      objective: {
        pt: "Usar o subjuntivo depois de vontade, emoção e finalidade — e o infinitivo com o mesmo sujeito.",
        fr: "Volonté, émotion, but : subjonctif ou infinitif.",
      },
      minutes: 7,
      steps: [
        {
          id: "b1-u3-l2-t1",
          type: "teach",
          title: { pt: "Quando há dois sujeitos" },
          body: {
            pt: "Subjuntivo também depois de:\n**vontade** — *je veux que*, *j'aimerais que*: *Je veux que mes enfants **parlent** français.*\n**emoção** — *je suis content que*: *Je suis contente que tu **sois** là.*\n**finalidade** — *pour que*: *Je te le dis pour que tu **saches**.*\n\nMas, com **o mesmo sujeito**, use o infinitivo: *Je veux **partir*** (não *je veux que je parte*).",
          },
          examples: [
            {
              fr: "Je veux que mes enfants parlent français.",
              pt: "Quero que meus filhos falem francês.",
            },
            { fr: "Je suis contente que tu sois là.", pt: "Fico feliz que você esteja aqui." },
            { fr: "Je veux partir tôt.", pt: "Quero sair cedo." },
          ],
          introduces: ["gram:subjonctif-present"],
        },
        {
          id: "b1-u3-l2-a1",
          type: "choice",
          instruction: { pt: "Qual frase está correta?" },
          prompt: { pt: "Eu quero sair cedo." },
          options: ["Je veux partir tôt.", "Je veux que je parte tôt.", "Je veux que partir tôt."],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Mesmo sujeito: infinitivo, *je veux partir*." },
            { pt: "Com infinitivo, sem *que*." },
          ],
          targets: [t("gram:subjonctif-present", "recognition")],
        },
        {
          id: "b1-u3-l2-a2",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Je suis content que vous ___ là." },
          options: ["soyez", "êtes", "serez"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Depois de uma emoção + *que*: subjuntivo, *soyez*." },
            { pt: "Subjuntivo: *soyez*." },
          ],
          targets: [t("gram:subjonctif-present", "recognition")],
        },
        {
          id: "b1-u3-l2-a3",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Mãe",
              text: "Je veux que les enfants aillent à l'école en français. Il faut qu'ils puissent parler avec leurs amis !",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que a mãe quer?" },
              options: [
                "Que os filhos estudem em francês",
                "Que os filhos estudem em inglês",
                "Que os filhos voltem ao Brasil",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:subjonctif-present", "recognition"),
            t("lex:il-faut-que", "listening", 0.5),
          ],
        },
        {
          id: "b1-u3-l2-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Quero que meus filhos falem francês." },
          accept: ["Je veux que mes enfants parlent français."],
          targets: [t("gram:subjonctif-present", "writing")],
        },
        {
          id: "b1-u3-l2-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je suis contente que tu sois là, et je veux que tu restes.",
          translation: "Fico feliz que você esteja aqui, e quero que você fique.",
          targets: [t("gram:subjonctif-present", "speaking")],
        },
      ],
    },
  ],
};
