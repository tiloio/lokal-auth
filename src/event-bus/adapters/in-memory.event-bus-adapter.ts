import type {
    EventBusAdapter,
    EventCallback,
    EventName,
} from "./event-bus-adapter.types.ts";

export class InMemoryEventBusAdapter implements EventBusAdapter {
    private readonly listeners = new Map<EventName, EventCallback[]>();

    subscribe(eventName: EventName, callback: EventCallback): void {
        const listeners = this.listeners.get(eventName) ?? [];
        listeners.push(callback);
        this.listeners.set(eventName, listeners);
    }

    unsubscribe(eventName: EventName, callback: EventCallback): void {
        const listeners = this.listeners.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    async publish(eventName: EventName, data: unknown): Promise<void> {
        const listeners = this.listeners.get(eventName);
        if (listeners) {
            for (const listener of listeners) {
                await listener(data);
            }
        }
    }
}
