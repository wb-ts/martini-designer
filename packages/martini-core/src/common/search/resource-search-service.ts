export type SearchRecordType = "path";

export interface ResourceSearchResult {
    type: SearchRecordType;
    location: string;
}

export interface FileSearchResult extends ResourceSearchResult {
    directory: boolean;
    name: string;
    extension: string;
    lastModified: number;
}

export namespace FileSearchResult {
    export function is(object: any): object is FileSearchResult {
        return object.type === "path";
    }
}

export const resourceSearchServicePath = "services/martini/resource-search";

export interface SearchQuery {
    query: string;
    type?: SearchRecordType;
    extension?: string;
}

export const ResourceSearchService = Symbol("ResourceSearchService");

export interface ResourceSearchService {
    search(query: SearchQuery): Promise<ResourceSearchResult[]>;
}
