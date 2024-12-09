import { IndexedDbEventStoreAdapter } from "../adapters/indexeddb-event-store-adapter.ts";
import { EventStore } from "../event-store.ts";
import { assertEquals } from "jsr:@std/assert";
// indexeddb polyfill
import "https://deno.land/x/indexeddb@v1.1.0/polyfill_memory.ts";

function createTestObjects() {
    const adapter = new IndexedDbEventStoreAdapter();
    const store = new EventStore(new IndexedDbEventStoreAdapter());
    return {
        adapter,
        store,
        async [Symbol.asyncDispose]() {
            await adapter.close();
        },
    };
}

Deno.test({
    name: "EventRepository: saveEvent saves encrypted into the adapter",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        await using objects = await createTestObjects();
        const { adapter, store } = objects;

        const newEvent = {
            id: crypto.randomUUID(),
            path: "test/test",
            workspace: "test",
            user: "test",
            data: {},
            version: 0,
            date: new Date(),
            device: globalThis.navigator.userAgent,
            iv: new Uint8Array(1),
            hashedPath: [new Uint8Array(2)],
            event: new Uint8Array(3),
        };

        await store.saveEvent(newEvent);

        const events = await adapter.allEvents();
        const event = events[0];

        assertEquals(event, newEvent);
        assertEquals(events.length, 1);
    },
});
