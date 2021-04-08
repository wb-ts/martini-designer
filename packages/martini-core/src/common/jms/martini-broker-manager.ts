export const martiniBrokerPath = "/services/martini/broker";
export const destinationPattern = /^(queue|topic):\/\/([\w\d\W]+)$/;

export interface Destination {
    type: DestinationType;
    name: string;
}

export namespace Destination {
    export function getType(destination: string): DestinationType {
        if (destination.startsWith("queue://")) return DestinationType.QUEUE;
        else if (destination.startsWith("topic://")) return DestinationType.TOPIC;
        throw Error("Invalid destination syntax, valid syntax is " + destinationPattern);
    }

    export function getName(destination: string): string {
        return destination.replace(/^(topic|queue):\/\//, "");
    }

    export function toString(destination: Destination): string {
        return `${destination.type.toLowerCase()}://${destination.name}`;
    }

    export function toDestination(destinationString: string): Destination | undefined {
        try {
            return {
                type: Destination.getType(destinationString),
                name: Destination.getName(destinationString)
            };
        } catch (error) {
            return undefined;
        }
    }

    export function equals(destination: Destination, other: Destination) {
        return destination.name === other.name && destination.type === other.type;
    }
}

export enum DestinationType {
    QUEUE = "QUEUE",
    TOPIC = "TOPIC"
}

export const MartiniBrokerManager = Symbol("MartiniBrokerManager");

export interface MartiniBrokerManager {
    getDestinations(): Promise<Destination[]>;

    sendString(destination: string, message: string): Promise<void>;

    sendBytes(destination: string, message: string): Promise<void>;

    sendBytesFromUrl(destination: string, url: string): Promise<void>;
}
