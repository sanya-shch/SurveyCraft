import type { FormState } from "./formBuilder";

export interface Form extends FormState {
  id: string;
  userId: string;
  isPublished: boolean;
  shareId: string;
  createdAt: string;
}
