export interface FormSummary {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  shareId: string;
  _count: {
    questions: number;
    responses: number;
  };
}
