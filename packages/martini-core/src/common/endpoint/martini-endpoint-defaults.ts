import { EndpointType, MartiniEndpoint, RssEndpoint , EmailEndpoint } from "./martini-endpoint-manager";

export const createDefaultEndpoint = (packageName: string, name: string, type: EndpointType): MartiniEndpoint => {
    switch (type) {
        case EndpointType.RSS:
            return createDefaultRssEndpoint(packageName, name);
        case EndpointType.EMAIL:
            return createDefaultEmailEndpoint(packageName, name);
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

const createDefaultEmailEndpoint = (packageName: string, name: string): EmailEndpoint => ({
    name,
    type: EndpointType.EMAIL,
    packageName,
    service: "",
    modifiable: true,
    replicated: true,
    status: "STOPPED",
    documentType: "E-Mail",
    enabled: true,
    track: false,
    schedule: "repeating:1000",
    host: "",
    port: 993,
    username : "",
    password : "",
    deleteOnReceive : false ,
    sendReplyOnError : false ,
    sendOutputAsReply : false ,
    protocol : "imap" ,
    ssl : false,
    replyEmailSettings : {
        host: "",
        port: 1,
        username: "",
        password: "",
        ssl: false,
        from: ""
    }
});
