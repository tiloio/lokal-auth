import type { EventCallback, EventName } from "./event-bus-adapter.types.ts";

export interface EventBusAdapter {
    subscribe(eventName: EventName, callback: EventCallback): void;
    unsubscribe(eventName: EventName, callback: EventCallback): void;
    publish(eventName: EventName, data: unknown): void;
}
