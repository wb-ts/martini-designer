import axios from "axios";
import { encode } from "base64-arraybuffer";
import { injectable } from "inversify";
import { UrlReader } from "../../common/fs/url-reader";

@injectable()
export class UrlReaderNode implements UrlReader {
    async read(url: string): Promise<string> {
        const response = await axios({
            url,
            method: "get",
            transformResponse: data => data,
            responseType: "arraybuffer"
        });

        const buffer = response.data as ArrayBuffer;

        if (response.headers["Content-Type"] && response.headers["Content-Type"].includes("application/octet-stream")) {
            return encode(buffer);
        }

        return Buffer.from(buffer).toString("utf8");
    }

    async readAsBuffer(url: string): Promise<ArrayBuffer> {
        const response = await axios({
            url,
            method: "get",
            responseType: "arraybuffer"
        });

        return response.data as ArrayBuffer;
    }
}
