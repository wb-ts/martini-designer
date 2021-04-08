export interface DocumentType {
    id: string;
    name: string;
}

export const documentTypeManagerPath = "/services/martini/tracker/document-types";

export const DocumentTypeManager = Symbol("DocumentTypeManager");

export interface DocumentTypeManager {
    getAll(): Promise<DocumentType[]>;
    save(type: DocumentType): Promise<void>;
    delete(id: string): Promise<void>;
}
