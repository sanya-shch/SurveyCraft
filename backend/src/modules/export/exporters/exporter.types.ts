import { Question, Response as SurveyResponse } from "@prisma/client";

export type ExportData = {
  form: {
    id: string;
    title: string;
    description: string | null;
  };
  questions: Question[];
  responses: SurveyResponse[];
};

export type GeneratedFile = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

export type Exporter = (data: ExportData) => Promise<GeneratedFile>;
