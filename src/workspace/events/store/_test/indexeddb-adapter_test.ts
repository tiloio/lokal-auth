import { IndexedDbEventStoreAdapter } from "../adapters/indexeddb-event-store-adapter.ts";
import { EventStore } from "../event-store.ts";
import { assertEquals } from "jsr:@std/assert";
// indexeddb polyfill
import "npm:fake-indexeddb@6.0.0/auto";
import { IDBFactory } from "npm:fake-indexeddb@6.0.0";
import { EventPath } from "../../event-path.ts";

function createTestObjects() {
    indexedDB = new IDBFactory();
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

Deno.test({
    name: "EventRepository: getPathEvents returns events for a specific path",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        await using objects = await createTestObjects();
        const { adapter, store } = objects;

        const newEvent = await createTestEvent(
            crypto.randomUUID(),
            "test/test",
            "workspace1",
        );
        const newEvent2 = await createTestEvent(
            crypto.randomUUID(),
            "test/test2",
            "workspace1",
        );
        const newEvent3 = await createTestEvent(
            crypto.randomUUID(),
            "test",
            "workspace1",
        );
        const newEvent4 = await createTestEvent(
            crypto.randomUUID(),
            "best",
            "workspace1",
        );
        const newEvent5 = await createTestEvent(
            crypto.randomUUID(),
            "test/test/nested",
            "workspace1",
        );
        const newEvent6 = await createTestEvent(
            crypto.randomUUID(),
            "",
            "workspace1",
        );
        const newEvent7 = await createTestEvent(
            crypto.randomUUID(),
            "test/test/",
            "workspace1",
        );
        const newEvent8 = await createTestEvent(
            crypto.randomUUID(),
            "test/",
            "workspace1",
        );
        const newEvent9 = await createTestEvent(
            crypto.randomUUID(),
            "test/test/nested/deep",
            "workspace1",
        );
        const newEvent10 = await createTestEvent(
            crypto.randomUUID(),
            "test/test",
            "workspace2",
        );

        await Promise.all([
            store.saveEvent(newEvent),
            store.saveEvent(newEvent2),
            store.saveEvent(newEvent3),
            store.saveEvent(newEvent4),
            store.saveEvent(newEvent5),
            store.saveEvent(newEvent6),
            store.saveEvent(newEvent7),
            store.saveEvent(newEvent8),
            store.saveEvent(newEvent9),
            store.saveEvent(newEvent10),
        ]);

        const events = await adapter.getPathEvents(
            newEvent.workspace,
            await EventPath.hash("test/test"),
        );

        const sortedEvents = [...events].sort((a, b) =>
            JSON.stringify(a).localeCompare(JSON.stringify(b))
        );
        const expectedEvents = [newEvent, newEvent5, newEvent7, newEvent9].sort(
            (a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)),
        );

        assertEquals(
            sortedEvents.map((event) => event.path),
            expectedEvents.map((event) => event.path),
        );
        assertEquals(sortedEvents, expectedEvents);
    },
});

Deno.test({
    name:
        "EventRepository: getWorkspaceEvents returns all events for a specific workspace",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        await using objects = await createTestObjects();
        const { adapter, store } = objects;

        const newEvent = await createTestEvent(
            crypto.randomUUID(),
            "test/test",
            "workspace1",
        );

        const newEvent2 = await createTestEvent(
            crypto.randomUUID(),
            "test/test",
            "workspace2",
        );

        await Promise.all([
            store.saveEvent(newEvent),
            store.saveEvent(newEvent2),
        ]);

        const events = await adapter.getWorkspaceEvents("workspace1");

        assertEquals(
            events.map((event) => {
                return { id: event.id, workspace: event.workspace };
            }),
            [
                { id: newEvent.id, workspace: newEvent.workspace },
            ],
        );
        assertEquals(events, [newEvent]);
    },
});

Deno.test({
    name:
        "EventRepository: getWorkspaceEvent returns event for specific workspace and id",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        await using objects = await createTestObjects();
        const { adapter, store } = objects;

        const eventId = crypto.randomUUID();
        const newEvent = await createTestEvent(
            eventId,
            "test/test",
            "workspace1",
        );

        const otherEvent = await createTestEvent(
            crypto.randomUUID(),
            "test/test",
            "workspace1",
        );

        const sameIdDifferentWorkspace = await createTestEvent(
            eventId,
            "different/path",
            "workspace2",
        );

        await Promise.all([
            store.saveEvent(newEvent),
            store.saveEvent(otherEvent),
            store.saveEvent(sameIdDifferentWorkspace),
        ]);

        const event = await adapter.getWorkspaceEvent("workspace1", eventId);

        assertEquals(event, newEvent);
    },
});

async function createTestEvent(id: string, path: string, workspace: string) {
    return {
        id,
        path: path,
        hashedPath: await EventPath.hash(path),
        workspace: workspace,
        user: "test",
        data: {},
        version: 0,
        date: new Date(),
        device: globalThis.navigator.userAgent,
        iv: new Uint8Array(1),
        event: new Uint8Array(3),
    };
}
