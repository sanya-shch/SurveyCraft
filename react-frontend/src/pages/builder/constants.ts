import {
  calendarIcon,
  choiceMultiIcon,
  choiceSingleIcon,
  numberIcon,
  textIcon,
  toggleIcon,
} from "../../components/ui/icons";
import { QUESTION_TYPE_LABELS } from "../../constants";
import type { QuestionType } from "../../types/formBuilder";

interface SidebarItem {
  type: QuestionType;
  label: string;
  icon: string | React.ReactNode;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { type: "TEXT", label: QUESTION_TYPE_LABELS.TEXT, icon: textIcon },
  { type: "NUMBER", label: QUESTION_TYPE_LABELS.NUMBER, icon: numberIcon },
  { type: "CHOICE_SINGLE", label: QUESTION_TYPE_LABELS.CHOICE_SINGLE, icon: choiceSingleIcon },
  { type: "CHOICE_MULTI", label: QUESTION_TYPE_LABELS.CHOICE_MULTI, icon: choiceMultiIcon },
  { type: "BOOLEAN", label: QUESTION_TYPE_LABELS.BOOLEAN, icon: toggleIcon },
  {
    type: "DATE",
    label: QUESTION_TYPE_LABELS.DATE,
    icon: calendarIcon,
  },
];
