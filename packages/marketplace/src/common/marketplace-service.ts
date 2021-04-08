// TODO Put Page and Pageable somewhere else so it's reusable.
export interface Page<T> {
    content: T[];
    number: number;
    totalPages: number;
}

export interface Pageable {}

export interface MartketItem {}

export namespace MarketItem {
    export enum Type {
        MARTINI_PACKAGE = "MARTINI_PACKAGE"
        /* ... */
    }
}

export interface SearchQuery {
    itemType: MarketItem.Type;
}

export interface MarketplaceService {
    searchItems(query: SearchQuery, pageable: Pageable): Promise<Page<MartketItem>>;
}
