import { IndexedDbEventStoreAdapter } from "../adapters/indexeddb-event-store-adapter.ts";
import { EventStore } from "../event-store.ts";
import { assertEquals, assertObjectMatch } from "jsr:@std/assert";
// indexeddb polyfill
import "https://deno.land/x/indexeddb@v1.1.0/polyfill_memory.ts";

Deno.test({
    name: "EventRepository: saveEvent saves encrypted into the adapter",
    async fn() {
        await using adapter = new IndexedDbEventStoreAdapter();
        const eventRepository = new EventStore(adapter);

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

        await eventRepository.saveEvent(newEvent);

        const events = await adapter.allEvents();
        const event = events[0];

        assertEquals(event, newEvent);
        assertEquals(events.length, 1);
    },
});
