import type { EventBusAdapter } from "../../event-bus/adapters/event-bus-adapter.types.ts";
import type { StoredUser } from "../user.types.ts";

export class UserEventBus {
    constructor(private readonly adapter: EventBusAdapter) {}

    async publishUserCreatedEvent(user: StoredUser): Promise<void> {
        await this.adapter.publish("user.created", user);
    }
}
