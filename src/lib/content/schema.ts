import { z } from "zod";
import { CEFR_LEVELS } from "@/lib/learning/cefr";
import { DIMENSIONS, SKILLS } from "@/lib/learning/skills";

/**
 * Course content schemas. Content in `content/` is authored against the *input*
 * types (defaults optional) and consumed through the *output* types.
 *
 * IDs are permanent once shipped: learner state references them.
 */

// ─── Primitives ────────────────────────────────────────────────────────────

const text = z.string().trim().min(1);

/** Content IDs: lowercase slug segments separated by "-" or ".", e.g. "a0-u1-l2". */
export const contentIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/, "IDs must be lowercase slugs (a-z, 0-9, '-', '.')");

/** Concept IDs are namespaced: lex:, gram:, pron:, cult:. */
export const conceptIdSchema = z
  .string()
  .regex(
    /^(lex|gram|pron|cult):[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Concept IDs look like lex:bonjour, gram:etre-present, pron:y-vs-u, cult:bise",
  );

export const levelSchema = z.enum(CEFR_LEVELS);
export const skillSchema = z.enum(SKILLS);
export const dimensionSchema = z.enum(DIMENSIONS);

/** Text shown to the learner. `pt` is always required (A0 support); `fr` enables the transition. */
export const localizedSchema = z.object({ pt: text, fr: text.optional() });

export const REGIONS = ["intl", "fr-FR", "fr-CA", "fr-BE", "fr-CH", "fr-AF"] as const;
export const regionSchema = z.enum(REGIONS);

/** Voices we can synthesise or have recorded. */
export const VOICE_REGIONS = ["fr-FR", "fr-CA"] as const;
export const voiceRegionSchema = z.enum(VOICE_REGIONS);

export const audioSchema = z.object({
  text,
  region: voiceRegionSchema.default("fr-FR"),
  gender: z.enum(["f", "m"]).default("f"),
  rate: z.enum(["slow", "normal"]).default("normal"),
  /** Pre-recorded audio URL. When absent the text is synthesised. */
  src: z.string().optional(),
});

export const exampleSchema = z.object({ fr: text, pt: text });

/** A context-specific valid wording, with an explanation for the learner. */
export const acceptableTextAlternativeSchema = z.object({
  text,
  explanation: localizedSchema,
});

export const noteSchema = z.object({
  kind: z.enum(["brazil", "quebec", "france", "culture", "tip", "register"]),
  text: localizedSchema,
});

export const targetSchema = z.object({
  concept: conceptIdSchema,
  dimension: dimensionSchema,
  /** How strongly this activity evidences the concept × dimension (0–1). */
  weight: z.number().min(0).max(1).default(1),
});

/** A prompt may be French, Portuguese, audio, or a combination. */
export const promptSchema = z
  .object({
    fr: text.optional(),
    pt: text.optional(),
    audio: audioSchema.optional(),
    /** For listening items: hide the French text until the answer is checked. */
    hideText: z.boolean().default(false),
  })
  .refine((p) => p.fr || p.pt || p.audio, "A prompt needs fr, pt or audio");

const optionLang = z.enum(["fr", "pt"]).default("fr");

// ─── Activities ────────────────────────────────────────────────────────────

const activityBase = {
  id: contentIdSchema,
  /** Concept × dimension evidence produced by this activity. */
  targets: z.array(targetSchema).default([]),
  instruction: localizedSchema.optional(),
  hint: localizedSchema.optional(),
  /** Shown after the answer is checked. */
  explanation: localizedSchema.optional(),
};

export const teachActivitySchema = z.object({
  id: contentIdSchema,
  type: z.literal("teach"),
  title: localizedSchema,
  body: localizedSchema,
  examples: z.array(exampleSchema).default([]),
  notes: z.array(noteSchema).default([]),
  /** Concepts presented by this card (creates "introduced" traces). */
  introduces: z.array(conceptIdSchema).default([]),
  audioRegion: voiceRegionSchema.default("fr-FR"),
});

export const choiceActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("choice"),
    prompt: promptSchema,
    options: z.array(text).min(2).max(6),
    optionsLang: optionLang,
    answer: z.number().int().min(0),
    /** Optional targeted feedback per option (diagnostic distractors). */
    optionFeedback: z.array(localizedSchema.nullable()).optional(),
  })
  .refine((a) => a.answer < a.options.length, "answer index out of range")
  .refine(
    (a) => !a.optionFeedback || a.optionFeedback.length === a.options.length,
    "optionFeedback must have one entry per option",
  );

export const multiSelectActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("multi_select"),
    prompt: promptSchema,
    options: z.array(text).min(3).max(8),
    optionsLang: optionLang,
    answers: z.array(z.number().int().min(0)).min(1),
  })
  .refine((a) => a.answers.every((i) => i < a.options.length), "answer index out of range");

export const matchActivitySchema = z.object({
  ...activityBase,
  type: z.literal("match"),
  pairs: z
    .array(z.object({ left: text, right: text }))
    .min(3)
    .max(6),
  leftLang: optionLang,
  rightLang: z.enum(["fr", "pt"]).default("pt"),
});

export const orderActivitySchema = z.object({
  ...activityBase,
  type: z.literal("order"),
  /** Tokens in the correct order. */
  tokens: z.array(text).min(2),
  distractors: z.array(text).default([]),
  /** Other accepted orders, as token sequences. */
  alternatives: z.array(z.array(text)).default([]),
  translation: text.optional(),
  audio: z.boolean().default(true),
});

export const BLANK = "___";

export const fillActivitySchema = z
  .object({
    ...activityBase,
    type: z.literal("fill"),
    /** French sentence with one `___` per blank. */
    sentence: text,
    blanks: z
      .array(
        z.object({
          accept: z.array(text).min(1),
          alternatives: z.array(acceptableTextAlternativeSchema).default([]),
        }),
      )
      .min(1),
    wordBank: z.array(text).optional(),
    translation: text.optional(),
  })
  .refine(
    (a) => a.sentence.split(BLANK).length - 1 === a.blanks.length,
    "number of ___ must equal number of blanks",
  );

export const typeActivitySchema = z.object({
  ...activityBase,
  type: z.literal("type"),
  prompt: promptSchema,
  /** Accepted French answers. The first one is shown as the model answer. */
  accept: z.array(text).min(1),
  /** Explicitly authored equivalent wording; omitted for grammar/register tests. */
  alternatives: z.array(acceptableTextAlternativeSchema).default([]),
});

export const dictationActivitySchema = z.object({
  ...activityBase,
  type: z.literal("dictation"),
  audio: audioSchema,
  accept: z.array(text).min(1),
  translation: text.optional(),
});

export const speakActivitySchema = z.object({
  ...activityBase,
  type: z.literal("speak"),
  /** repeat: hear then say · read: read the text aloud · respond: answer the prompt freely. */
  mode: z.enum(["repeat", "read", "respond"]),
  /** Target utterance (repeat/read) or model answer (respond). */
  text,
  prompt: promptSchema.optional(),
  /** Acceptable answers for `respond` (compared with the transcript when STT is available). */
  accept: z.array(text).default([]),
  region: voiceRegionSchema.default("fr-FR"),
  translation: text.optional(),
});

export const minimalPairActivitySchema = z.object({
  ...activityBase,
  type: z.literal("minimal_pair"),
  pair: z.tuple([
    z.object({ word: text, ipa: text, pt: text.optional() }),
    z.object({ word: text, ipa: text, pt: text.optional() }),
  ]),
  /** Which word of the pair is played. */
  answer: z.union([z.literal(0), z.literal(1)]),
  region: voiceRegionSchema.default("fr-FR"),
});

export const comprehensionQuestionSchema = z
  .object({
    prompt: z
      .object({ fr: text.optional(), pt: text.optional() })
      .refine((p) => p.fr || p.pt, "A question needs fr or pt"),
    options: z.array(text).min(2).max(5),
    optionsLang: optionLang,
    answer: z.number().int().min(0),
  })
  .refine((q) => q.answer < q.options.length, "answer index out of range");

export const readingActivitySchema = z.object({
  ...activityBase,
  type: z.literal("reading"),
  passage: z.object({ title: text.optional(), text }),
  questions: z.array(comprehensionQuestionSchema).min(1),
});

export const dialogueLineSchema = z.object({
  speaker: text,
  text,
  gender: z.enum(["f", "m"]).default("f"),
  region: voiceRegionSchema.default("fr-FR"),
});

export const listeningActivitySchema = z.object({
  ...activityBase,
  type: z.literal("listening"),
  lines: z.array(dialogueLineSchema).min(1),
  questions: z.array(comprehensionQuestionSchema).min(1),
  context: localizedSchema.optional(),
});

export const errorCorrectionActivitySchema = z.object({
  ...activityBase,
  type: z.literal("error_correction"),
  /** Sentence containing an error. */
  sentence: text,
  accept: z.array(text).min(1),
});

export const openWritingActivitySchema = z.object({
  ...activityBase,
  type: z.literal("open_writing"),
  prompt: localizedSchema,
  minWords: z.number().int().min(1),
  modelAnswer: text,
  /** Rubric focus points, in Portuguese. */
  focus: z.array(text).min(1),
  /** Explicit reviewed task requirements; absent rubrics are never AI-graded. */
  rubric: z
    .object({
      version: z.literal(1),
      expectedLevel: levelSchema,
      taskRequirements: z.array(text).min(2).max(6),
    })
    .optional(),
});

export const selfAssessActivitySchema = z.object({
  ...activityBase,
  type: z.literal("self_assess"),
  statement: localizedSchema,
});

export const activitySchema = z.discriminatedUnion("type", [
  teachActivitySchema,
  choiceActivitySchema,
  multiSelectActivitySchema,
  matchActivitySchema,
  orderActivitySchema,
  fillActivitySchema,
  typeActivitySchema,
  dictationActivitySchema,
  speakActivitySchema,
  minimalPairActivitySchema,
  readingActivitySchema,
  listeningActivitySchema,
  errorCorrectionActivitySchema,
  openWritingActivitySchema,
  selfAssessActivitySchema,
]);

// ─── Concepts ──────────────────────────────────────────────────────────────

const conceptBase = {
  id: conceptIdSchema,
  level: levelSchema,
  prerequisites: z.array(conceptIdSchema).default([]),
  tags: z.array(text).default([]),
  region: regionSchema.default("intl"),
  /** Override of the default dimensions tracked for this concept kind. */
  dimensions: z.array(dimensionSchema).optional(),
};

export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "determiner",
  "conjunction",
  "number",
  "interjection",
  "expression",
] as const;

export const lexicalConceptSchema = z.object({
  ...conceptBase,
  kind: z.literal("lexical"),
  french: text,
  pos: z.enum(PARTS_OF_SPEECH),
  gender: z.enum(["m", "f", "mf"]).optional(),
  plural: text.optional(),
  ipa: text.optional(),
  /** Contextual meaning in Brazilian Portuguese. */
  meaning: text,
  /** Accepted written forms when recalling the concept (defaults to the French form). */
  forms: z.array(text).optional(),
  register: z.enum(["formal", "neutral", "informal"]).default("neutral"),
  examples: z.array(exampleSchema).default([]),
  verb: z
    .object({
      auxiliary: z.enum(["avoir", "être"]),
      participle: text,
      /** Présent: je, tu, il/elle, nous, vous, ils/elles. */
      present: z.array(text).length(6).optional(),
    })
    .optional(),
  falseFriend: z.object({ looksLike: text, warning: text }).optional(),
  notes: z.array(noteSchema).default([]),
});

export const grammarConceptSchema = z.object({
  ...conceptBase,
  kind: z.literal("grammar"),
  title: localizedSchema,
  summary: localizedSchema,
  /** Paragraphs; light formatting with **bold** is allowed. */
  explanation: z.object({ pt: z.array(text).min(1), fr: z.array(text).optional() }),
  brazilianNote: text.optional(),
  examples: z.array(exampleSchema).min(1),
  commonMistakes: z.array(z.object({ wrong: text, right: text, why: text })).default([]),
  notes: z.array(noteSchema).default([]),
});

export const pronunciationConceptSchema = z.object({
  ...conceptBase,
  kind: z.literal("pronunciation"),
  title: localizedSchema,
  /** Target sound(s) in IPA, e.g. "/y/". */
  ipa: text,
  description: localizedSchema,
  /** Mouth / tongue guidance, in Portuguese. */
  articulation: z.array(text).min(1),
  brazilianNote: text,
  examples: z.array(z.object({ word: text, ipa: text, pt: text.optional() })).min(1),
  minimalPairs: z
    .array(
      z.tuple([
        z.object({ word: text, ipa: text, pt: text.optional() }),
        z.object({ word: text, ipa: text, pt: text.optional() }),
      ]),
    )
    .default([]),
});

export const cultureConceptSchema = z.object({
  ...conceptBase,
  kind: z.literal("culture"),
  title: localizedSchema,
  body: localizedSchema,
});

export const conceptSchema = z.discriminatedUnion("kind", [
  lexicalConceptSchema,
  grammarConceptSchema,
  pronunciationConceptSchema,
  cultureConceptSchema,
]);

// ─── Curriculum ────────────────────────────────────────────────────────────

export const TRACKS = ["core", "canada", "france"] as const;
export const trackSchema = z.enum(TRACKS);

export const lessonSchema = z.object({
  id: contentIdSchema,
  title: localizedSchema,
  objective: localizedSchema,
  minutes: z.number().int().min(1).max(20),
  steps: z.array(activitySchema).min(1),
});

export const unitSchema = z.object({
  id: contentIdSchema,
  level: levelSchema,
  track: trackSchema.default("core"),
  region: regionSchema.default("intl"),
  title: localizedSchema,
  /** What the learner can DO after the unit. */
  canDo: localizedSchema,
  lessons: z.array(lessonSchema).min(1),
  /** Optional tutor roleplay that closes the unit. */
  missionScenario: contentIdSchema.optional(),
});

export const moduleSchema = z.object({
  id: contentIdSchema,
  level: levelSchema,
  track: trackSchema.default("core"),
  title: localizedSchema,
  description: localizedSchema,
  units: z.array(unitSchema).min(1),
});

// ─── Placement ─────────────────────────────────────────────────────────────

export const placementActivitySchema = z.discriminatedUnion("type", [
  choiceActivitySchema,
  fillActivitySchema,
  typeActivitySchema,
  orderActivitySchema,
  dictationActivitySchema,
  minimalPairActivitySchema,
  readingActivitySchema,
  listeningActivitySchema,
  errorCorrectionActivitySchema,
  speakActivitySchema,
  openWritingActivitySchema,
  selfAssessActivitySchema,
]);

export const placementItemSchema = z.object({
  id: contentIdSchema,
  skill: skillSchema,
  level: levelSchema,
  /** Fine difficulty inside the band: item difficulty = band midpoint + offset. */
  offset: z.number().min(-0.45).max(0.45).default(0),
  /** Concepts this item probes (may reference concepts not yet in the curriculum). */
  concepts: z.array(conceptIdSchema).default([]),
  topic: text,
  region: regionSchema.default("intl"),
  /** Calibration items are used in the first, mixed block. */
  calibration: z.boolean().default(false),
  activity: placementActivitySchema,
});

// ─── Tutor scenarios & authentic content ───────────────────────────────────

export const scenarioSchema = z.object({
  id: contentIdSchema,
  track: trackSchema,
  region: regionSchema.default("intl"),
  minLevel: levelSchema,
  title: localizedSchema,
  setting: localizedSchema,
  /** Who the tutor plays, described in French for the model. */
  aiRole: text,
  learnerGoal: localizedSchema,
  openingLine: text,
  keyConcepts: z.array(conceptIdSchema).default([]),
});

export const authenticContentSchema = z.object({
  id: contentIdSchema,
  title: text,
  source: text,
  url: z.url(),
  kind: z.enum(["video", "audio", "podcast", "article", "radio"]),
  region: regionSchema,
  level: levelSchema,
  durationSec: z.number().int().positive().optional(),
  transcript: z.enum(["available", "partial", "none"]),
  topics: z.array(text).min(1),
  /** We only link or use official embeds; nothing is rehosted. */
  rights: z.enum(["link", "official-embed"]),
  note: localizedSchema.optional(),
  /** Day the link was last checked by a person (YYYY-MM-DD); links rot. */
  checkedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const courseSchema = z.object({
  concepts: z.array(conceptSchema),
  modules: z.array(moduleSchema),
  placementItems: z.array(placementItemSchema),
  scenarios: z.array(scenarioSchema),
  authentic: z.array(authenticContentSchema),
});

// ─── Types ─────────────────────────────────────────────────────────────────

export type Localized = z.output<typeof localizedSchema>;
export type Audio = z.output<typeof audioSchema>;
export type Prompt = z.output<typeof promptSchema>;
export type Target = z.output<typeof targetSchema>;
export type Note = z.output<typeof noteSchema>;
export type Region = z.output<typeof regionSchema>;
export type VoiceRegion = z.output<typeof voiceRegionSchema>;
export type Track = z.output<typeof trackSchema>;

export type Activity = z.output<typeof activitySchema>;
export type ActivityType = Activity["type"];
export type ActivityOf<T extends ActivityType> = Extract<Activity, { type: T }>;
export type GradedActivity = Exclude<Activity, { type: "teach" }>;
export type ComprehensionQuestion = z.output<typeof comprehensionQuestionSchema>;

export type Concept = z.output<typeof conceptSchema>;
export type LexicalConcept = z.output<typeof lexicalConceptSchema>;
export type GrammarConcept = z.output<typeof grammarConceptSchema>;
export type PronunciationConcept = z.output<typeof pronunciationConceptSchema>;
export type CultureConcept = z.output<typeof cultureConceptSchema>;

export type Lesson = z.output<typeof lessonSchema>;
export type Unit = z.output<typeof unitSchema>;
export type Module = z.output<typeof moduleSchema>;
export type PlacementItem = z.output<typeof placementItemSchema>;
export type PlacementActivity = z.output<typeof placementActivitySchema>;
export type Scenario = z.output<typeof scenarioSchema>;
export type AuthenticContent = z.output<typeof authenticContentSchema>;
export type Course = z.output<typeof courseSchema>;

/** Authoring types (defaults optional). */
export type CourseInput = z.input<typeof courseSchema>;
export type ConceptInput = z.input<typeof conceptSchema>;
export type ModuleInput = z.input<typeof moduleSchema>;
export type UnitInput = z.input<typeof unitSchema>;
export type LessonInput = z.input<typeof lessonSchema>;
export type ActivityInput = z.input<typeof activitySchema>;
export type PlacementItemInput = z.input<typeof placementItemSchema>;
export type ScenarioInput = z.input<typeof scenarioSchema>;
export type AuthenticContentInput = z.input<typeof authenticContentSchema>;
