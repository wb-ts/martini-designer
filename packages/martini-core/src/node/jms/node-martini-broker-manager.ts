import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { decode } from "base64-arraybuffer";
import { inject, injectable, interfaces } from "inversify";
import { UrlReader } from "../../common/fs/url-reader";
import { Destination, MartiniBrokerManager, martiniBrokerPath } from "../../common/jms/martini-broker-manager";
import { AxiosInstanceFactory } from "../http/axios-instance-factory";

@injectable()
export class MartiniBrokerManagerNode implements MartiniBrokerManager {
    @inject(UrlReader)
    private readonly urlReader: UrlReader;
    @inject(AxiosInstanceFactory)
    private readonly axiosFactory: AxiosInstanceFactory;

    async getDestinations(): Promise<Destination[]> {
        const response = await (await this.axiosFactory.make()).get("/esbapi/broker/destinations", {
            params: { size: 1000 }
        });

        if (response.status !== 200) return [];

        return response.data.items.map(
            (item: any) =>
                ({
                    type: item.type.toUpperCase(),
                    name: item.name
                } as Destination)
        );
    }

    async sendString(destination: string, message: string): Promise<void> {
        const _destination = this.getDestination(destination);
        await (await this.axiosFactory.make()).post(
            `/esbapi/broker/destinations/${_destination.type.toLowerCase()}/${_destination.name}/sendString`,
            message,
            {
                headers: {
                    "Content-Type": "text/plain"
                }
            }
        );
    }

    async sendBytes(destination: string, message: string): Promise<void> {
        await this._sendBytes(destination, decode(message));
    }

    async sendBytesFromUrl(destination: string, url: string): Promise<void> {
        const message = await this.urlReader.readAsBuffer(url);
        await this._sendBytes(destination, message);
    }

    async _sendBytes(destination: string, message: ArrayBuffer): Promise<void> {
        const _destination = this.getDestination(destination);
        await (await this.axiosFactory.make()).post(
            `/esbapi/broker/destinations/${_destination.type.toLowerCase()}/${_destination.name}/sendBytes`,
            message,
            {
                headers: {
                    "Content-Type": "application/octet-stream"
                }
            }
        );
    }

    private getDestination(destination: string): Destination {
        const _destination = Destination.toDestination(destination);
        if (!_destination) throw Error(`Invalid destination: '${destination}'`);
        return _destination;
    }
}

export const bindBrokerManager = (bind: interfaces.Bind) => {
    bind(MartiniBrokerManager)
        .to(MartiniBrokerManagerNode)
        .inSingletonScope();

    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler(martiniBrokerPath, _ =>
                    ctx.container.get<MartiniBrokerManager>(MartiniBrokerManager)
                )
        )
        .inSingletonScope();
};
