"use client";

import type { ClientActivity, ClientFeedback } from "@/lib/learning/activities/client";
import type { SupportMode } from "@/lib/learning/language-support";
import type { Draft } from "./draft";
import {
  ChoiceRenderer,
  ListeningRenderer,
  MinimalPairRenderer,
  MultiSelectRenderer,
  ReadingRenderer,
  SelfAssessRenderer,
} from "./renderers/choice";
import { MatchRenderer, OrderRenderer, SpeakRenderer } from "./renderers/interactive";
import { TeachCard } from "./renderers/teach";
import {
  DictationRenderer,
  ErrorCorrectionRenderer,
  FillRenderer,
  OpenWritingRenderer,
  TypeRenderer,
} from "./renderers/text";

export interface ActivityRendererProps {
  activity: ClientActivity;
  draft: Draft;
  onDraft: (draft: Draft) => void;
  locked: boolean;
  feedback?: ClientFeedback;
  support: SupportMode;
}

export function ActivityRenderer(props: ActivityRendererProps) {
  const { activity } = props;
  switch (activity.type) {
    case "teach":
      return <TeachCard activity={activity} support={props.support} />;
    case "choice":
      return <ChoiceRenderer {...props} activity={activity} />;
    case "multi_select":
      return <MultiSelectRenderer {...props} activity={activity} />;
    case "minimal_pair":
      return <MinimalPairRenderer {...props} activity={activity} />;
    case "reading":
      return <ReadingRenderer {...props} activity={activity} />;
    case "listening":
      return <ListeningRenderer {...props} activity={activity} />;
    case "self_assess":
      return <SelfAssessRenderer {...props} activity={activity} />;
    case "type":
      return <TypeRenderer {...props} activity={activity} />;
    case "dictation":
      return <DictationRenderer {...props} activity={activity} />;
    case "error_correction":
      return <ErrorCorrectionRenderer {...props} activity={activity} />;
    case "open_writing":
      return <OpenWritingRenderer {...props} activity={activity} />;
    case "fill":
      return <FillRenderer {...props} activity={activity} />;
    case "order":
      return <OrderRenderer {...props} activity={activity} />;
    case "match":
      return <MatchRenderer {...props} activity={activity} />;
    case "speak":
      return <SpeakRenderer {...props} activity={activity} />;
  }
}
