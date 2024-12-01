import { InMemoryEventBusAdapter } from "../in-memory.event-bus-adapter.ts";
import { assertSpyCall, assertSpyCalls, spy } from "jsr:@std/testing/mock";

Deno.test("InMemoryEventBusAdapter: can subscribe and unsubscribe to events", async () => {
    const adapter = new InMemoryEventBusAdapter();

    const callback1 = spy(() => Promise.resolve());
    const callback2 = spy(() => Promise.resolve());
    const callback3 = spy(() => Promise.resolve());

    adapter.subscribe("user.created", callback1);
    adapter.subscribe("user.created", callback2);
    adapter.subscribe("user.updated", callback3);

    await adapter.publish("user.created", "some data1");
    await adapter.publish("user.updated", "some data2");

    adapter.unsubscribe("user.created", callback1);
    adapter.unsubscribe("user.created", callback1);

    await adapter.publish("user.created", "some data3");
    adapter.unsubscribe("user.created", callback2);

    assertSpyCalls(callback1, 1);
    assertSpyCall(callback1, 0, { args: ["some data1"] });

    assertSpyCalls(callback3, 1);
    assertSpyCall(callback3, 0, { args: ["some data2"] });

    assertSpyCalls(callback2, 2);
    assertSpyCall(callback2, 0, { args: ["some data1"] });
    assertSpyCall(callback2, 1, { args: ["some data3"] });
});
