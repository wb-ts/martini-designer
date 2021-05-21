import { BackendApplicationContribution } from "@theia/core/lib/node/backend-application";
import * as express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { inject, injectable } from "inversify";
import { MartiniInstanceInfo, MartiniInstanceInfoManager } from "../../common/instance/martini-instance-info-manager";

@injectable()
export class ProxyBackendContribution implements BackendApplicationContribution {
    @inject(MartiniInstanceInfoManager)
    private readonly instanceInfoManager: MartiniInstanceInfoManager;

    async configure?(app: express.Application): Promise<void> {
        const instance = await this.instanceInfoManager.get();
        app.use(
            "/*",
            createProxyMiddleware({
                target: MartiniInstanceInfo.getUri(instance).toString()
            })
        );
    }
}
