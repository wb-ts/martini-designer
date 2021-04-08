import axios, { AxiosInstance, AxiosResponse } from "axios";
import { inject, injectable, multiInject, optional } from "inversify";
import { MartiniInstanceInfo, MartiniInstanceInfoManager } from "../../common/instance/martini-instance-info-manager";

export const AxiosInstanceFactory = Symbol("AxiosInstanceFactory");

export interface AxiosInstanceFactory {
    make(): Promise<AxiosInstance>;
}

export const AxiosInstanceContribution = Symbol("AxiosInstanceContribution");

export interface AxiosInstanceContribution {
    configure: (instance: AxiosInstance) => void;
}

@injectable()
export class CachingAxiosInstanceFactory implements AxiosInstanceFactory {
    @inject(MartiniInstanceInfoManager)
    private readonly instanceInfoManager: MartiniInstanceInfoManager;

    @optional()
    @multiInject(AxiosInstanceContribution)
    private readonly contributions: AxiosInstanceContribution[];

    private instance: AxiosInstance | undefined;

    async make(): Promise<AxiosInstance> {
        if (this.instance) return this.instance;

        return (this.instance = await this.createInstance());
    }

    private async createInstance(): Promise<AxiosInstance> {
        const info = await this.instanceInfoManager.get();

        const instance = axios.create({
            baseURL: MartiniInstanceInfo.getUri(info).toString()
        });
        this.contributions?.forEach(contrib => contrib.configure(instance));
        return instance;
    }
}

export class ApiError extends Error {
    constructor(message: string, readonly response: AxiosResponse) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
