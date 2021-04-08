export interface ServiceSearchResult {
    contentType: ContentType;
    location: string;
    name: string;
    description: string;
    qualifiedServiceName: string;
    returnType: ServiceParameter;
    parameters: ServiceParameter[];
    exceptions: string[];
}

export type ContentType = "gloop" | "code" | "bean" | "gtpl";

export interface ServiceParameter {
    typeName: string;
    name: string;
    description: string;
}

export interface SearchQuery {
    query: string;
    contentTypes?: ContentType[];
}

export const serviceSearchServicePath = "services/martini/service-search";

export const ServiceSearchService = Symbol("ServiceSearchService");

export interface ServiceSearchService {
    search(query: SearchQuery): Promise<ServiceSearchResult[]>;
}
