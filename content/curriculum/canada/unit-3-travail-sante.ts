import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitTravailSanteQc: UnitInput = {
  id: "ca-u3",
  level: "A2",
  track: "canada",
  region: "fr-CA",
  title: { pt: "Trabalho e saúde no Québec", fr: "Travail et santé au Québec" },
  canDo: {
    pt: "Procurar emprego e passar por uma entrevista simples, e saber aonde ir quando estiver doente no Québec.",
    fr: "Chercher un emploi, passer une entrevue simple et se soigner au Québec.",
  },
  missionScenario: "scn-entrevue-montreal",
  lessons: [
    {
      id: "ca-u3-l1",
      title: { pt: "Procurar emprego", fr: "Chercher une job" },
      objective: {
        pt: "Entender um anúncio de vaga e os documentos para trabalhar.",
        fr: "Comprendre une offre d'emploi.",
      },
      minutes: 7,
      steps: [
        {
          id: "ca-u3-l1-t1",
          type: "teach",
          title: { pt: "Vagas e currículo" },
          body: {
            pt: "Numa oferta de emprego (*offre d'emploi*), procure: **à temps plein** (tempo integral) ou **à temps partiel** (meio período), o salário (*le salaire*) e como se candidatar: *envoyez votre **CV***.\n\nPara trabalhar no Canadá você precisa do **NAS**, o número de seguro social, pedido ao governo federal (Service Canada).\n\nNa conversa do dia a dia, no Québec, emprego é **une job** — no feminino.",
          },
          examples: [
            {
              fr: "Poste à temps plein, du lundi au vendredi.",
              pt: "Vaga de tempo integral, de segunda a sexta.",
            },
            { fr: "Envoyez votre CV par courriel.", pt: "Envie seu currículo por e-mail." },
            { fr: "J'ai trouvé une nouvelle job !", pt: "Arrumei um emprego novo!" },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec, e-mail é *un courriel*; você vai ver essa palavra em todo anúncio.",
              },
            },
          ],
          introduces: ["lex:un-cv", "lex:temps-plein-partiel", "lex:le-nas", "lex:une-job"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u3-l1-a1",
          type: "reading",
          instruction: { pt: "Leia a vaga e responda.", fr: "Lisez l'offre et répondez." },
          passage: {
            title: "Offre d'emploi — Commis d'épicerie",
            text: "Épicerie du quartier Rosemont cherche un commis à temps partiel (25 heures par semaine). Horaire : soirs et fins de semaine. Français obligatoire, anglais un atout. Envoyez votre CV par courriel avant le 15 mars.",
          },
          questions: [
            {
              prompt: { pt: "A vaga é de…" },
              options: ["meio período", "tempo integral", "fim de semana apenas"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que é obrigatório?" },
              options: ["Falar francês", "Falar inglês", "Ter carro"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:temps-plein-partiel", "recognition"),
            t("lex:un-cv", "recognition", 0.5),
          ],
        },
        {
          id: "ca-u3-l1-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "un CV", right: "um currículo" },
            { left: "à temps plein", right: "em tempo integral" },
            { left: "le NAS", right: "o número de seguro social" },
            { left: "une job", right: "um emprego (informal)" },
          ],
          targets: [
            t("lex:un-cv", "recognition"),
            t("lex:temps-plein-partiel", "recognition"),
            t("lex:le-nas", "recognition"),
            t("lex:une-job", "recognition"),
          ],
        },
        {
          id: "ca-u3-l1-a3",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "O empregador pede o número que todo trabalhador precisa ter no Canadá." },
          options: ["mon NAS", "ma carte d'assurance maladie", "mon CV"],
          answer: 0,
          targets: [t("lex:le-nas", "recognition")],
        },
        {
          id: "ca-u3-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Mandei meu currículo." },
          accept: ["J'ai envoyé mon CV."],
          targets: [t("lex:un-cv", "recall")],
        },
        {
          id: "ca-u3-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Je cherche une job à temps plein.",
          translation: "Procuro um emprego de tempo integral.",
          region: "fr-CA",
          targets: [t("lex:une-job", "speaking"), t("lex:temps-plein-partiel", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "ca-u3-l2",
      title: { pt: "A entrevista", fr: "L'entrevue" },
      objective: {
        pt: "Responder às perguntas básicas de uma entrevista de emprego.",
        fr: "Répondre aux questions d'une entrevue.",
      },
      minutes: 7,
      steps: [
        {
          id: "ca-u3-l2-t1",
          type: "teach",
          title: { pt: "Une entrevue" },
          body: {
            pt: "No Québec, a entrevista de emprego é **une entrevue** (na França, *un entretien d'embauche*). Perguntas frequentes:\n\n*Parlez-moi de vous.* — Fale de você.\n*Quelle est votre expérience ?* — Qual é a sua experiência?\n*Quand pouvez-vous commencer ?* — Quando pode começar?\n\nRespostas curtas e concretas funcionam: *J'ai travaillé cinq ans comme comptable au Brésil.*",
          },
          examples: [
            {
              fr: "J'ai une entrevue lundi à dix heures.",
              pt: "Tenho uma entrevista na segunda às dez.",
            },
            {
              fr: "J'ai travaillé cinq ans dans une banque.",
              pt: "Trabalhei cinco anos num banco.",
            },
            {
              fr: "Je peux commencer la semaine prochaine.",
              pt: "Posso começar na semana que vem.",
            },
          ],
          introduces: ["lex:une-entrevue"],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u3-l2-a1",
          type: "listening",
          instruction: say.listen,
          context: {
            pt: "Uma entrevista para uma vaga de atendimento. *le service à la clientèle* = o atendimento ao cliente.",
          },
          lines: [
            {
              speaker: "Gerente",
              text: "Bonjour, merci d'être venue à l'entrevue. Parlez-moi de vous.",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Bianca",
              text: "Je suis brésilienne, je suis au Québec depuis un an. Au Brésil, j'ai travaillé quatre ans au service à la clientèle.",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Gerente",
              text: "Parfait. Quand pouvez-vous commencer ?",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Bianca",
              text: "Lundi prochain, si vous voulez.",
              gender: "f",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Quanto tempo Bianca trabalhou com atendimento no Brasil?" },
              options: ["Quatro anos", "Um ano", "Catorze anos"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Quando ela pode começar?" },
              options: ["Na próxima segunda", "Amanhã", "Daqui a um mês"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:une-entrevue", "listening", 0.5)],
        },
        {
          id: "ca-u3-l2-a2",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "J'ai une entrevue demain." },
          options: [
            "Tenho uma entrevista de emprego amanhã.",
            "Tenho uma reunião amanhã.",
            "Tenho uma consulta médica amanhã.",
          ],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:une-entrevue", "recognition")],
        },
        {
          id: "ca-u3-l2-a3",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Tenho uma entrevista na segunda. (no Québec)" },
          accept: ["J'ai une entrevue lundi."],
          targets: [t("lex:une-entrevue", "recall")],
        },
        {
          id: "ca-u3-l2-a4",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Quand pouvez-vous commencer ?",
            audio: { text: "Quand pouvez-vous commencer ?", region: "fr-CA", gender: "m" },
          },
          text: "Je peux commencer lundi prochain.",
          accept: [
            "Je peux commencer lundi prochain.",
            "Je peux commencer la semaine prochaine.",
            "Je peux commencer demain.",
            "Je peux commencer tout de suite.",
          ],
          translation: "Posso começar na próxima segunda.",
          region: "fr-CA",
          targets: [t("lex:une-entrevue", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "ca-u3-l3",
      title: { pt: "Quando você está doente", fr: "Quand on est malade" },
      objective: {
        pt: "Saber aonde ir e o que levar quando precisar de atendimento no Québec.",
        fr: "Savoir où aller pour se faire soigner au Québec.",
      },
      minutes: 7,
      steps: [
        {
          id: "ca-u3-l3-t1",
          type: "teach",
          title: { pt: "O sistema de saúde, em francês" },
          body: {
            pt: "**la carte d'assurance maladie** — o cartão do seguro saúde público, emitido pela RAMQ. Muita gente a chama de *carte soleil*.\n**une clinique sans rendez-vous** — clínica que atende sem hora marcada, para problemas sem gravidade.\n**le CLSC** — o posto de saúde do bairro (vacinas, enfermagem, serviços sociais).\n\nPara orientação por telefone, o **811**; emergência, **911**.",
          },
          examples: [
            {
              fr: "Avez-vous votre carte d'assurance maladie ?",
              pt: "O senhor tem o seu cartão do seguro saúde?",
            },
            {
              fr: "Il y a une clinique sans rendez-vous près d'ici ?",
              pt: "Tem uma clínica sem hora marcada aqui perto?",
            },
            { fr: "Les vaccins sont au CLSC.", pt: "As vacinas são no posto de saúde." },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "As regras de cobertura para recém-chegados dependem da sua situação. Este curso ensina a língua — confira sempre no site oficial da RAMQ.",
              },
            },
          ],
          introduces: [
            "lex:la-carte-assurance-maladie",
            "lex:une-clinique-sans-rendez-vous",
            "lex:le-clsc",
          ],
          audioRegion: "fr-CA",
        },
        {
          id: "ca-u3-l3-a1",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "la carte d'assurance maladie", right: "o cartão do seguro saúde" },
            { left: "une clinique sans rendez-vous", right: "uma clínica sem hora marcada" },
            { left: "le CLSC", right: "o posto de saúde do bairro" },
          ],
          targets: [
            t("lex:la-carte-assurance-maladie", "recognition"),
            t("lex:une-clinique-sans-rendez-vous", "recognition"),
            t("lex:le-clsc", "recognition"),
          ],
        },
        {
          id: "ca-u3-l3-a2",
          type: "choice",
          instruction: say.situation,
          prompt: {
            pt: "Você está com dor de garganta há três dias e não tem médico de família. Aonde vai?",
          },
          options: ["à une clinique sans rendez-vous", "au 911", "à la banque"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "O 911 é para emergências." },
            { pt: "Só se for para pagar a consulta…" },
          ],
          targets: [t("lex:une-clinique-sans-rendez-vous", "recognition")],
        },
        {
          id: "ca-u3-l3-a3",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Na recepção de uma clínica em Laval." },
          lines: [
            {
              speaker: "Recepcionista",
              text: "Bonjour ! Avez-vous votre carte d'assurance maladie ?",
              gender: "f",
              region: "fr-CA",
            },
            { speaker: "Paciente", text: "Oui, la voici.", gender: "m", region: "fr-CA" },
            {
              speaker: "Recepcionista",
              text: "Merci. L'attente est d'environ deux heures.",
              gender: "f",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Quanto tempo de espera?" },
              options: ["Umas duas horas", "Dez minutos", "Dois dias"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:la-carte-assurance-maladie", "listening")],
        },
        {
          id: "ca-u3-l3-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "o cartão do seguro saúde (no Québec)" },
          accept: ["la carte d'assurance maladie"],
          targets: [t("lex:la-carte-assurance-maladie", "recall")],
        },
        {
          id: "ca-u3-l3-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour, il y a une clinique sans rendez-vous près d'ici ?",
          translation: "Bom dia, tem uma clínica sem hora marcada aqui perto?",
          region: "fr-CA",
          targets: [t("lex:une-clinique-sans-rendez-vous", "speaking")],
        },
      ],
    },
  ],
};
