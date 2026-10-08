import type { UnitInput } from "@/lib/content/schema";
import { say, t } from "../../_kit";

export const unitSInstallerFrance: UnitInput = {
  id: "fr-u2",
  level: "A1",
  track: "france",
  region: "fr-FR",
  title: { pt: "Se instalar na França", fr: "S'installer en France" },
  canDo: {
    pt: "Usar o metrô, entender uma convocação da préfecture e ler um anúncio de aluguel.",
    fr: "Prendre le métro, comprendre une convocation de la préfecture et lire une annonce de location.",
  },
  missionScenario: "scn-prefecture",
  lessons: [
    {
      id: "fr-u2-l1",
      title: { pt: "De metrô", fr: "Prendre le métro" },
      objective: {
        pt: "Entender linhas, direções e baldeações, e perguntar onde fica uma estação.",
        fr: "Comprendre lignes, directions et correspondances, et demander son chemin.",
      },
      minutes: 7,
      steps: [
        {
          id: "fr-u2-l1-t1",
          type: "teach",
          title: { pt: "Linha, direção, baldeação" },
          body: {
            pt: "No metrô, cada **ligne** tem um número e duas **directions** — o nome da estação final indica o sentido: *ligne 1, direction Château de Vincennes*.\n\nPara trocar de linha, siga a placa **correspondance**. Para sair, **sortie**. Cada parada é **une station**.",
          },
          examples: [
            {
              fr: "Prenez la ligne 1, direction Château de Vincennes.",
              pt: "Pegue a linha 1, sentido Château de Vincennes.",
            },
            { fr: "Correspondance avec la ligne 5.", pt: "Baldeação com a linha 5." },
            { fr: "Prenez la sortie 2.", pt: "Pegue a saída 2." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "*Correspondance* parece “correspondência”, mas no transporte é a troca de linha. Carta é *une lettre*.",
              },
            },
          ],
          introduces: [
            "lex:le-metro",
            "lex:la-ligne",
            "lex:une-correspondance",
            "lex:la-sortie",
            "lex:une-station",
          ],
        },
        {
          id: "fr-u2-l1-t2",
          type: "teach",
          title: { pt: "Perguntar o caminho" },
          body: {
            pt: "*Où est… ?* pergunta onde fica algo: *Où est la station de métro ?*\n\nPara viajar, você compra **un ticket** ou carrega um passe — na região de Paris, o *passe Navigo*.",
          },
          examples: [
            {
              fr: "Pardon, où est la station de métro ?",
              pt: "Com licença, onde fica a estação de metrô?",
            },
            { fr: "Un ticket, s'il vous plaît.", pt: "Um bilhete, por favor." },
          ],
          introduces: ["lex:ou-est", "lex:un-ticket"],
        },
        {
          id: "fr-u2-l1-a1",
          type: "choice",
          instruction: say.meaning,
          prompt: { pt: "Numa placa do metrô, *direction Château de Vincennes* indica…" },
          options: [
            "o sentido da linha (a estação final)",
            "a saída da estação",
            "a próxima parada",
          ],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:la-ligne", "recognition")],
        },
        {
          id: "fr-u2-l1-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "la sortie", right: "a saída" },
            { left: "la correspondance", right: "a baldeação" },
            { left: "un ticket", right: "um bilhete" },
            { left: "une station", right: "uma estação" },
          ],
          targets: [
            t("lex:la-sortie", "recognition"),
            t("lex:une-correspondance", "recognition"),
            t("lex:un-ticket", "recognition"),
            t("lex:une-station", "recognition"),
          ],
        },
        {
          id: "fr-u2-l1-a3",
          type: "reading",
          instruction: {
            pt: "Leia o itinerário e responda.",
            fr: "Lisez l'itinéraire et répondez.",
          },
          passage: {
            title: "Pour aller à l'université",
            text: "Prenez la ligne 2, direction Gare Centrale. Changez à la station Hôtel de Ville : correspondance avec la ligne 5. Descendez à la station Université. Prenez la sortie 3.",
          },
          questions: [
            {
              prompt: { pt: "Onde você troca de linha?" },
              options: ["Na estação Hôtel de Ville", "Na estação Université", "Na Gare Centrale"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Qual saída você pega?" },
              options: ["A saída 3", "A saída 2", "A saída 5"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:une-correspondance", "recognition"),
            t("lex:la-sortie", "recognition", 0.5),
          ],
        },
        {
          id: "fr-u2-l1-a4",
          type: "listening",
          instruction: say.listen,
          context: {
            pt: "Na rua, em Paris. *tout droit* = em frente; *cent mètres* = cem metros.",
          },
          lines: [
            {
              speaker: "Turista",
              text: "Pardon, monsieur, où est la station de métro ?",
              gender: "f",
            },
            { speaker: "Passante", text: "C'est tout droit, à cent mètres.", gender: "m" },
            { speaker: "Turista", text: "Merci ! Et pour aller à Bastille ?", gender: "f" },
            { speaker: "Passante", text: "Prenez la ligne 1. C'est direct.", gender: "m" },
          ],
          questions: [
            {
              prompt: { pt: "Onde fica a estação?" },
              options: ["Em frente, a 100 metros", "À direita, a 10 metros", "Atrás, a 100 metros"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Ela precisa trocar de linha para ir à Bastille?" },
              options: ["Não, a linha 1 vai direto", "Sim, uma vez", "Sim, duas vezes"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:ou-est", "listening"),
            t("lex:la-ligne", "listening"),
            t("lex:le-metro", "listening", 0.5),
          ],
        },
        {
          id: "fr-u2-l1-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Onde fica a saída?" },
          accept: ["Où est la sortie ?"],
          targets: [t("lex:ou-est", "recall"), t("lex:la-sortie", "recall", 0.5)],
        },
        {
          id: "fr-u2-l1-a6",
          type: "order",
          instruction: say.order,
          tokens: ["Où", "est", "la", "station", "de", "métro ?"],
          translation: "Onde fica a estação de metrô?",
          targets: [t("lex:une-station", "recall"), t("lex:le-metro", "recall", 0.5)],
        },
        {
          id: "fr-u2-l1-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Pardon, où est la station de métro, s'il vous plaît ?",
          translation: "Com licença, onde fica a estação de metrô, por favor?",
          targets: [t("lex:ou-est", "speaking"), t("lex:le-metro", "speaking", 0.5)],
        },
      ],
    },
    {
      id: "fr-u2-l2",
      title: { pt: "A papelada", fr: "Les démarches" },
      objective: {
        pt: "Saber aonde ir e entender os documentos mais pedidos.",
        fr: "Savoir où aller et comprendre les documents les plus demandés.",
      },
      minutes: 7,
      steps: [
        {
          id: "fr-u2-l2-t1",
          type: "teach",
          title: { pt: "Préfecture não é prefeitura" },
          body: {
            pt: "A prefeitura da cidade é **la mairie** (casamento, matrícula escolar, alguns documentos).\n\n**La préfecture** representa o Estado em cada departamento: é ela que cuida do **titre de séjour**, a autorização de residência dos estrangeiros.\n\nPara quase tudo é preciso **un rendez-vous** — um horário marcado, muitas vezes pela internet.",
          },
          examples: [
            { fr: "J'ai rendez-vous à la préfecture.", pt: "Tenho horário marcado na préfecture." },
            {
              fr: "Je renouvelle mon titre de séjour.",
              pt: "Vou renovar minha autorização de residência.",
            },
            { fr: "Le mariage est à la mairie.", pt: "O casamento é na prefeitura." },
          ],
          notes: [
            {
              kind: "brazil",
              text: {
                pt: "*Préfecture* é um falso amigo clássico. Se alguém disser que vai *à la préfecture*, não está indo à prefeitura da cidade.",
              },
            },
          ],
          introduces: [
            "lex:la-prefecture",
            "lex:la-mairie",
            "lex:un-titre-de-sejour",
            "lex:un-rendez-vous",
          ],
        },
        {
          id: "fr-u2-l2-t2",
          type: "teach",
          title: { pt: "Os papéis de sempre" },
          body: {
            pt: "**Un justificatif de domicile** é o comprovante de residência (conta de luz, contrato de aluguel). Muitas vezes pedem um com menos de três meses.\n\n**La carte Vitale** é o cartão do seguro saúde público, a **Sécurité sociale**.",
          },
          examples: [
            {
              fr: "Un justificatif de domicile de moins de trois mois.",
              pt: "Um comprovante de residência com menos de três meses.",
            },
            {
              fr: "Vous avez votre carte Vitale ?",
              pt: "O senhor tem seu cartão do seguro saúde?",
            },
          ],
          notes: [
            {
              kind: "tip",
              text: {
                pt: "Este curso ensina a língua das démarches. Para as regras de cada procedimento, consulte sempre os sites oficiais do governo francês.",
              },
            },
          ],
          introduces: [
            "lex:un-justificatif-de-domicile",
            "lex:la-carte-vitale",
            "lex:la-securite-sociale",
          ],
        },
        {
          id: "fr-u2-l2-a1",
          type: "choice",
          instruction: say.situation,
          prompt: { pt: "Você precisa tratar do seu *titre de séjour*. Aonde vai?" },
          options: ["à la préfecture", "à la mairie", "à la boulangerie"],
          answer: 0,
          optionFeedback: [
            null,
            {
              pt: "*La mairie* é a prefeitura da cidade. O *titre de séjour* é com a *préfecture*.",
            },
            { pt: "Só se for para comprar um croissant antes!" },
          ],
          targets: [t("lex:la-prefecture", "recognition"), t("lex:la-mairie", "recognition", 0.5)],
        },
        {
          id: "fr-u2-l2-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "un titre de séjour", right: "uma autorização de residência" },
            { left: "un justificatif de domicile", right: "um comprovante de residência" },
            { left: "la carte Vitale", right: "o cartão do seguro saúde" },
            { left: "un rendez-vous", right: "um horário marcado" },
          ],
          targets: [
            t("lex:un-titre-de-sejour", "recognition"),
            t("lex:un-justificatif-de-domicile", "recognition"),
            t("lex:la-carte-vitale", "recognition"),
            t("lex:un-rendez-vous", "recognition"),
          ],
        },
        {
          id: "fr-u2-l2-a3",
          type: "reading",
          instruction: { pt: "Leia a mensagem e responda.", fr: "Lisez le message et répondez." },
          passage: {
            title: "Préfecture — confirmation de rendez-vous",
            text: "Madame, vous avez rendez-vous le 14 mars à 9 h 30 pour votre titre de séjour. Apportez votre passeport, un justificatif de domicile de moins de trois mois et trois photos d'identité.",
          },
          questions: [
            {
              prompt: { pt: "Para que é o horário marcado?" },
              options: ["Para o titre de séjour", "Para a carte Vitale", "Para abrir uma conta"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Qual destes documentos ela deve levar?" },
              options: [
                "Um comprovante de residência recente",
                "Um contrato de trabalho",
                "A certidão de nascimento",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:un-rendez-vous", "recognition", 0.5),
            t("lex:un-justificatif-de-domicile", "recognition"),
          ],
        },
        {
          id: "fr-u2-l2-a4",
          type: "listening",
          instruction: say.listen,
          context: { pt: "*demain* = amanhã; *dix heures* = dez horas." },
          lines: [
            { speaker: "Ana", text: "Demain, je vais à la préfecture.", gender: "f" },
            { speaker: "Thomas", text: "Tu as un rendez-vous ?", gender: "m" },
            {
              speaker: "Ana",
              text: "Oui, à dix heures. J'ai mon passeport et mon justificatif de domicile.",
              gender: "f",
            },
          ],
          questions: [
            {
              prompt: { pt: "Aonde a Ana vai amanhã?" },
              options: ["À préfecture", "À prefeitura da cidade", "Ao banco"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "A que horas é o horário dela?" },
              options: ["Às 10h", "Às 2h", "Às 12h"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [t("lex:la-prefecture", "listening"), t("lex:un-rendez-vous", "listening")],
        },
        {
          id: "fr-u2-l2-a5",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Eu tenho um horário marcado." },
          accept: ["J'ai un rendez-vous.", "J'ai rendez-vous."],
          targets: [t("lex:un-rendez-vous", "recall")],
        },
        {
          id: "fr-u2-l2-a6",
          type: "fill",
          instruction: say.complete,
          sentence: "Pour mon titre de séjour, je vais à la ___.",
          blanks: [{ accept: ["préfecture", "prefecture"] }],
          wordBank: ["préfecture", "mairie", "sortie"],
          translation: "Para a minha autorização de residência, vou à préfecture.",
          targets: [t("lex:la-prefecture", "recall"), t("lex:un-titre-de-sejour", "recall", 0.5)],
        },
        {
          id: "fr-u2-l2-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour, j'ai rendez-vous pour mon titre de séjour.",
          translation: "Bom dia, tenho horário marcado para a minha autorização de residência.",
          targets: [
            t("lex:un-rendez-vous", "speaking"),
            t("lex:un-titre-de-sejour", "speaking", 0.5),
          ],
        },
      ],
    },
    {
      id: "fr-u2-l3",
      title: { pt: "Alugar um apartamento", fr: "Louer un logement" },
      objective: {
        pt: "Ler um anúncio de aluguel e entender caução, fiador e despesas.",
        fr: "Lire une annonce et comprendre dépôt de garantie, garant et charges.",
      },
      minutes: 8,
      steps: [
        {
          id: "fr-u2-l3-t1",
          type: "teach",
          title: { pt: "Studio, deux-pièces, meublé" },
          body: {
            pt: "Na França, os apartamentos são contados em **pièces** — sala e quartos, sem contar cozinha e banheiro:\n\n**un studio** — um cômodo só (quitinete)\n**un deux-pièces** (ou *T2*) — sala e um quarto\n\n**Meublé** = mobiliado. **Charges comprises** = as despesas do prédio já estão incluídas no **loyer** (o aluguel).",
          },
          examples: [
            { fr: "Je cherche un studio meublé.", pt: "Procuro uma quitinete mobiliada." },
            {
              fr: "Un deux-pièces à 900 euros charges comprises.",
              pt: "Um apartamento de sala e quarto por 900 euros com as despesas incluídas.",
            },
          ],
          notes: [
            {
              kind: "quebec",
              text: {
                pt: "No Québec, cozinha e banheiro entram na conta: um *4 ½* de Montréal corresponde mais ou menos a um *T3* francês.",
              },
            },
          ],
          introduces: [
            "lex:un-studio",
            "lex:un-deux-pieces",
            "lex:meuble",
            "lex:charges-comprises",
            "lex:le-loyer",
          ],
        },
        {
          id: "fr-u2-l3-t2",
          type: "teach",
          title: { pt: "Caução e fiador" },
          body: {
            pt: "**Le dépôt de garantie** é o caução, devolvido no fim do contrato. Para um imóvel vazio, ele é de no máximo um mês de aluguel sem as despesas.\n\n**Un garant** é o fiador: alguém que paga se você não pagar. Muitos proprietários pedem. Quem não tem fiador na França pode pedir a garantia pública *Visale*.",
          },
          examples: [
            { fr: "Le dépôt de garantie est d'un mois.", pt: "O caução é de um mês." },
            { fr: "Il faut un garant.", pt: "É preciso um fiador." },
          ],
          introduces: ["lex:le-depot-de-garantie", "lex:un-garant"],
        },
        {
          id: "fr-u2-l3-a1",
          type: "reading",
          instruction: { pt: "Leia o anúncio e responda.", fr: "Lisez l'annonce et répondez." },
          passage: {
            title: "Location — Lyon 7e",
            text: "Studio meublé de 25 m², 4e étage avec ascenseur. Loyer : 620 € charges comprises. Dépôt de garantie : 1 200 €. Garant demandé. Disponible tout de suite.",
          },
          questions: [
            {
              prompt: { pt: "O apartamento é mobiliado?" },
              options: ["Sim", "Não", "O anúncio não diz"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Os 620 € incluem as despesas do prédio?" },
              options: ["Sim", "Não, as despesas são à parte", "Só a eletricidade"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "O que o proprietário pede?" },
              options: ["Um fiador", "Uma carta do empregador", "Nada"],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:meuble", "recognition"),
            t("lex:charges-comprises", "recognition"),
            t("lex:un-garant", "recognition"),
          ],
        },
        {
          id: "fr-u2-l3-a2",
          type: "match",
          instruction: say.match,
          pairs: [
            { left: "un studio", right: "uma quitinete" },
            { left: "un deux-pièces", right: "um apartamento de sala e quarto" },
            { left: "le dépôt de garantie", right: "o caução" },
            { left: "un garant", right: "um fiador" },
          ],
          targets: [
            t("lex:un-studio", "recognition"),
            t("lex:un-deux-pieces", "recognition"),
            t("lex:le-depot-de-garantie", "recognition"),
            t("lex:un-garant", "recognition", 0.5),
          ],
        },
        {
          id: "fr-u2-l3-a3",
          type: "choice",
          instruction: say.meaning,
          prompt: { fr: "Le loyer est de 700 euros par mois." },
          options: [
            "O aluguel é de 700 euros por mês.",
            "O caução é de 700 euros.",
            "O fiador paga 700 euros.",
          ],
          optionsLang: "pt",
          answer: 0,
          targets: [t("lex:le-loyer", "recognition")],
        },
        {
          id: "fr-u2-l3-a4",
          type: "listening",
          instruction: say.listen,
          context: { pt: "Numa imobiliária. *neuf cents* = 900; *soixante* = 60." },
          lines: [
            {
              speaker: "Corretor",
              text: "Le deux-pièces est à neuf cents euros par mois.",
              gender: "m",
            },
            { speaker: "Estudante", text: "Charges comprises ?", gender: "f" },
            {
              speaker: "Corretor",
              text: "Non, plus soixante euros de charges. Et il faut un garant.",
              gender: "m",
            },
            { speaker: "Estudante", text: "Je n'ai pas de garant en France…", gender: "f" },
            {
              speaker: "Corretor",
              text: "Vous pouvez demander la garantie Visale.",
              gender: "m",
            },
          ],
          questions: [
            {
              prompt: { pt: "Quanto ela pagaria por mês, no total?" },
              options: ["960 euros", "900 euros", "840 euros"],
              optionsLang: "pt",
              answer: 0,
            },
            {
              prompt: { pt: "Qual é o problema dela?" },
              options: [
                "Ela não tem fiador na França",
                "Ela não tem dinheiro para o caução",
                "O apartamento não tem móveis",
              ],
              optionsLang: "pt",
              answer: 0,
            },
          ],
          targets: [
            t("lex:un-deux-pieces", "listening"),
            t("lex:charges-comprises", "listening"),
            t("lex:un-garant", "listening"),
          ],
        },
        {
          id: "fr-u2-l3-a5",
          type: "fill",
          instruction: say.complete,
          sentence: "Le loyer est de 700 euros, charges ___.",
          blanks: [{ accept: ["comprises"] }],
          wordBank: ["comprises", "garant", "meublé"],
          translation: "O aluguel é de 700 euros, com as despesas incluídas.",
          targets: [t("lex:charges-comprises", "recall")],
        },
        {
          id: "fr-u2-l3-a6",
          type: "type",
          instruction: say.write,
          prompt: { pt: "Procuro uma quitinete mobiliada." },
          accept: ["Je cherche un studio meublé."],
          targets: [t("lex:un-studio", "recall"), t("lex:meuble", "recall")],
        },
        {
          id: "fr-u2-l3-a7",
          type: "speak",
          mode: "repeat",
          instruction: say.repeat,
          text: "Bonjour, je cherche un deux-pièces, charges comprises.",
          translation:
            "Bom dia, procuro um apartamento de sala e quarto, com as despesas incluídas.",
          targets: [
            t("lex:un-deux-pieces", "speaking"),
            t("lex:charges-comprises", "speaking", 0.5),
          ],
        },
      ],
    },
  ],
};
