import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitTravailSanteFr: UnitInput = {
  id: "fr-u3",
  level: "A2",
  track: "france",
  region: "fr-FR",
  title: { pt: "Trabalho, saúde e auxílios na França", fr: "Travail, santé et aides en France" },
  canDo: {
    pt: "Procurar emprego e entender um contrato, ter um médico de família e saber o que são a mutuelle e a CAF.",
    fr: "Chercher un emploi, comprendre son contrat, se soigner et connaître la CAF.",
  },
  missionScenario: "scn-entretien-paris",
  lessons: [
    {
      id: "fr-u3-l1",
      title: { pt: "Procurar emprego", fr: "Chercher un emploi" },
      objective: {
        pt: "Conhecer France Travail, o CV e a entrevista de emprego na França.",
        fr: "Chercher un emploi en France.",
      },
      minutes: 7,
      steps: [
        {
          id: "fr-u3-l1-t1",
          type: "teach",
          title: { pt: "Emprego na França" },
          body: {
            pt: "**France Travail** — o serviço público de emprego (até 2023, *Pôle emploi*): vagas, inscrição como candidato, orientação.\n**un CV** — o currículo. Na França, ele costuma ter uma página e vem com uma *lettre de motivation* (carta de apresentação).\n**un entretien d'embauche** — a entrevista de emprego.",
          },
          examples: [
            {
              fr: "Je suis inscrite à France Travail.",
              pt: "Estou inscrita no serviço público de emprego.",
            },
            {
              fr: "J'ai envoyé mon CV et une lettre de motivation.",
              pt: "Mandei meu currículo e uma carta de apresentação.",
            },
            {
              fr: "J'ai un entretien d'embauche jeudi.",
              pt: "Tenho uma entrevista de emprego na quinta.",
            },
          ],
          introduces: ["lex:france-travail", "lex:un-cv", "lex:un-entretien-d-embauche"],
        },
        {
          id: "fr-u3-l1-a1",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "un CV", right: "um currículo" },
            { left: "un entretien d'embauche", right: "uma entrevista de emprego" },
            { left: "France Travail", right: "o serviço público de emprego" },
          ],
          targets: [
            t("lex:un-cv", "recognition"),
            t("lex:un-entretien-d-embauche", "recognition"),
            t("lex:france-travail", "recognition"),
          ],
        },
        {
          id: "fr-u3-l1-a2",
          type: "listening",
          instruction: say.listen,
          lines: [
            { speaker: "Amiga", text: "Alors, tu as trouvé du travail ?", gender: "f" },
            {
              speaker: "Lucas",
              text: "Pas encore, mais j'ai un entretien d'embauche lundi. J'ai trouvé l'offre sur le site de France Travail.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "Onde Lucas encontrou a vaga?" },
              options: ["No site de France Travail", "Num jornal", "Com um amigo"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Quando é a entrevista?" },
              options: ["Na segunda", "Na quinta", "Hoje"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:un-entretien-d-embauche", "listening"),
            t("lex:france-travail", "listening"),
          ],
        },
        {
          id: "fr-u3-l1-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Tenho uma entrevista de emprego na quinta. (na França)" },
          accept: ["J'ai un entretien d'embauche jeudi."],
          targets: [t("lex:un-entretien-d-embauche", "recall")],
        },
        {
          id: "fr-u3-l1-a4",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "J'ai envoyé mon CV et j'ai un entretien d'embauche lundi.",
          translation: "Mandei meu currículo e tenho uma entrevista de emprego na segunda.",
          targets: [t("lex:un-entretien-d-embauche", "speaking"), t("lex:un-cv", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "fr-u3-l2",
      title: { pt: "O contrato", fr: "Le contrat" },
      objective: {
        pt: "Entender CDI e CDD e por que isso importa.",
        fr: "Comprendre CDI et CDD.",
      },
      minutes: 6,
      steps: [
        {
          id: "fr-u3-l2-t1",
          type: "teach",
          title: { pt: "CDI ou CDD?" },
          body: {
            pt: "**un CDI** — *contrat à durée indéterminée*: contrato sem data de fim.\n**un CDD** — *contrat à durée déterminée*: contrato com data de fim (seis meses, um ano…).\n\nNa França, o CDI pesa muito: proprietários e bancos costumam pedir. Ouve-se muito: *J'ai enfin signé un CDI !*",
          },
          examples: [
            { fr: "C'est un CDD de six mois.", pt: "É um contrato de seis meses." },
            { fr: "J'ai signé un CDI !", pt: "Assinei um contrato por tempo indeterminado!" },
          ],
          introduces: ["lex:un-cdi-cdd"],
        },
        {
          id: "fr-u3-l2-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "C'est un CDD d'un an." },
          options: [
            "É um contrato de um ano, com data de fim.",
            "É um contrato sem data de fim.",
            "É um estágio sem salário.",
          ],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:un-cdi-cdd", "recognition")],
        },
        {
          id: "fr-u3-l2-a2",
          type: "reading",
          instruction: { pt: "Leia a mensagem e responda.", fr: "Lisez et répondez." },
          passage: {
            title: "Message de Paula",
            text: "Bonne nouvelle : après deux CDD de six mois, mon entreprise m'a proposé un CDI ! Maintenant, je peux enfin chercher un appartement plus grand.",
          },
          questions: [
            {
              prompt: { pt: "Por que Paula está feliz?" },
              options: [
                "Ganhou um contrato por tempo indeterminado",
                "Mudou de empresa",
                "Terminou o contrato",
              ],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que ela vai fazer agora?" },
              options: [
                "Procurar um apartamento maior",
                "Voltar ao Brasil",
                "Procurar outro emprego",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:un-cdi-cdd", "recognition")],
        },
        {
          id: "fr-u3-l2-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Assinei um contrato por tempo indeterminado. (use a sigla)" },
          accept: ["J'ai signé un CDI."],
          targets: [t("lex:un-cdi-cdd", "recall")],
        },
        {
          id: "fr-u3-l2-a4",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "J'ai signé un CDI !",
          translation: "Assinei um contrato por tempo indeterminado!",
          targets: [t("lex:un-cdi-cdd", "speaking")],
        },
      ],
    },
    {
      id: "fr-u3-l3",
      title: { pt: "Saúde e auxílios", fr: "Santé et aides" },
      objective: {
        pt: "Entender médecin traitant, mutuelle e CAF.",
        fr: "Comprendre médecin traitant, mutuelle et CAF.",
      },
      minutes: 7,
      steps: [
        {
          id: "fr-u3-l3-t1",
          type: "teach",
          title: { pt: "Três palavras da vida prática" },
          body: {
            pt: "**le médecin traitant** — o médico de família que você declara à Sécurité sociale; é o primeiro a consultar.\n**une mutuelle** — o plano complementar que reembolsa a parte que a Sécurité sociale não paga.\n**la CAF** — *caisse d'allocations familiales*: é a ela que se pede o auxílio-moradia (*APL*).",
          },
          examples: [
            { fr: "Vous avez un médecin traitant ?", pt: "O senhor tem médico de família?" },
            {
              fr: "La mutuelle rembourse le reste.",
              pt: "O plano complementar reembolsa o resto.",
            },
            { fr: "J'ai fait une demande à la CAF.", pt: "Fiz um pedido na CAF." },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Direitos e valores dependem da sua situação. Este curso ensina a língua — confira sempre nos sites oficiais (ameli.fr, caf.fr).",
              },
            },
          ],
          introduces: ["lex:le-medecin-traitant", "lex:une-mutuelle", "lex:la-caf"],
        },
        {
          id: "fr-u3-l3-a1",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "le médecin traitant", right: "o médico de família" },
            { left: "une mutuelle", right: "um plano de saúde complementar" },
            { left: "la CAF", right: "o órgão dos auxílios familiares e de moradia" },
          ],
          targets: [
            t("lex:le-medecin-traitant", "recognition"),
            t("lex:une-mutuelle", "recognition"),
            t("lex:la-caf", "recognition"),
          ],
        },
        {
          id: "fr-u3-l3-a2",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "Você quer pedir o auxílio-moradia (APL). A quem?" },
          options: ["à la CAF", "à la mutuelle", "au médecin traitant"],
          answer: 0,
          targets: [t("lex:la-caf", "recognition")],
        },
        {
          id: "fr-u3-l3-a3",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Na recepção de um consultório." },
          lines: [
            {
              speaker: "Secretária",
              text: "C'est votre première visite ? Vous avez un médecin traitant ?",
              gender: "f",
            },
            {
              speaker: "Paciente",
              text: "Non, pas encore. Je viens d'arriver en France.",
              gender: "m",
            },
            {
              speaker: "Secretária",
              text: "Le docteur Martin peut devenir votre médecin traitant, si vous voulez.",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "O que a secretária propõe?" },
              options: [
                "Que o doutor Martin seja o médico de família dele",
                "Que ele procure outro consultório",
                "Que ele contrate uma mutuelle",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:le-medecin-traitant", "listening")],
        },
        {
          id: "fr-u3-l3-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "um plano de saúde complementar (na França)" },
          accept: ["une mutuelle"],
          targets: [t("lex:une-mutuelle", "recall")],
        },
        {
          id: "fr-u3-l3-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je n'ai pas encore de médecin traitant.",
          translation: "Ainda não tenho médico de família.",
          targets: [t("lex:le-medecin-traitant", "speaking")],
        },
      ],
    },
  ],
};
