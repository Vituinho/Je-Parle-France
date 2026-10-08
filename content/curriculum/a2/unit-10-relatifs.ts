import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitRelatifs: UnitInput = {
  id: "a2-u10",
  level: "A2",
  title: { pt: "Qui, que, où", fr: "Qui, que, où" },
  canDo: {
    pt: "Ligar frases e dar detalhes sobre pessoas, coisas, lugares e momentos sem repetir palavras.",
    fr: "Relier des phrases avec qui, que et où.",
  },
  lessons: [
    {
      id: "a2-u10-l1",
      title: { pt: "Qui ou que?", fr: "Qui ou que ?" },
      objective: {
        pt: "Escolher entre qui (sujeito) e que (objeto).",
        fr: "Choisir entre qui et que.",
      },
      minutes: 7,
      steps: [
        {
          id: "a2-u10-l1-t1",
          type: "teach",
          title: { pt: "O “que” português se divide em dois" },
          body: {
            pt: "Olhe o que vem **depois**:\n\n**qui** + **verbo** (é o sujeito): *J'ai un ami **qui habite** à Lyon.*\n**que** + **sujeito** (é o objeto): *C'est le livre **que je** lis.* Antes de vogal: **qu'** — *le film **qu'il** préfère*.\n\nEm português é tudo “que”: “um amigo **que** mora”, “o livro **que** eu leio”.",
          },
          examples: [
            {
              fr: "La femme qui parle est ma professeure.",
              pt: "A mulher que está falando é minha professora.",
            },
            { fr: "Le film que j'ai vu était super.", pt: "O filme que eu vi era ótimo." },
            {
              fr: "La ville qu'elle préfère, c'est Québec.",
              pt: "A cidade que ela prefere é Québec.",
            },
          ],
          introduces: ["gram:qui-que"],
        },
        {
          id: "a2-u10-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "J'ai un collègue ___ parle portugais." },
          options: ["qui", "que", "où"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Depois vem o verbo (*parle*): *qui*." },
            { pt: "*où* é para lugar ou tempo." },
          ],
          targets: [t("gram:qui-que", "recognition")],
        },
        {
          id: "a2-u10-l1-a2",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "C'est la chanson ___ j'adore." },
          options: ["que", "qui", "où"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Depois vem um sujeito (*j'*): *que*." },
            { pt: "Não é lugar nem tempo." },
          ],
          targets: [t("gram:qui-que", "recognition")],
        },
        {
          id: "a2-u10-l1-a3",
          type: "fill",
          instruction: say.complete,
          sentence:
            "L'appartement ___ j'ai visité est près du métro, et le propriétaire ___ habite en bas est sympa.",
          blanks: [{ accept: ["que"] }, { accept: ["qui"] }],
          translation:
            "O apartamento que visitei fica perto do metrô, e o proprietário que mora embaixo é simpático.",
          targets: [t("gram:qui-que", "writing")],
        },
        {
          id: "a2-u10-l1-a4",
          type: "error_correction",
          instruction: say.fix,
          sentence: "L'homme que habite ici est médecin.",
          accept: ["L'homme qui habite ici est médecin."],
          explanation: { pt: "Depois vem o verbo (*habite*): *qui*." },
          targets: [t("gram:qui-que", "writing")],
        },
        {
          id: "a2-u10-l1-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "J'ai une amie qui habite à Montréal et que je vois souvent.",
          translation: "Tenho uma amiga que mora em Montréal e que eu vejo com frequência.",
          targets: [t("gram:qui-que", "speaking")],
        },
      ],
    },
    {
      id: "a2-u10-l2",
      title: { pt: "Où: onde e em que", fr: "Où" },
      objective: {
        pt: "Usar où para lugares e momentos.",
        fr: "Utiliser où pour le lieu et le temps.",
      },
      minutes: 6,
      steps: [
        {
          id: "a2-u10-l2-t1",
          type: "teach",
          title: { pt: "Lugar e momento" },
          body: {
            pt: "**où** retoma um **lugar**: *Le quartier **où** j'habite est calme.*\n\nE também um **momento**, onde o português diz “em que”: *Le jour **où** je suis arrivé, il neigeait.* (No dia **em que** cheguei, estava nevando.)\n\nNunca *le jour que* — sempre *le jour où*.",
          },
          examples: [
            {
              fr: "C'est le café où on s'est rencontrés.",
              pt: "É o café onde a gente se conheceu.",
            },
            {
              fr: "L'année où je suis arrivé, il a beaucoup neigé.",
              pt: "No ano em que cheguei, nevou muito.",
            },
          ],
          introduces: ["gram:relatif-ou"],
        },
        {
          id: "a2-u10-l2-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Le jour ___ je suis arrivé, il neigeait." },
          options: ["où", "que", "qui"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "“O dia **em que**”: em francês, *où*." },
            { pt: "Depois vem um sujeito (*je*), e é um momento: *où*." },
          ],
          targets: [t("gram:relatif-ou", "recognition")],
        },
        {
          id: "a2-u10-l2-a2",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je me souviens du jour que je suis arrivée.",
          accept: ["Je me souviens du jour où je suis arrivée."],
          explanation: { pt: "Para momento (“em que”): *où*." },
          targets: [t("gram:relatif-ou", "writing")],
        },
        {
          id: "a2-u10-l2-a3",
          type: "reading",
          instruction: { pt: "Leia e responda.", fr: "Lisez et répondez." },
          passage: {
            title: "Mon quartier",
            text: "J'habite à Villeray, un quartier où il y a beaucoup de familles. Il y a un parc où les enfants jouent tous les jours et un marché que j'adore. La voisine qui habite à côté vient du Portugal : on parle portugais ensemble !",
          },
          questions: [
            {
              prompt: { pt: "Onde as crianças brincam?" },
              options: ["Num parque", "No mercado", "Na rua"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "De onde vem a vizinha?" },
              options: ["De Portugal", "Do Brasil", "Do Québec"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("gram:relatif-ou", "recognition"), t("gram:qui-que", "recognition", 0.5)],
        },
        {
          id: "a2-u10-l2-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "É o bairro onde eu moro." },
          accept: ["C'est le quartier où j'habite."],
          targets: [t("gram:relatif-ou", "writing")],
        },
        {
          id: "a2-u10-l2-a5",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "C'est la ville où j'habite et le quartier que je préfère.",
          translation: "É a cidade onde moro e o bairro que eu prefiro.",
          targets: [t("gram:relatif-ou", "speaking"), t("gram:qui-que", "speaking", 0.5)],
        },
      ],
    },
  ],
};
