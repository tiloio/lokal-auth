import { assertSpyCall, spy } from "jsr:@std/testing/mock";
import { InMemoryEventBusAdapter } from "../../../event-bus/adapters/in-memory.event-bus-adapter.ts";
import { UserEventBus } from "../user-event-bus.ts";
import type { StoredUser } from "../../user.types.ts";

Deno.test("UserEventBus: can publish user created event", async () => {
    const adapter = new InMemoryEventBusAdapter();
    const eventBus = new UserEventBus(adapter);

    const callback = spy(() => Promise.resolve());

    adapter.subscribe("user.created", callback);

    const expectedUser = {
        id: "some id",
    } as StoredUser;
    await eventBus.publishUserCreatedEvent(expectedUser);

    assertSpyCall(callback, 0, {
        args: [expectedUser],
    });
});
