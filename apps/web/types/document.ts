export type DocumentType = "drawing" | "contract" | "report" | "photo" | "other";

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  fileUrl: string;
  fileType: DocumentType;
  uploadedBy: string; // User name
  createdAt: string; // ISO string
  sizeBytes?: number;
}
