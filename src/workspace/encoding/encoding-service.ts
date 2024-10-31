import type { EncodingAdapter } from "./adapters/event-encoding-adapter.types.ts";
import type { DecryptedEventData } from "../events/types.ts";

export class EncodingService {
    constructor(public readonly adapter: EncodingAdapter) {}

    encode<T>(data: DecryptedEventData<T>): Uint8Array {
        return this.adapter.encode(data);
    }

    decode<T>(data: Uint8Array): DecryptedEventData<T> {
        const eventData = this.adapter.decode(
            data,
        );

        if (
            !eventData || typeof eventData !== "object"
        ) {
            throw error(eventData, "eventData", "object");
        }

        if (
            !("date" in eventData) ||
            !(typeof eventData.date === "bigint" ||
                typeof eventData.date === "number")
        ) {
            throw error(eventData, "date", "number");
        }

        if (
            !("path" in eventData) ||
            typeof eventData.path !== "string" || !eventData.path
        ) {
            throw error(eventData, "path", "number");
        }

        if (
            !("device" in eventData) ||
            typeof eventData.device !== "string" || !eventData.device
        ) {
            throw error(eventData, "device", "string");
        }

        if (
            !eventData || typeof eventData !== "object" ||
            !("data" in eventData)
        ) {
            throw error(eventData, "data", "any");
        }

        if (
            !eventData || typeof eventData !== "object" ||
            !("user" in eventData) ||
            typeof eventData.user !== "string" || !eventData.user
        ) {
            throw error(eventData, "user", "string");
        }

        return {
            device: eventData.device,
            date: Number(eventData.date),
            path: eventData.path,
            data: eventData.data as T,
            user: eventData.user,
        };
    }
}

//deno-lint-ignore no-explicit-any
function error(eventData: any, name: string, type: string) {
    return new Error(
        `No valid "${name}" property as ${type}. Got "${
            eventData?.[name]
        }" as type "${typeof eventData?.[name]}"`,
    );
}
