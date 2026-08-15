export type ConditionOperator = "equals" | "notEquals" | "contains" | "in" | "gt" | "lt";

export type ConditionValue = string | number | boolean | string[];

export interface ConditionRule {
  questionId: string;
  operator: ConditionOperator;
  value: ConditionValue;
}

export interface ConditionGroup {
  logic: "AND" | "OR";
  rules: ConditionRule[];
}
