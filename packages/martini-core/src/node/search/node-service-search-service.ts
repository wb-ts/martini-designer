import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { inject, injectable, interfaces } from "inversify";
import { flatten } from "lodash";
import {
    SearchQuery,
    ServiceSearchResult,
    ServiceSearchService,
    serviceSearchServicePath
} from "../../common/search/service-search-service";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class ServiceSearchServiceNode implements ServiceSearchService {
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;

    async search(query: SearchQuery): Promise<ServiceSearchResult[]> {
        const response = await (await this.axiosFactory.make()).get("/coder-api/search/service", {
            params: {
                q: query.query,
                contentType: query.contentTypes
                    ? query.contentTypes.map(type => type.replace("code", "gloop-service")).join(",")
                    : undefined
            }
        });

        const body = response.data;

        if (response.status !== 200) throw new Error(`Failed to search service: ${JSON.stringify(body)}`);

        return flatten(
            body.matches.map((match: any) =>
                match.entries.map((entry: any) => ({
                    contentType: match.content_type === "gloop-service" ? "code" : match.content_type,
                    location: match.location,
                    name: entry.name,
                    description: entry.description,
                    qualifiedServiceName: entry.qualifiedServiceName,
                    returnType: entry.returnType,
                    parameters: entry.parameters,
                    exceptions: entry.exceptions
                }))
            )
        );
    }
}

export const bindServiceSearchService = (bind: interfaces.Bind) => {
    bind(ServiceSearchService)
        .to(ServiceSearchServiceNode)
        .inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx => new JsonRpcConnectionHandler(serviceSearchServicePath, _ => ctx.container.get(ServiceSearchService))
        )
        .inSingletonScope();
};
