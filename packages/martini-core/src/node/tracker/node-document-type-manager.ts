import { DocumentTypeManager, DocumentType } from "../../common/tracker/document-type-manager";
import { injectable, inject } from "inversify";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class DocumentTypeManagerNode implements DocumentTypeManager {
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;

    async getAll(): Promise<DocumentType[]> {
        const response = await (await this.axiosFactory.make()).get("/esbapi/tracker/document-types", {
            params: {
                page: 0,
                size: 1000
            }
        });

        return response.data.items as DocumentType[];
    }

    async save(type: DocumentType): Promise<void> {
        await (await this.axiosFactory.make()).post("/esbapi/tracker/document-types", type);
    }

    async delete(id: string): Promise<void> {
        await (await this.axiosFactory.make()).delete(`/esbapi/tracker/document-types/${id}`);
    }
}
