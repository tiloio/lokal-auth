import type { UserEventName } from "../../user/event-bus/user-event-bus.types.ts";

export interface EventBusAdapter {
    subscribe(eventName: EventName, callback: EventCallback): void;
    unsubscribe(eventName: EventName, callback: EventCallback): void;
    publish(eventName: EventName, data: unknown): void;
}

export type EventName = UserEventName;

export type EventCallback = (data: unknown) => Promise<void>;
