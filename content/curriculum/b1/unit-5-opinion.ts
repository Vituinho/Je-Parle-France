import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitOpinion: UnitInput = {
  id: "b1-u5",
  level: "B1",
  title: { pt: "Dar a sua opinião", fr: "Donner son avis" },
  canDo: {
    pt: "Dar e justificar uma opinião, concordar e discordar, pesar prós e contras — como numa prova oral de B1.",
    fr: "Donner et justifier son opinion, peser le pour et le contre.",
  },
  missionScenario: "scn-debat",
  lessons: [
    {
      id: "b1-u5-l1",
      title: { pt: "Je pense que…", fr: "Je pense que…" },
      objective: {
        pt: "Dar opinião com indicativo e subjuntivo.",
        fr: "Exprimer son opinion.",
      },
      minutes: 9,
      steps: [
        {
          id: "b1-u5-l1-t1",
          type: "teach",
          title: { pt: "Acho que é × não acho que seja" },
          body: {
            pt: "**Afirmativo** → indicativo: *Je pense que c'**est** une bonne idée.* · **À mon avis**, … · *Je trouve que…*\n**Negativo ou dúvida** → subjuntivo: *Je ne pense pas que ce **soit** une bonne idée.* · *Je doute que…*\n\nIgual ao português: “acho que **é**” × “não acho que **seja**”.",
          },
          examples: [
            {
              fr: "À mon avis, Montréal est plus agréable que Toronto.",
              pt: "Na minha opinião, Montréal é mais agradável que Toronto.",
            },
            {
              fr: "Je trouve que le loyer est trop cher.",
              pt: "Acho que o aluguel está caro demais.",
            },
            { fr: "Je ne pense pas que ce soit trop tard.", pt: "Não acho que seja tarde demais." },
          ],
          introduces: ["gram:exprimer-opinion", "lex:a-mon-avis"],
        },
        {
          id: "b1-u5-l1-a1",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Je ne pense pas que ce ___ une bonne idée." },
          options: ["soit", "est", "sera"],
          answer: 0,
          optionFeedback: [
            null,
            { pt: "Opinião negativa: subjuntivo, *soit*." },
            { pt: "Opinião negativa: subjuntivo, *soit*." },
          ],
          targets: [t("gram:exprimer-opinion", "recognition")],
        },
        {
          id: "b1-u5-l1-a2",
          type: "choice",
          instruction: say.complete,
          prompt: { fr: "Je pense que c'___ vrai." },
          options: ["est", "soit"],
          answer: 0,
          optionFeedback: [null, { pt: "Opinião afirmativa: indicativo, *c'est*." }],
          targets: [t("gram:exprimer-opinion", "recognition")],
        },
        {
          id: "b1-u5-l1-a3",
          type: "error_correction",
          instruction: say.fix,
          sentence: "Je ne pense pas que c'est possible.",
          accept: ["Je ne pense pas que ce soit possible."],
          explanation: { pt: "Opinião negativa: subjuntivo." },
          targets: [t("gram:exprimer-opinion", "writing")],
        },
        {
          id: "b1-u5-l1-a4",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Na minha opinião, é uma boa ideia." },
          accept: ["À mon avis, c'est une bonne idée."],
          targets: [t("lex:a-mon-avis", "recall"), t("gram:exprimer-opinion", "writing", 0.5)],
        },
        {
          id: "b1-u5-l1-a5",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Tu penses qu'il est difficile d'apprendre le français ?",
            audio: { text: "Tu penses qu'il est difficile d'apprendre le français ?", gender: "f" },
          },
          text: "Je pense que c'est difficile, mais c'est possible.",
          accept: [
            "Je pense que c'est difficile, mais c'est possible.",
            "Je ne pense pas que ce soit très difficile.",
            "À mon avis, c'est difficile au début.",
          ],
          translation: "Acho que é difícil, mas é possível. (ou a sua opinião)",
          targets: [t("gram:exprimer-opinion", "speaking"), t("lex:a-mon-avis", "speaking", 0.5)],
        },
        {
          id: "b1-u5-l1-a6",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Ana",
              text: "J'aimerais suivre un cours de conversation après le travail, trois soirs par semaine. À mon avis, ce serait une bonne façon de progresser plus vite.",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Marc",
              text: "Parler souvent est utile, mais je ne pense pas que ce soit une bonne idée de rentrer très tard trois fois par semaine. L'an dernier, j'étais tellement fatigué que j'ai arrêté mes cours.",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Ana",
              text: "Tu trouves donc que les cours sont inutiles ?",
              gender: "f",
              region: "fr-CA",
            },
            {
              speaker: "Marc",
              text: "Non, je pense que les cours peuvent vraiment nous aider. Je voudrais commencer par un soir par semaine, puis ajouter un autre soir si nous avons le temps.",
              gender: "m",
              region: "fr-CA",
            },
            {
              speaker: "Ana",
              text: "D'accord. Je vais choisir le cours du mardi pour commencer, et on verra après un mois.",
              gender: "f",
              region: "fr-CA",
            },
          ],
          questions: [
            {
              prompt: { pt: "Com qual parte da proposta Marc discorda?" },
              options: [
                "Da frequência de três noites após o trabalho",
                "Da utilidade de conversar em francês",
                "Da ideia de estudar com Ana",
              ],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Por que Marc menciona o curso do ano passado?" },
              options: [
                "Para mostrar que já fala francês fluentemente",
                "Para explicar seu receio de desistir por cansaço",
                "Para recomendar a mesma escola",
              ],
              optionsLang: "pt",
              answer: 1,
            },
            {
              prompt: { pt: "O que Ana decide ao final?" },
              options: [
                "Abandonar os cursos de conversa",
                "Ir três noites desde a primeira semana",
                "Começar às terças e avaliar depois de um mês",
              ],
              optionsLang: "pt",
              answer: 2,
            },
          ],
          targets: [t("lex:a-mon-avis", "listening"), t("gram:exprimer-opinion", "recognition", 0.5)],
        },
      ],
    },
    {
      id: "b1-u5-l2",
      title: { pt: "Prós e contras", fr: "Le pour et le contre" },
      objective: {
        pt: "Argumentar com conectores: por um lado, em compensação, no entanto.",
        fr: "Argumenter avec des connecteurs.",
      },
      minutes: 9,
      steps: [
        {
          id: "b1-u5-l2-t1",
          type: "teach",
          title: { pt: "Conectores de argumentação" },
          body: {
            pt: "**d'un côté… de l'autre** — por um lado… por outro\n**par contre / en revanche** — em compensação, já\n**pourtant** — no entanto, mesmo assim\n**donc** — portanto\n\n*D'un côté, le loyer est élevé ; **de l'autre**, le quartier est très calme. **Donc**, je pense que ça vaut la peine.*",
          },
          examples: [
            {
              fr: "Le salaire est bas ; par contre, l'ambiance est super.",
              pt: "O salário é baixo; em compensação, o ambiente é ótimo.",
            },
            {
              fr: "Il a beaucoup étudié, pourtant il a raté l'examen.",
              pt: "Ele estudou muito; no entanto, foi reprovado.",
            },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Nas provas orais (TEF, TCF, DELF B1), estruturar a resposta com esses conectores faz muita diferença.",
              },
            },
          ],
          introduces: ["gram:exprimer-opinion", "lex:par-contre", "lex:pourtant"],
        },
        {
          id: "b1-u5-l2-a1",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "par contre", right: "em compensação" },
            { left: "pourtant", right: "no entanto" },
            { left: "à mon avis", right: "na minha opinião" },
          ],
          targets: [
            t("lex:par-contre", "recognition"),
            t("lex:pourtant", "recognition"),
            t("lex:a-mon-avis", "recognition"),
          ],
        },
        {
          id: "b1-u5-l2-a2",
          type: "reading",
          instruction: { pt: "Leia a opinião e responda.", fr: "Lisez et répondez." },
          passage: {
            title: "Vivre en banlieue ?",
            text: "D'un côté, vivre en banlieue coûte moins cher et c'est plus calme. De l'autre, on perd beaucoup de temps dans les transports. Pourtant, beaucoup de familles choisissent la banlieue. À mon avis, c'est une bonne solution quand on a des enfants ; par contre, pour un étudiant, le centre-ville est plus pratique.",
          },
          questions: [
            {
              prompt: { pt: "Qual é a desvantagem de morar no subúrbio, segundo o texto?" },
              options: ["Perde-se muito tempo no transporte", "É mais caro", "É mais barulhento"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Para quem o autor recomenda o centro?" },
              options: ["Para estudantes", "Para famílias com filhos", "Para aposentados"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("gram:exprimer-opinion", "recognition"),
            t("lex:par-contre", "recognition", 0.5),
          ],
        },
        {
          id: "b1-u5-l2-a3",
          type: "fill",
          instruction: say.complete,
          sentence:
            "Le loyer est cher ; ___ contre, l'appartement est grand. ___, je vais le prendre.",
          blanks: [{ accept: ["par"] }, { accept: ["Donc", "donc"] }],
          wordBank: ["par", "Donc", "Pourtant"],
          translation:
            "O aluguel é caro; em compensação, o apartamento é grande. Portanto, vou ficar com ele.",
          targets: [t("lex:par-contre", "recall"), t("gram:exprimer-opinion", "writing", 0.5)],
        },
        {
          id: "b1-u5-l2-a4",
          type: "speak",
          mode: "respond",
          instruction: say.answer,
          prompt: {
            fr: "Selon vous, c'est mieux d'habiter en ville ou à la campagne ?",
            audio: {
              text: "Selon vous, c'est mieux d'habiter en ville ou à la campagne ?",
              gender: "m",
            },
          },
          text: "D'un côté, la ville est pratique ; de l'autre, la campagne est plus calme. À mon avis, la ville est mieux pour travailler.",
          accept: [
            "À mon avis, c'est mieux d'habiter en ville.",
            "À mon avis, c'est mieux d'habiter à la campagne.",
            "D'un côté, la ville est pratique ; de l'autre, la campagne est plus calme.",
          ],
          translation:
            "Por um lado, a cidade é prática; por outro, o campo é mais tranquilo. Na minha opinião, a cidade é melhor para trabalhar.",
          targets: [t("gram:exprimer-opinion", "speaking")],
        },
        {
          id: "b1-u5-l2-a5",
          type: "listening",
          instruction: say.listen,
          lines: [
            {
              speaker: "Camille",
              text: "D'un côté, travailler à la maison me permet d'éviter les transports. De l'autre, je vois moins mes collègues. À mon avis, on devrait venir au bureau deux jours par semaine.",
              gender: "f",
              region: "fr-FR",
            },
            {
              speaker: "Nicolas",
              text: "Pourtant, moi, j'ai besoin de voir l'équipe tous les jours pour demander de l'aide. Et à la maison, il y a beaucoup de bruit.",
              gender: "m",
              region: "fr-FR",
            },
            {
              speaker: "Camille",
              text: "C'est vrai ; par contre, certains collègues habitent loin. Pourquoi ne pas garder le bureau ouvert toute la semaine, avec deux journées où tout le monde doit venir ? Les autres jours, chacun pourrait choisir.",
              gender: "f",
              region: "fr-FR",
            },
            {
              speaker: "Nicolas",
              text: "D'accord. Comme ça, je pourrais venir chaque jour, et on garderait deux journées pour travailler ensemble.",
              gender: "m",
              region: "fr-FR",
            },
          ],
          questions: [
            {
              prompt: { pt: "Qual dificuldade Nicolas apresenta ao argumento de Camille?" },
              options: [
                "Ele mora mais longe que todos os colegas",
                "Ele precisa de ajuda da equipe e sua casa é barulhenta",
                "Ele não gosta de trabalhar com os colegas",
              ],
              optionsLang: "pt",
              answer: 1,
            },
            {
              prompt: { pt: "Qual é o compromisso aceito ao final?" },
              options: [
                "Fechar o escritório nos outros três dias",
                "Exigir que todos venham todos os dias",
                "Ter dois dias comuns e permitir a escolha nos demais",
              ],
              optionsLang: "pt",
              answer: 2,
            },
            {
              prompt: { pt: "Por que a proposta final atende à preocupação de Nicolas?" },
              options: [
                "Ele pode continuar no escritório diariamente",
                "Sua casa ficará mais silenciosa",
                "Ele deixará de precisar de ajuda",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:par-contre", "listening"), t("lex:pourtant", "listening", 0.5)],
        },
      ],
    },
  ],
};
