import type { EventBusAdapter } from "../../message-bus/adapters/EventBusAdapter.ts";
import type { StoredUser } from "../user.types.ts";

export class UserEventBus {
    constructor(private readonly adapter: EventBusAdapter) {}

    async publishUserCreatedEvent(user: StoredUser): Promise<void> {
        await this.adapter.publish("user.created", user);
    }
}
