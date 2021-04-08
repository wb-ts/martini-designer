export const UrlReader = Symbol("UrlReader");

export interface UrlReader {
    read(url: string): Promise<string>;
    readAsBuffer(url: string): Promise<ArrayBuffer>;
}

export const urlReaderPath = "/services/martini/filesystem/url-reader";
