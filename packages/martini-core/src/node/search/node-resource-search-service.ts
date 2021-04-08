import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { inject, injectable, interfaces } from "inversify";
import { flatten } from "lodash";
import {
    FileSearchResult,
    SearchQuery,
    ResourceSearchResult,
    ResourceSearchService,
    resourceSearchServicePath
} from "../../common/search/resource-search-service";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class ResourceSearchServiceNode implements ResourceSearchService {
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;

    async search(query: SearchQuery): Promise<ResourceSearchResult[]> {
        const response = await (await this.axiosFactory.make()).get("/coder-api/search", {
            params: {
                q: query.query,
                extension: query.extension,
                type: query.type
            }
        });

        const body = response.data;

        if (response.status !== 200) {
            throw new Error(`Failed to search resource: ${JSON.stringify(body)}`);
        }

        return flatten(
            body
                .map((result: any) => {
                    const baseLocation = result.location || "";
                    if (result.records)
                        return result.records.map((record: any) => {
                            if (record.type === "path")
                                return <FileSearchResult>{
                                    type: "path",
                                    location: "/" + baseLocation + "/" + record.location,
                                    name: record.name,
                                    extension: record.extension,
                                    directory: record.file_type === "directory",
                                    lastModified: record.last_modified
                                };
                        });
                })
                .filter((records: any) => records !== undefined)
        );
    }
}

export const bindResourceSearchService = (bind: interfaces.Bind) => {
           bind(ResourceSearchService)
               .to(ResourceSearchServiceNode)
               .inSingletonScope();
           bind(ConnectionHandler)
               .toDynamicValue(
                   ctx =>
                       new JsonRpcConnectionHandler(resourceSearchServicePath, _ =>
                           ctx.container.get(ResourceSearchService)
                       )
               )
               .inSingletonScope();
       };
