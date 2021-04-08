import { injectable } from "inversify";

export const WelcomeDataProvider = Symbol("WelcomeDataProvider");

export interface WelcomeDataProvider {
    getWelcomeData(): Promise<WelcomeData>;
}

@injectable()
export class WelcomeDataProviderImpl implements WelcomeDataProvider {
    static readonly WELCOME_DATA_URL = "https://static.torocloud.com/martini-desktop/welcome-page/data.json";

    async getWelcomeData(): Promise<WelcomeData> {
        const response = await fetch(WelcomeDataProviderImpl.WELCOME_DATA_URL);
        const json = await response.text();
        return JSON.parse(json);
    }
}

export interface WelcomeData {
    banner: {
        title: string;
        link: string;
        content: string;
    };

    categories: Category[];
}

export interface Category {
    categoryTitle: string;
    image: string;
    description: string;
    sub_categories: SubCategory[];
}

export interface SubCategory {
    subCategoryTitle: string;
    image: string;
    description: string;
    videos: Video[];
}

export interface Video {
    title: string;
    videoUrl: string;
    videoDuration: string;
    featuredInCoder: true;
}
