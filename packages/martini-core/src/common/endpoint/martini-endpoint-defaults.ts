import { EndpointType, MartiniEndpoint, RssEndpoint } from "./martini-endpoint-manager";

export const createDefaultEndpoint = (packageName: string, name: string, type: EndpointType): MartiniEndpoint => {
    switch (type) {
        case EndpointType.RSS:
            return createDefaultRssEndpoint(packageName, name);
        default:
            return {
                name,
                type,
                packageName,
                status: "STOPPED",
                enabled: true
            } as MartiniEndpoint;
    }
};

const createDefaultRssEndpoint = (packageName: string, name: string): RssEndpoint => ({
    name,
    type: EndpointType.RSS,
    packageName,
    service: "",
    modifiable: true,
    replicated: true,
    status: "STOPPED",
    documentType: "RSS",
    enabled: true,
    track: false,
    schedule: "repeating:1000",
    rssUrl: "",
    onlyNew: false
});
